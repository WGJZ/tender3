import os
from pathlib import Path
from dotenv import load_dotenv

# 加载.env文件
load_dotenv()

# 数据库配置
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DATABASE_NAME'),
        'USER': os.getenv('DATABASE_USER'),
        'PASSWORD': os.getenv('DATABASE_PASSWORD'),
        'HOST': os.getenv('DATABASE_HOST'),
        'PORT': os.getenv('DATABASE_PORT'),
        'OPTIONS': {
            'sslmode': 'require'
        }
    }
}

# 文件上传配置
# 如果您使用Supabase Storage存储文件
DEFAULT_FILE_STORAGE = 'your_project.storage.SupabaseStorage'
AWS_STORAGE_BUCKET_NAME = 'bid_documents'
AWS_S3_ENDPOINT_URL = f"{os.getenv('SUPABASE_URL')}/storage/v1"
AWS_ACCESS_KEY_ID = os.getenv('SUPABASE_KEY')
AWS_SECRET_ACCESS_KEY = os.getenv('SUPABASE_KEY')
AWS_S3_CUSTOM_DOMAIN = f"{os.getenv('SUPABASE_URL')}/storage/v1/object/public"
AWS_QUERYSTRING_AUTH = False
AWS_S3_FILE_OVERWRITE = False
AWS_DEFAULT_ACL = 'public-read'

# 允许的主机
ALLOWED_HOSTS = ['*']  # 在生产环境中要设置具体的域名

# CORS设置
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://your-frontend-domain.vercel.app",
]

-- 1. django_content_type 数据
INSERT INTO django_content_type (id, app_label, model) VALUES
(1, 'admin', 'logentry'),
(3, 'auth', 'group'),
(2, 'auth', 'permission'),
(4, 'contenttypes', 'contenttype'),
(5, 'sessions', 'session'),
(8, 'tender_app', 'bid'),
(9, 'tender_app', 'companyprofile'),
(7, 'tender_app', 'tender'),
(6, 'tender_app', 'user');

-- 重置序列
SELECT setval(pg_get_serial_sequence('django_content_type', 'id'), 9, true);

-- 2. auth_permission 数据
INSERT INTO auth_permission (id, name, content_type_id, codename) VALUES
(1, 'Can add log entry', 1, 'add_logentry'),
(2, 'Can change log entry', 1, 'change_logentry'),
(3, 'Can delete log entry', 1, 'delete_logentry'),
(4, 'Can view log entry', 1, 'view_logentry'),
(5, 'Can add permission', 2, 'add_permission'),
(6, 'Can change permission', 2, 'change_permission'),
(7, 'Can delete permission', 2, 'delete_permission'),
(8, 'Can view permission', 2, 'view_permission'),
(9, 'Can add group', 3, 'add_group'),
(10, 'Can change group', 3, 'change_group'),
(11, 'Can delete group', 3, 'delete_group'),
(12, 'Can view group', 3, 'view_group'),
(13, 'Can add content type', 4, 'add_contenttype'),
(14, 'Can change content type', 4, 'change_contenttype'),
(15, 'Can delete content type', 4, 'delete_contenttype'),
(16, 'Can view content type', 4, 'view_contenttype'),
(17, 'Can add session', 5, 'add_session'),
(18, 'Can change session', 5, 'change_session'),
(19, 'Can delete session', 5, 'delete_session'),
(20, 'Can view session', 5, 'view_session'),
(21, 'Can add user', 6, 'add_user'),
(22, 'Can change user', 6, 'change_user'),
(23, 'Can delete user', 6, 'delete_user'),
(24, 'Can view user', 6, 'view_user'),
(25, 'Can add tender', 7, 'add_tender'),
(26, 'Can change tender', 7, 'change_tender'),
(27, 'Can delete tender', 7, 'delete_tender'),
(28, 'Can view tender', 7, 'view_tender'),
(29, 'Can add bid', 8, 'add_bid'),
(30, 'Can change bid', 8, 'change_bid'),
(31, 'Can delete bid', 8, 'delete_bid'),
(32, 'Can view bid', 8, 'view_bid'),
(33, 'Can add company profile', 9, 'add_companyprofile'),
(34, 'Can change company profile', 9, 'change_companyprofile'),
(35, 'Can delete company profile', 9, 'delete_companyprofile'),
(36, 'Can view company profile', 9, 'view_companyprofile');

-- 重置序列
SELECT setval(pg_get_serial_sequence('auth_permission', 'id'), 36, true);

-- 3. tender_app_user 数据
INSERT INTO tender_app_user (id, password, last_login, is_superuser, username, first_name, last_name, email, is_staff, is_active, date_joined, user_type, organization_name) VALUES
(1, 'pbkdf2_sha256$870000$1aXsjLrkkea0k2P2Uz7yRb$Dd7Z1Sh/LN81w0Ep9AbTZpK9+XFTOB4ysWFJKHsi5bA=', '2025-03-20 13:11:08.354835+00', true, 'admin', '', '', 'admin@example.com', true, true, '2025-03-14 16:29:47.547929+00', '', ''),
(4, 'pbkdf2_sha256$870000$0ku07vrShHbi8Q5ZiO7Xss$RJcY3zQwr5bDz7RmCGhouCCXj7u8Knj1V8vDuWv+D4Y=', NULL, false, 'smartcity', '', '', '', false, true, '2025-03-14 20:42:37.087891+00', 'COMPANY', ''),
(5, 'pbkdf2_sha256$870000$IDJ7m89NhWHL8DIRUNsKvl$wW0X+rrsaUd9ssgi7WeFHuYzEJURG4opgGe2UjhGkKQ=', NULL, false, 'aaa', '', '', '', false, true, '2025-03-14 21:20:12.437802+00', 'COMPANY', ''),
(6, 'pbkdf2_sha256$870000$35SBvSOCHOQAwwbyaCOqBa$NV3P6UiDHnJPsjcE1c2yjvykwsBuXc9dUl3R4DZFh58=', NULL, false, 'bbb', '', '', '', false, true, '2025-03-18 12:15:43.672233+00', 'COMPANY', '');

