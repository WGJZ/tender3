import os
import django

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tender.settings')
django.setup()

# 导入所需模块
from django.db import connections
from django.db.utils import OperationalError
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile

def test_database():
    try:
        connections['default'].cursor()
        print("✅ 数据库连接成功！")
    except OperationalError as e:
        print(f"❌ 数据库连接失败: {e}")

def test_storage():
    try:
        path = default_storage.save('test.txt', ContentFile('Storage test successful!'))
        print(f"✅ 文件上传成功: {path}")
        url = default_storage.url(path)
        print(f"📁 文件URL: {url}")
        default_storage.delete(path)
        print("🗑️ 测试文件已删除")
    except Exception as e:
        print(f"❌ 存储测试失败: {e}")

if __name__ == "__main__":
    print("开始测试...")
    test_database()
    test_storage() 