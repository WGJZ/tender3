import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file
load_dotenv()

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'tender_app',
    'rest_framework',
    'corsheaders',
    'django_extensions',
] 

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'postgres',
        'USER': 'postgres.ktkwobkdvelxwwvarwcx',
        'PASSWORD': os.getenv('DATABASE_PASSWORD'),
        'HOST': 'aws-0-eu-central-1.pooler.supabase.com',
        'PORT': '5432',
        'OPTIONS': {
            'sslmode': 'require'
        }
    }
}

# Supabase Storage configuration
SUPABASE_URL = 'https://your-supabase-url.supabase.co'
SUPABASE_KEY = 'your-supabase-key'
SUPABASE_BUCKET = 'your-bucket-name'

# Add allowed hosts
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '.railway.app',  # Allow all railway subdomains
    'your-app-name.railway.app'  # Add the Railway generated domain
]

# CORS settings
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://your-frontend-domain.vercel.app",  # Replace later with actual Vercel domain
]

# Supabase Storage configuration
DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
AWS_STORAGE_BUCKET_NAME = 'bid_documents'
AWS_S3_ENDPOINT_URL = os.getenv('SUPABASE_URL') + '/storage/v1'
AWS_ACCESS_KEY_ID = os.getenv('SUPABASE_KEY')
AWS_SECRET_ACCESS_KEY = os.getenv('SUPABASE_KEY')
AWS_S3_CUSTOM_DOMAIN = os.getenv('SUPABASE_URL') + '/storage/v1/object/public'
AWS_QUERYSTRING_AUTH = False
AWS_S3_FILE_OVERWRITE = False
AWS_DEFAULT_ACL = 'public-read' 