-- 重置序列
SELECT setval(pg_get_serial_sequence('tender_app_user', 'id'), 6, true);

-- 4. tender_app_tender 数据
INSERT INTO tender_app_tender (id, title, description, budget, category, requirements, status, notice_date, submission_deadline, winner_date, construction_start, construction_end, created_at, created_by_id) VALUES
(1, 'Vaasa Park Construction', 'After securing a successful planning application, The CDS Group works closely with its trusted cost management partners to ensure projects are delivered successfully to budget. This collaboration is the foundation of our approach, providing the commercial expertise and insight necessary for managing small, medium and large-scale construction projects.

Our commitment to excellence is reflected in the detailed Construction Tender documents we deliver to clients. These serve as a comprehensive blueprint, ensuring every aspect of the project is clearly defined and expertly communicated.', 50000.00, 'CONSTRUCTION', 'req1', 'AWARDED', '2025-03-15 16:52:00+00', '2025-03-21 16:52:00+00', '2025-03-31 15:52:00+00', '2025-04-01', '2025-06-01', '2025-03-14 16:53:07.757342+00', 1),
(5, 'VAMK building', 'desdes', 600000.00, 'EDUCATION', 'req123456', 'AWARDED', '2025-03-25 16:30:00+00', '2025-03-31 15:30:00+00', '2025-04-01 15:30:00+00', '2025-05-01', '2025-07-01', '2025-03-18 11:25:55.901522+00', 1),
(6, 'City Tram Constructing', 'Transportation', 1000000.00, 'TRANSPORTATION', '', 'OPEN', '2025-03-19 16:30:00+00', '2025-03-24 16:30:00+00', '2025-03-31 15:30:00+00', '2025-04-01', '2025-05-01', '2025-03-18 11:32:53.912127+00', 1);

-- 重置序列
SELECT setval(pg_get_serial_sequence('tender_app_tender', 'id'), 6, true);

-- 5. tender_app_companyprofile 数据
INSERT INTO tender_app_companyprofile (id, company_name, contact_email, phone_number, address, registration_number, user_id) VALUES
(1, 'Smart City Ltd.', 'smartcity@gmail.com', '123456', 'wolffnite 30', '100', 4),
(2, 'aaa', 'aaa@example.com', '123444', 'wolffnite 30', '200', 5),
(3, 'bbb', 'bbb@example.com', '123333', '222', '222', 6);

-- 重置序列
SELECT setval(pg_get_serial_sequence('tender_app_companyprofile', 'id'), 3, true);

-- 6. tender_app_bid 数据
INSERT INTO tender_app_bid (id, bidding_price, documents, submission_date, is_winner, company_id, tender_id, additional_notes) VALUES
(1, 45000.00, 'bid_documents/User_Stories_5no9TUR.docx', '2025-03-14 21:08:00.613366+00', false, 4, 1, NULL),
(2, 29998.00, 'bid_documents/User_Stories_5JHodPP.docx', '2025-03-14 21:14:48.612017+00', false, 4, 1, NULL),
(3, 45000.00, 'bid_documents/User_Stories_ko5Simy.docx', '2025-03-14 21:20:52.072507+00', true, 5, 1, ''),
(7, 550000.00, 'bid_documents/User_Stories_3U93fH3.docx', '2025-03-18 11:27:53.663919+00', false, 5, 5, 'bid for building construction'),
(20, 99997.00, 'bid_documents/User_Stories_76DxgsQ.docx', '2025-03-18 12:13:30.858467+00', false, 5, 6, NULL),
(21, 480000.00, 'bid_documents/User_Stories_KVKQLDO.docx', '2025-03-18 12:16:23.628792+00', true, 6, 5, ''),
(22, 198000.00, 'bid_documents/User_Stories_SQJ2ydB.docx', '2025-03-18 12:16:46.603788+00', false, 6, 6, NULL);

-- 重置序列
SELECT setval(pg_get_serial_sequence('tender_app_bid', 'id'), 22, true);

-- 7. django_session 数据
INSERT INTO django_session (session_key, session_data, expire_date) VALUES
('5a1osim5n20ywqbgt0q1c8ed1q9gcu7x', '.eJxVjE0OwiAYBe_C2hCghYJL9z0D-f6UqqFJaVfGu2uTLnT7Zua9VIZtLXlrsuSJ1VlZdfrdEOghdQd8h3qbNc11XSbUu6IP2vQ4szwvh_t3UKCVb00mmk5cIh7swD2B-CgugnXSmUCCDvpr7GMy3iB3wAN69CkkCgm9ZfX-AOe7OAI:1tvFfw:-rFdsQSAqUR2m3LGtZeOcc-wZ1BH9xWx3W8AIZmAnJ8', '2025-04-03 13:11:08.404640+00'),
('uafhlvvpe7zwjxvbyvi7adqywqxqy4tj', '.eJxVjE0OwiAYBe_C2hCghYJL9z0D-f6UqqFJaVfGu2uTLnT7Zua9VIZtLXlrsuSJ1VlZdfrdEOghdQd8h3qbNc11XSbUu6IP2vQ4szwvh_t3UKCVb00mmk5cIh7swD2B-CgugnXSmUCCDvpr7GMy3iB3wAN69CkkCgm9ZfX-AOe7OAI:1ttNaZ:iUIP9M1uTh-PdRzw7-u9jfGIOnA_QRxfXDef2oPwjaM', '2025-03-29 09:13:51.589021+00');