import os
import django

# Set correct settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tender.settings')
django.setup()

# Import required modules
from django.db import connections
from django.db.utils import OperationalError
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile

def test_database():
    try:
        connections['default'].cursor()
        print("✅ Database connection successful!")
    except OperationalError as e:
        print(f"❌ Database connection failed: {e}")

def test_storage():
    try:
        path = default_storage.save('test.txt', ContentFile('Storage test successful!'))
        print(f"✅ File upload successful: {path}")
        url = default_storage.url(path)
        print(f"📁 File URL: {url}")
        default_storage.delete(path)
        print("🗑️ Test file deleted")
    except Exception as e:
        print(f"❌ Storage test failed: {e}")

if __name__ == "__main__":
    print("Starting tests...")
    test_database()
    test_storage() 