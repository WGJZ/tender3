from django.core.files.storage import default_storage
from django.core.files.base import ContentFile

def test_storage():
    try:
        # 测试文件上传
        path = default_storage.save(
            'test.txt', 
            ContentFile('Storage test successful!')
        )
        print(f"File uploaded successfully: {path}")
        
        # 获取文件URL
        url = default_storage.url(path)
        print(f"File URL: {url}")
        
        # 清理测试文件
        default_storage.delete(path)
        print("Test file deleted")
        
    except Exception as e:
        print(f"Storage test failed: {e}") 