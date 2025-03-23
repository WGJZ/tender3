from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

# Create models here.

class User(AbstractUser):
    """
    Custom user model that supports different user types
    """
    USER_TYPE_CHOICES = (
        ('CITY', 'City'),
        ('COMPANY', 'Company'),
    )
    
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, default='COMPANY')
    organization_name = models.CharField(max_length=100, blank=True)
    
    def __str__(self):
        return f"{self.username} ({self.get_user_type_display()})"

class CompanyProfile(models.Model):
    """
    Profile for company users
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='company_profile')
    company_name = models.CharField(max_length=255)
    contact_email = models.EmailField()
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    registration_number = models.CharField(max_length=50)
    description = models.TextField(blank=True, null=True, help_text="Company description and background information")
    
    def __str__(self):
        return self.company_name

class Tender(models.Model):
    CATEGORY_CHOICES = [
        ('CONSTRUCTION', 'Construction'),
        ('INFRASTRUCTURE', 'Infrastructure'),
        ('SERVICES', 'Services'),
        ('TECHNOLOGY', 'Technology'),
        ('HEALTHCARE', 'Healthcare'),
        ('EDUCATION', 'Education'),
        ('TRANSPORTATION', 'Transportation'),
        ('ENVIRONMENT', 'Environment'),
    ]

    STATUS_CHOICES = [
        ('OPEN', 'Open'),
        ('CLOSED', 'Closed'),
        ('AWARDED', 'Awarded'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField()
    budget = models.DecimalField(max_digits=15, decimal_places=2)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='CONSTRUCTION')
    requirements = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='OPEN')
    
    notice_date = models.DateTimeField()
    submission_deadline = models.DateTimeField()
    winner_date = models.DateTimeField(null=True, blank=True)
    construction_start = models.DateField(null=True, blank=True)
    construction_end = models.DateField(null=True, blank=True)
    
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Track the winning bid directly in the Tender model for consistency
    winning_bid = models.ForeignKey('Bid', null=True, blank=True, on_delete=models.SET_NULL, related_name='won_tenders')

    def __str__(self):
        return f"{self.title} ({self.category})"
        
    def save(self, *args, **kwargs):
        """Ensure consistency between status and winning_bid relationship."""
        # If winning_bid is set, ensure status is AWARDED
        if self.winning_bid is not None and self.status != 'AWARDED':
            self.status = 'AWARDED'
        
        # If status is not AWARDED, ensure winning_bid is None
        if self.status != 'AWARDED' and self.winning_bid is not None:
            self.winning_bid = None
            
        super().save(*args, **kwargs)

class TenderHistory(models.Model):
    """
    Track changes to tenders for transparency
    """
    ACTION_CHOICES = [
        ('CREATE', 'Created'),
        ('UPDATE', 'Updated'),
        ('DELETE', 'Deleted'),
        ('created', 'Created'),
        ('updated', 'Updated'),
        ('deleted', 'Deleted'),
    ]
    
    tender = models.ForeignKey(Tender, on_delete=models.CASCADE, related_name='history')
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    field = models.CharField(max_length=255, blank=True, null=True, help_text="Fields that were changed")
    old_value = models.TextField(blank=True, null=True, help_text="Previous value before change")
    new_value = models.TextField(blank=True, null=True, help_text="New value after change")
    changes = models.JSONField(default=dict, blank=True, help_text="JSON representation of the changes made")
    performed_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    user = models.CharField(max_length=255, blank=True, null=True, help_text="User email or identifier")
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        user = self.performed_by.username if self.performed_by else self.user
        return f"{self.get_action_display()} for {self.tender.title} by {user}"

class Bid(models.Model):
    tender = models.ForeignKey(Tender, on_delete=models.CASCADE, related_name='bids')
    company = models.ForeignKey(User, on_delete=models.CASCADE)
    bidding_price = models.DecimalField(max_digits=12, decimal_places=2)
    documents = models.FileField(upload_to='bid_documents/')
    submission_date = models.DateTimeField(auto_now_add=True)
    is_winner = models.BooleanField(default=False)
    awarded_at = models.DateTimeField(null=True, blank=True)
    additional_notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Bid for {self.tender.title} by {self.company.username}"

    def save(self, *args, **kwargs):
        """
        Override save method to automatically set awarded_at when bid is marked as winner
        or clear it when bid is unmarked as winner
        """
        # Track if this is a new instance
        is_new = self._state.adding
        
        # If this is an existing bid, fetch the old is_winner value for comparison
        old_is_winner = None
        if not is_new:
            try:
                old_bid = Bid.objects.get(pk=self.pk)
                old_is_winner = old_bid.is_winner
            except Bid.DoesNotExist:
                # This could happen in rare cases
                old_is_winner = None
        
        # Update awarded_at based on is_winner change
        if self.is_winner:
            # If bid is being marked as winner or was already a winner but awarded_at is None
            if old_is_winner is None or old_is_winner is False or self.awarded_at is None:
                self.awarded_at = timezone.now()
                print(f"Setting awarded_at for bid {self.pk} to {self.awarded_at}")
        else:
            # If bid is being unmarked as winner
            if old_is_winner and self.awarded_at is not None:
                self.awarded_at = None
                print(f"Clearing awarded_at for bid {self.pk}")
        
        super(Bid, self).save(*args, **kwargs)

class BidConfirmation(models.Model):
    """
    Track bid confirmations
    """
    bid = models.OneToOneField(Bid, on_delete=models.CASCADE, related_name='confirmation')
    confirmation_code = models.CharField(max_length=32, unique=True)
    confirmed_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Confirmation for bid {self.bid.id}"
