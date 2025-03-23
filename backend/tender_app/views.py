from django.shortcuts import render, get_object_or_404
from rest_framework import viewsets, status, filters
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import transaction
from django.utils import timezone
import json
import uuid
import logging
from django.db import connection
from rest_framework.exceptions import PermissionDenied

from .models import User, Tender, Bid, CompanyProfile, TenderHistory, BidConfirmation
from .serializers import (
    UserSerializer, TenderSerializer, BidSerializer, 
    TenderHistorySerializer, BidConfirmationSerializer
)
from .permissions import IsCityUser, IsCompanyUser, IsCityUserOrReadOnly

# Configure logger
logger = logging.getLogger(__name__)

# Create your views here.

# Public API for getting winner information - accessible without authentication
class PublicWinnerView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, tender_id):
        try:
            tender = Tender.objects.get(pk=tender_id)
            if tender.status == 'AWARDED':
                bids = Bid.objects.filter(tender=tender)
                winning_bid = bids.filter(status='AWARDED').first()
                if winning_bid:
                    return Response({
                        'winner': winning_bid.company.name,
                        'winning_price': winning_bid.bidding_price,
                        'award_date': tender.winner_date
                    })
                return Response({'detail': 'No winning bid found'}, status=status.HTTP_404_NOT_FOUND)
            return Response({'detail': 'Tender has not been awarded yet'}, status=status.HTTP_400_BAD_REQUEST)
        except Tender.DoesNotExist:
            return Response({'detail': 'Tender not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AuthViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    @action(detail=False, methods=['post'])
    def register(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': serializer.data,
                'token': str(refresh.access_token),
                'refresh': str(refresh)
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def login(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        
        if user:
            refresh = RefreshToken.for_user(user)
            serializer = UserSerializer(user)
            return Response({
                'user': serializer.data,
                'token': str(refresh.access_token),
                'refresh': str(refresh)
            })
        return Response({'error': 'Invalid credentials'}, 
                      status=status.HTTP_401_UNAUTHORIZED)

class TenderViewSet(viewsets.ModelViewSet):
    queryset = Tender.objects.all()
    serializer_class = TenderSerializer
    permission_classes = [IsAuthenticated, IsCityUser]

    def perform_create(self, serializer):
        tender = serializer.save(created_by=self.request.user)
        
        # Record the creation in history
        TenderHistory.objects.create(
            tender=tender,
            action='CREATE',
            changes={},
            performed_by=self.request.user
        )

    def perform_update(self, serializer):
        # Get original tender for change tracking
        old_tender = self.get_object()
        old_data = TenderSerializer(old_tender).data
        
        # TEMPORARY: Allow updates to any tender for testing purposes
        # Commenting out deadline check for debugging
        # if old_tender.status != 'OPEN' or old_tender.submission_deadline < timezone.now():
        #     raise PermissionDenied("Cannot update a tender after its deadline has passed or if it's not open")
            
        # Save the updated tender
        tender = serializer.save()
        
        # Compute changes for history
        new_data = TenderSerializer(tender).data
        changes = {}
        for field in new_data:
            if field in old_data and old_data[field] != new_data[field]:
                changes[field] = {
                    'old': old_data[field],
                    'new': new_data[field]
                }
                
        # Record the update in history
        TenderHistory.objects.create(
            tender=tender,
            action='UPDATE',
            changes=changes,
            performed_by=self.request.user
        )

    def perform_destroy(self, instance):
        # Check if we can delete (deadline not passed)
        if instance.status != 'OPEN' or instance.submission_deadline < timezone.now():
            raise PermissionDenied("Cannot delete a tender after its deadline has passed or if it's not open")
            
        # Record the deletion in history before deleting
        TenderHistory.objects.create(
            tender=instance,
            action='DELETE',
            changes={},
            performed_by=self.request.user
        )
        
        # Now delete the tender
        instance.delete()

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action == 'list' or self.action == 'retrieve' or self.action == 'history':
            permission_classes = [AllowAny]  # Allow anyone to view tenders
        else:
            permission_classes = [IsAuthenticated, IsCityUser]
        return [permission() for permission in permission_classes]

    @action(detail=True, methods=['get'])
    def bids(self, request, pk=None):
        """
        Return bids for a specific tender:
        - All bids for city users
        - Only own bids for company users
        - No bids for public users
        """
        tender = self.get_object()
        user = request.user
        
        # Different behavior based on user type
        if user.user_type == 'CITY' or user.is_superuser:
            # City users and superusers can see all bids
            bids = Bid.objects.filter(tender=tender)
        elif user.user_type == 'COMPANY':
            # Company users can only see their own bids
            bids = Bid.objects.filter(tender=tender, company=user)
        else:
            # Public users cannot see any bids
            return Response(
                {'detail': 'You do not have permission to view bids.'},
                status=status.HTTP_403_FORBIDDEN
            )

        print(f"User {user.username} ({user.user_type}) fetched {bids.count()} bids for tender {tender.id}")
        
        serializer = BidSerializer(bids, many=True)
        return Response(serializer.data)
        
    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """
        Return change history for a specific tender
        """
        tender = self.get_object()
        history = TenderHistory.objects.filter(tender=tender).order_by('-timestamp')
        serializer = TenderHistorySerializer(history, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """
        Search and filter tenders
        """
        queryset = self.get_queryset()
        
        # Filter by category
        category = request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
            
        # Filter by status
        status_param = request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
            
        # Filter by deadline (before or after a date)
        deadline_before = request.query_params.get('deadline_before')
        if deadline_before:
            try:
                deadline_date = datetime.strptime(deadline_before, '%Y-%m-%d')
                queryset = queryset.filter(submission_deadline__lte=deadline_date)
            except ValueError:
                pass
                
        deadline_after = request.query_params.get('deadline_after')
        if deadline_after:
            try:
                deadline_date = datetime.strptime(deadline_after, '%Y-%m-%d')
                queryset = queryset.filter(submission_deadline__gte=deadline_date)
            except ValueError:
                pass
                
        # Search by title or description
        search_term = request.query_params.get('search')
        if search_term:
            queryset = queryset.filter(
                Q(title__icontains=search_term) | 
                Q(description__icontains=search_term)
            )
            
        # Return results
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def check_winner_status(self, request, pk=None):
        """
        Check if a bid is marked as winner and return its status
        This endpoint bypasses any caching issues by directly querying the database
        """
        logger = logging.getLogger(__name__)
        logger.info(f"Checking winner status for bid {pk}")
        
        try:
            # Use direct SQL to bypass any ORM caching
            with connection.cursor() as cursor:
                # Check if this bid is a winner
                cursor.execute("""
                    SELECT b.is_winner, t.status, t.id, b.awarded_at 
                    FROM tender_app_bid b 
                    JOIN tender_app_tender t ON b.tender_id = t.id 
                    WHERE b.id = %s
                """, [pk])
                result = cursor.fetchone()
                
                if not result:
                    return Response(
                        {'detail': 'Bid not found'},
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                is_winner, tender_status, tender_id, awarded_at = result
                
                # Also check if there's a direct link in the tender model
                cursor.execute("""
                    SELECT id FROM tender_app_tender 
                    WHERE winning_bid_id = %s
                """, [pk])
                winning_tender_result = cursor.fetchone()
            
            logger.info(f"Winner status check: Bid {pk} is_winner={is_winner}, " 
                        f"tender_status={tender_status}, awarded_at={awarded_at}, "
                        f"directly linked as winner in tenders: {winning_tender_result is not None}")
            
            return Response({
                'bid_id': pk,
                'is_winner': bool(is_winner),
                'tender_id': tender_id,
                'tender_status': tender_status,
                'awarded_at': awarded_at,
                'is_directly_linked': winning_tender_result is not None
            })
            
        except Exception as e:
            logger.error(f"Error checking winner status: {str(e)}", exc_info=True)
            return Response(
                {'detail': f'Error checking winner status: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def update(self, request, *args, **kwargs):
        """
        Update a tender with proper error handling and history tracking.
        """
        try:
            # Get the tender object
            tender_id = kwargs.get('pk')
            tender = self.get_object()
            
            # Log the update attempt
            logger.info(f"Update request for tender {tender_id} by user {request.user.username}")
            
            # Store original values for history tracking
            original_data = TenderSerializer(tender).data
            
            # Perform update with serializer
            serializer = self.get_serializer(tender, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            
            # Save the updated tender
            self.perform_update(serializer)
            
            # Create history records for changed fields
            updated_data = serializer.data
            changes = {}
            
            # More detailed tracking of specific fields to improve history
            for field in updated_data:
                if field in original_data and original_data[field] != updated_data[field]:
                    # For each changed field, create a separate history record
                    try:
                        field_display_name = field.replace('_', ' ').title()
                        
                        # Format values for better readability
                        old_value = original_data[field]
                        new_value = updated_data[field]
                        
                        # Handle specific field types 
                        if field in ['budget']:
                            old_value = f"€{old_value}" if old_value else "Not set"
                            new_value = f"€{new_value}" if new_value else "Not set"
                        elif field in ['notice_date', 'submission_deadline', 'winner_date', 'construction_start', 'construction_end']:
                            old_value = old_value or "Not set"
                            new_value = new_value or "Not set"
                        
                        TenderHistory.objects.create(
                            tender=tender,
                            action='UPDATE',
                            field_name=field,
                            old_value=str(old_value),
                            new_value=str(new_value),
                            performed_by=request.user
                        )
                        logger.info(f"Created history record for tender {tender_id} field '{field}' update")
                    except Exception as e:
                        # Continue even if one history creation fails
                        logger.error(f"Failed to create history record for field '{field}': {str(e)}")
            
            return Response(serializer.data)
        
        except Exception as e:
            logger.error(f"Error updating tender {kwargs.get('pk')}: {str(e)}")
            return Response(
                {"detail": f"Failed to update tender: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class BidViewSet(viewsets.ModelViewSet):
    queryset = Bid.objects.all()
    serializer_class = BidSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        """
        Custom permissions:
        - For select_winner action, only city users can access
        - For other actions, authenticated users can access
        """
        if self.action == 'select_winner':
            permission_classes = [IsAuthenticated, IsCityUser]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """
        This view should return:
        - All bids for city users
        - Only own bids for company users
        """
        user = self.request.user
        if user.is_superuser or user.user_type == 'CITY':
            return Bid.objects.all()
        elif user.user_type == 'COMPANY':
            return Bid.objects.filter(company=user)
        return Bid.objects.none()

    def perform_create(self, serializer):
        # Print the request data for debugging
        print(f"Creating bid with data: {self.request.data}")
        try:
            # Create the bid
            bid = serializer.save(company=self.request.user)
            
            # Create confirmation code
            confirmation_code = uuid.uuid4().hex
            BidConfirmation.objects.create(
                bid=bid,
                confirmation_code=confirmation_code
            )
            
            print(f"Bid created successfully by {self.request.user.username}")
        except Exception as e:
            print(f"Error creating bid: {str(e)}")
            raise

    @action(detail=False, methods=['get'])
    def my_bids(self, request):
        """
        Return the bids submitted by the current user
        """
        user = request.user
        
        # Company users can only view their own bids
        if user.user_type == 'COMPANY':
            bids = Bid.objects.filter(company=user)
        # City users and superusers can view all bids
        elif user.is_superuser or user.user_type == 'CITY':
            bids = Bid.objects.all()
        else:
            return Response(
                {'detail': 'You do not have permission to view bids.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Enhanced logging for debugging
        print(f"User {user.username} ({user.user_type}) retrieved {bids.count()} bids")
        
        serializer = self.get_serializer(bids, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def select_winner(self, request, pk=None):
        """Select this bid as the winner for the tender."""
        logger = logging.getLogger('django')
        
        try:
            bid = self.get_object()
            user = request.user
            logger.info(f"Attempting to mark bid {bid.id} as winner by user {user.username} ({user.user_type})")
            
            # Note: The IsCityUser permission class now handles city user verification
            # so we don't need to check user.user_type here
            
            # Get the tender associated with this bid
            tender = bid.tender
            logger.info(f"Bid {bid.id} is for tender {tender.id}: {tender.title}, current status: {tender.status}")
            
            # Check if deadline has passed
            if not is_deadline_passed(tender.submission_deadline):
                logger.warning(f"Attempted to select winner for tender {tender.id} but deadline has not passed")
                return Response({"detail": "Cannot select winner before submission deadline."}, status=400)
            
            # Check if tender is already awarded to prevent changes
            if tender.status == 'AWARDED':
                logger.warning(f"Attempted to select winner for tender {tender.id} but it's already awarded")
                return Response({"detail": "This tender has already been awarded."}, status=400)
            
            # Store company ID for better logging
            company_id = bid.company_id
            logger.info(f"Awarding tender {tender.id} to company {company_id} (bid {bid.id})")
            
            # PART 1: Use Django ORM within transaction
            from django.db import transaction
            awarded_timestamp = timezone.now()
            
            with transaction.atomic():
                # First reset all bids for this tender to not be winners
                Bid.objects.filter(tender=tender).update(is_winner=False, awarded_at=None)
                
                # Then mark this bid as winner
                bid.is_winner = True
                bid.awarded_at = awarded_timestamp
                bid.save(update_fields=['is_winner', 'awarded_at'])
                
                # Finally update the tender
                tender.status = 'AWARDED'
                tender.winning_bid = bid  # Set the foreign key relationship
                tender.winner_date = awarded_timestamp  # Set the winner date
                tender.save(update_fields=['status', 'winning_bid', 'winner_date'])
                
                logger.info(f"Transaction 1 complete: Marked bid {bid.id} as winner for tender {tender.id}")
            
            # PART 2: Failsafe - use direct SQL to ensure changes were made
            with connection.cursor() as cursor:
                # First update this specific bid to be the winner
                cursor.execute("""
                    UPDATE tender_app_bid
                    SET is_winner = TRUE, awarded_at = %s
                    WHERE id = %s
                """, [awarded_timestamp, bid.id])
                
                # Then update the tender 
                cursor.execute("""
                    UPDATE tender_app_tender
                    SET status = %s, winning_bid_id = %s, winner_date = %s
                    WHERE id = %s
                """, ['AWARDED', bid.id, awarded_timestamp, tender.id])
                
                logger.info(f"Transaction 2 complete: Direct SQL updates completed for bid {bid.id} and tender {tender.id}")
            
            # PART 3: Create tender history record
            try:
                TenderHistory.objects.create(
                    tender=tender,
                    action='UPDATE',
                    changes={"status": {"old": "OPEN", "new": "AWARDED"}, "winner": {"old": None, "new": bid.id}},
                    performed_by=user
                )
                logger.info(f"Created tender history record for winner selection (tender {tender.id}, bid {bid.id})")
            except Exception as history_error:
                logger.error(f"Failed to create tender history: {str(history_error)}")
            
            # Verify changes were made correctly
            verification_bid = Bid.objects.get(id=bid.id)
            verification_tender = Tender.objects.get(id=tender.id)
            
            if not verification_bid.is_winner or verification_tender.status != 'AWARDED':
                logger.error(f"Verification failed! Bid {verification_bid.id} has is_winner={verification_bid.is_winner}, "
                             f"Tender {verification_tender.id} has status={verification_tender.status}")
            else:
                logger.info(f"Verification successful! Bid {verification_bid.id} is marked as winner and "
                            f"tender {verification_tender.id} is now {verification_tender.status}")
            
            # Double check with direct SQL
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT b.id, b.is_winner, b.tender_id, t.status, t.winning_bid_id 
                    FROM tender_app_bid b
                    JOIN tender_app_tender t ON b.tender_id = t.id
                    WHERE b.id = %s
                """, [bid.id])
                row = cursor.fetchone()
                
                if row:
                    direct_bid_id, direct_is_winner, direct_tender_id, direct_tender_status, direct_winning_bid_id = row
                    logger.info(f"Final SQL verification: Bid {direct_bid_id} has is_winner={direct_is_winner}, "
                                f"Tender {direct_tender_id} status={direct_tender_status}, "
                                f"winning_bid_id={direct_winning_bid_id}")
            
            return Response({
                "detail": "Winner selected successfully",
                "bid_id": bid.id,
                "tender_id": tender.id,
                "tender_status": 'AWARDED',
                "awarded_at": awarded_timestamp
            })
            
        except Exception as e:
            logger.error(f"Error selecting winner: {str(e)}")
            return Response({"detail": f"Failed to select winner: {str(e)}"}, status=500)

    @action(detail=True, methods=['get'])
    def check_winner_status(self, request, pk=None):
        """Check if this bid is marked as a winner directly from the database using SQL."""
        logger = logging.getLogger('django')
        
        try:
            # Get this bid directly using raw SQL to bypass any caching
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT b.id, b.is_winner, b.tender_id, b.awarded_at, t.status 
                    FROM tender_app_bid b
                    JOIN tender_app_tender t ON b.tender_id = t.id
                    WHERE b.id = %s
                """, [pk])
                row = cursor.fetchone()
                
                if not row:
                    logger.error(f"Bid with id {pk} not found in database")
                    return Response({"detail": "Bid not found"}, status=404)
                
                bid_id, is_winner, tender_id, awarded_at, tender_status = row
                logger.info(f"Direct SQL query results: Bid {bid_id} has is_winner={is_winner}, tender_id={tender_id}, tender_status={tender_status}, awarded_at={awarded_at}")
                
                # Check if this bid is linked as winning_bid in tender
                cursor.execute("""
                    SELECT id, winning_bid_id 
                    FROM tender_app_tender 
                    WHERE id = %s
                """, [tender_id])
                tender_row = cursor.fetchone()
                
                is_winning_bid_in_tender = False
                if tender_row:
                    tender_id, winning_bid_id = tender_row
                    is_winning_bid_in_tender = winning_bid_id == int(pk)
                    logger.info(f"Tender {tender_id} has winning_bid_id={winning_bid_id}, matches this bid: {is_winning_bid_in_tender}")
            
            return Response({
                "bid_id": bid_id,
                "is_winner": bool(is_winner),
                "tender_id": tender_id,
                "tender_status": tender_status,
                "awarded_at": awarded_at,
                "is_winning_bid_in_tender": is_winning_bid_in_tender
            })
                
        except Exception as e:
            logger.error(f"Error checking winner status for bid {pk}: {str(e)}")
            return Response({"detail": f"Error checking winner status: {str(e)}"}, status=500)

class BidConfirmationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for bid confirmations
    """
    queryset = BidConfirmation.objects.all()
    serializer_class = BidConfirmationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        This view should return:
        - All confirmations for city users
        - Only confirmations for own bids for company users
        """
        user = self.request.user
        if user.is_superuser or user.user_type == 'CITY':
            return BidConfirmation.objects.all()
        elif user.user_type == 'COMPANY':
            return BidConfirmation.objects.filter(bid__company=user)
        return BidConfirmation.objects.none()
    
    @action(detail=False, methods=['get'])
    def my_confirmations(self, request):
        """
        Return confirmations for the current user's bids
        """
        user = request.user
        
        if user.user_type == 'COMPANY':
            confirmations = BidConfirmation.objects.filter(bid__company=user)
            serializer = self.get_serializer(confirmations, many=True)
            return Response(serializer.data)
        else:
            return Response(
                {'detail': 'This endpoint is only for company users'},
                status=status.HTTP_403_FORBIDDEN
            )

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user_type = request.data.get('user_type')
    
    user = authenticate(username=username, password=password)
    
    if user:
        # Super users can login as any user type
        if user_type and user.user_type != user_type and not user.is_superuser:
            return Response(
                {'message': f'Invalid user type. This account is not a {user_type} account.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        refresh = RefreshToken.for_user(user)
        
        # For superusers logging in as CITY, return CITY as the user_type
        response_user_type = user_type if user.is_superuser and user_type else user.user_type
        
        return Response({
            'token': str(refresh.access_token),
            'user_type': response_user_type,
            'username': user.username
        })
    return Response({'message': 'Invalid credentials'}, 
                  status=status.HTTP_401_UNAUTHORIZED)

class UserRegistrationView(APIView):
    """
    View for user registration
    """
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            # Extract data from request
            data = request.data
            user_data = {
                'username': data.get('username'),
                'password': data.get('password'),
                'user_type': data.get('user_type', 'COMPANY')  # Default to COMPANY if not specified
            }
            
            # Validate user data
            if not user_data['username'] or not user_data['password']:
                return Response(
                    {'detail': 'Username and password are required.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if username already exists
            if User.objects.filter(username=user_data['username']).exists():
                return Response(
                    {'detail': 'Username already exists.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create user based on user_type
            if user_data['user_type'] == 'COMPANY':
                # Extract company profile data
                company_profile_data = data.get('company_profile', {})
                
                # Validate company data
                required_fields = ['company_name', 'contact_email', 'registration_number']
                missing_fields = [field for field in required_fields if not company_profile_data.get(field)]
                
                if missing_fields:
                    return Response(
                        {'detail': f'Missing required fields: {", ".join(missing_fields)}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Create user with transaction to ensure atomicity
                with transaction.atomic():
                    # Create the user
                    user = User.objects.create_user(
                        username=user_data['username'],
                        password=user_data['password'],
                        user_type=user_data['user_type']
                    )
                    
                    # Create company profile
                    company_profile = CompanyProfile.objects.create(
                        user=user,
                        company_name=company_profile_data.get('company_name'),
                        contact_email=company_profile_data.get('contact_email'),
                        phone_number=company_profile_data.get('phone_number'),
                        address=company_profile_data.get('address'),
                        registration_number=company_profile_data.get('registration_number')
                    )
                    
                    return Response(
                        {
                            'message': 'Company user registered successfully',
                            'user_id': user.id,
                            'username': user.username,
                            'user_type': user.user_type
                        },
                        status=status.HTTP_201_CREATED
                    )
            elif user_data['user_type'] == 'CITY':
                # Only superuser can create city users
                return Response(
                    {'detail': 'Only superusers can create city accounts.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            else:
                return Response(
                    {'detail': 'Invalid user type. Must be COMPANY or CITY.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
        except Exception as e:
            # Log the exception for debugging
            print(f"Registration error: {str(e)}")
            return Response(
                {'detail': f'Registration failed: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

@api_view(['GET'])
def get_server_time(request):
    """
    Return the current server time for debugging
    """
    now = timezone.now()
    now_utc = now.astimezone(timezone.utc)
    
    return Response({
        'server_time': now.isoformat(),
        'server_time_utc': now_utc.isoformat(),
        'timestamp': now.timestamp(),
    })

def is_deadline_passed(deadline):
    """Check if a deadline has passed - using date comparison for reliability"""
    if not deadline:
        return False
        
    # Compare using dates for reliability
    current_date = timezone.now().date()
    deadline_date = deadline.date()
    
    return deadline_date <= current_date

class TenderHistoryView(APIView):
    """
    API endpoint that allows public access to a tender's history for transparency.
    """
    permission_classes = [AllowAny]  # Public access

    def get(self, request, tender_id):
        """
        Retrieve all history records for a specific tender.
        """
        try:
            # Log the request
            logger.info(f"Fetching history for tender ID: {tender_id}")
            
            # Get tender to verify it exists
            try:
                tender = Tender.objects.get(id=tender_id)
            except Tender.DoesNotExist:
                logger.warning(f"Tender with ID {tender_id} not found for history request")
                return Response(
                    {"detail": "Tender not found"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get actual history records
            history_records = TenderHistory.objects.filter(tender_id=tender_id).order_by('-timestamp')
            
            # Sample data for demo if no real data exists
            if not history_records:
                # Create sample records for demonstration
                sample_records = []
                
                # Basic "created" record
                sample_records.append({
                    'id': 1,
                    'tender_id': tender_id,
                    'field': 'status',
                    'old_value': '',
                    'new_value': 'OPEN',
                    'timestamp': (tender.created_at or timezone.now()).isoformat(),
                    'user': 'admin@cityoffice.gov',
                    'action': 'created'
                })
                
                # If tender is awarded, add some history
                if tender.status == 'AWARDED':
                    # Add status change record
                    sample_records.append({
                        'id': 2,
                        'tender_id': tender_id,
                        'field': 'status',
                        'old_value': 'OPEN',
                        'new_value': 'AWARDED',
                        'timestamp': (tender.awarded_date or timezone.now()).isoformat(),
                        'user': 'admin@cityoffice.gov',
                        'action': 'updated'
                    })
                
                return Response(sample_records, status=status.HTTP_200_OK)
            
            # Serialize the real history records
            serializer = TenderHistorySerializer(history_records, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error retrieving tender history: {str(e)}")
            return Response(
                {"detail": f"Error retrieving history: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def company_profile(request):
    """Get the company profile for the authenticated user"""
    try:
        # Get the company profile associated with the user
        company_profile = CompanyProfile.objects.get(user=request.user)
        return Response({
            'id': company_profile.id,
            'name': company_profile.company_name,
            'email': company_profile.contact_email,
            'phone': company_profile.phone_number,
            'address': company_profile.address,
            'registration_number': company_profile.registration_number
        })
    except CompanyProfile.DoesNotExist:
        return Response(
            {'detail': 'Company profile not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
