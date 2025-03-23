from rest_framework import serializers
from .models import User, Tender, Bid, TenderHistory, BidConfirmation, CompanyProfile

class CompanyProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyProfile
        fields = ['id', 'company_name', 'contact_email', 'phone_number', 'address', 'registration_number', 'description']

class UserSerializer(serializers.ModelSerializer):
    company_profile = CompanyProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'user_type', 'organization_name', 'company_profile']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            user_type=validated_data['user_type'],
            organization_name=validated_data.get('organization_name', '')
        )
        return user

class TenderHistorySerializer(serializers.ModelSerializer):
    performed_by_username = serializers.CharField(source='performed_by.username', read_only=True, allow_null=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model = TenderHistory
        fields = ['id', 'tender', 'action', 'action_display', 'field', 'old_value', 'new_value', 
                  'changes', 'performed_by', 'performed_by_username', 'user', 'timestamp']
        read_only_fields = ['timestamp']

class TenderSerializer(serializers.ModelSerializer):
    history = TenderHistorySerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    category_name = serializers.SerializerMethodField()
    winning_bid_id = serializers.PrimaryKeyRelatedField(source='winning_bid', read_only=True)
    
    class Meta:
        model = Tender
        fields = [
            'id', 
            'title', 
            'description', 
            'budget', 
            'requirements',
            'status',
            'notice_date',
            'submission_deadline',
            'winner_date',
            'construction_start',
            'construction_end',
            'created_by',
            'created_by_name',
            'created_at',
            'history',
            'category',
            'category_name',
            'winning_bid',
            'winning_bid_id'
        ]
        read_only_fields = ['id', 'created_at', 'winning_bid', 'winning_bid_id']

    def get_category_name(self, obj):
        # Get the display name from the CATEGORY_CHOICES
        for code, name in Tender.CATEGORY_CHOICES:
            if obj.category == code:
                return name
        return obj.category

class BidConfirmationSerializer(serializers.ModelSerializer):
    class Meta:
        model = BidConfirmation
        fields = ['id', 'bid', 'confirmation_code', 'confirmed_at']
        read_only_fields = ['confirmed_at']

class BidSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.username', read_only=True)
    tender_title = serializers.CharField(source='tender.title', read_only=True)
    tender_id = serializers.IntegerField(source='tender.id', read_only=True)
    status = serializers.SerializerMethodField()
    confirmation = BidConfirmationSerializer(read_only=True)
    company_profile = CompanyProfileSerializer(source='company.company_profile', read_only=True)
    
    class Meta:
        model = Bid
        fields = ['id', 'tender', 'tender_id', 'tender_title', 'company', 'company_name', 'company_profile',
                 'bidding_price', 'documents', 'submission_date', 'is_winner', 'additional_notes', 
                 'status', 'confirmation']
        read_only_fields = ['company', 'submission_date', 'is_winner']
        extra_kwargs = {
            'tender': {'write_only': True}
        }
    
    def get_status(self, obj):
        if obj.is_winner:
            return 'ACCEPTED'
        # If this tender has a winner but it's not this bid
        elif Bid.objects.filter(tender=obj.tender, is_winner=True).exists():
            return 'REJECTED'
        else:
            return 'PENDING' 