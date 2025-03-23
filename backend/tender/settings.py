import os
from pathlib import Path
from dotenv import load_dotenv

# 加载.env文件
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

# Supabase Storage配置
DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
AWS_STORAGE_BUCKET_NAME = 'bid_documents'
AWS_S3_ENDPOINT_URL = os.getenv('SUPABASE_URL') + '/storage/v1'
AWS_ACCESS_KEY_ID = os.getenv('SUPABASE_KEY')
AWS_SECRET_ACCESS_KEY = os.getenv('SUPABASE_KEY')
AWS_S3_CUSTOM_DOMAIN = os.getenv('SUPABASE_URL') + '/storage/v1/object/public'
AWS_QUERYSTRING_AUTH = False
AWS_S3_FILE_OVERWRITE = False
AWS_DEFAULT_ACL = 'public-read'

# 添加允许的主机
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '.railway.app',  # 允许所有railway子域名
    'your-app-name.railway.app'  # 添加Railway生成的域名
]

# CORS设置
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://your-frontend-domain.vercel.app",  # 稍后替换为实际的Vercel域名
] 