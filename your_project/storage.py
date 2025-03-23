from storages.backends.s3boto3 import S3Boto3Storage

class SupabaseStorage(S3Boto3Storage):
    location = 'bid_documents'  # 存储桶中的子文件夹 
    file_overwrite = False
    default_acl = 'public-read'
    
    def get_default_settings(self):
        defaults = super().get_default_settings()
        defaults['addressing_style'] = 'path'
        return defaults 