"""
A Django script to check and fix tender dates in the database.
This ensures winner_date is properly set for all tenders.

Run with: python manage.py shell < fix_tender_dates.py
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tender_project.settings')
django.setup()

from tender_app.models import Tender
from django.utils import timezone
import datetime

# Print current tender data
print("Current tender data:")
for tender in Tender.objects.all():
    print(f"ID: {tender.id}, Title: {tender.title}")
    print(f"  Status: {tender.status}")
    print(f"  Notice Date: {tender.notice_date}")
    print(f"  Submission Deadline: {tender.submission_deadline}")
    print(f"  Winner Date: {tender.winner_date}")
    print()

# Fix tenders where winner_date is missing
updated_count = 0
for tender in Tender.objects.all():
    if not tender.winner_date and tender.submission_deadline:
        # Calculate winner date as 7 days after submission deadline
        submission_date = tender.submission_deadline
        winner_date = submission_date + datetime.timedelta(days=7)
        
        print(f"Updating tender {tender.id} ({tender.title}):")
        print(f"  Setting winner_date from None to {winner_date}")
        
        tender.winner_date = winner_date
        tender.save(update_fields=['winner_date'])
        updated_count += 1

print(f"\nUpdated {updated_count} tenders with missing winner dates.")
print("\nTender data after updates:")
for tender in Tender.objects.all():
    print(f"ID: {tender.id}, Title: {tender.title}")
    print(f"  Status: {tender.status}")
    print(f"  Notice Date: {tender.notice_date}")
    print(f"  Submission Deadline: {tender.submission_deadline}")
    print(f"  Winner Date: {tender.winner_date}")
    print() 