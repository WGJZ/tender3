import sys
import os
import django
from django.db import connection
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile

# Test database
try:
    connection.ensure_connection()
    print("✅ Database connection successful!")
except Exception as e:
    print(f"❌ Database connection failed: {e}")

# Test storage
try:
    path = default_storage.save('test_file.txt', ContentFile(b'test content'))
    url = default_storage.url(path)
    print(f"✅ File upload successful: {path}")
    
    print(f"📁 File URL: {url}")
    
    default_storage.delete(path)
    print("🗑️ Test file deleted")
except Exception as e:
    print(f"❌ Storage test failed: {e}")

if __name__ == "__main__":
    test_all() 