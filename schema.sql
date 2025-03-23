-- 删除旧表（如果存在）
DROP TABLE IF EXISTS tender_app_user_user_permissions;
DROP TABLE IF EXISTS tender_app_user_groups;
DROP TABLE IF EXISTS tender_app_user;
DROP TABLE IF EXISTS tender_app_tender;
DROP TABLE IF EXISTS tender_app_companyprofile;
DROP TABLE IF EXISTS tender_app_bid;
DROP TABLE IF EXISTS django_session;
DROP TABLE IF EXISTS django_migrations;
DROP TABLE IF EXISTS django_content_type;
DROP TABLE IF EXISTS django_admin_log;
DROP TABLE IF EXISTS auth_permission;
DROP TABLE IF EXISTS auth_group_permissions;
DROP TABLE IF EXISTS auth_group;

-- 创建表
CREATE TABLE auth_group (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE
);

CREATE TABLE django_content_type (
    id SERIAL PRIMARY KEY,
    app_label VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    CONSTRAINT django_content_type_app_label_model_key UNIQUE (app_label, model)
);

CREATE TABLE auth_permission (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    content_type_id INTEGER NOT NULL REFERENCES django_content_type(id),
    codename VARCHAR(100) NOT NULL,
    CONSTRAINT auth_permission_content_type_id_codename_key UNIQUE (content_type_id, codename)
);

CREATE TABLE auth_group_permissions (
    id BIGSERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES auth_group(id),
    permission_id INTEGER NOT NULL REFERENCES auth_permission(id),
    CONSTRAINT auth_group_permissions_group_id_permission_id_key UNIQUE (group_id, permission_id)
);

CREATE TABLE tender_app_user (
    id BIGSERIAL PRIMARY KEY,
    password VARCHAR(128) NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE,
    is_superuser BOOLEAN NOT NULL,
    username VARCHAR(150) NOT NULL UNIQUE,
    first_name VARCHAR(150) NOT NULL,
    last_name VARCHAR(150) NOT NULL,
    email VARCHAR(254) NOT NULL,
    is_staff BOOLEAN NOT NULL,
    is_active BOOLEAN NOT NULL,
    date_joined TIMESTAMP WITH TIME ZONE NOT NULL,
    user_type VARCHAR(10) NOT NULL,
    organization_name VARCHAR(100) NOT NULL
);

CREATE TABLE django_admin_log (
    id SERIAL PRIMARY KEY,
    action_time TIMESTAMP WITH TIME ZONE NOT NULL,
    object_id TEXT,
    object_repr VARCHAR(200) NOT NULL,
    action_flag SMALLINT NOT NULL CHECK (action_flag >= 0),
    change_message TEXT NOT NULL,
    content_type_id INTEGER REFERENCES django_content_type(id),
    user_id BIGINT NOT NULL REFERENCES tender_app_user(id)
);

CREATE TABLE django_migrations (
    id BIGSERIAL PRIMARY KEY,
    app VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    applied TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE django_session (
    session_key VARCHAR(40) PRIMARY KEY,
    session_data TEXT NOT NULL,
    expire_date TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX django_session_expire_date_idx ON django_session(expire_date);

CREATE TABLE tender_app_tender (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    budget DECIMAL(15,2) NOT NULL,
    category VARCHAR(20) NOT NULL,
    requirements TEXT NOT NULL,
    status VARCHAR(10) NOT NULL,
    notice_date TIMESTAMP WITH TIME ZONE NOT NULL,
    submission_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    winner_date TIMESTAMP WITH TIME ZONE,
    construction_start DATE,
    construction_end DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by_id BIGINT NOT NULL REFERENCES tender_app_user(id)
);

CREATE TABLE tender_app_bid (
    id BIGSERIAL PRIMARY KEY,
    bidding_price DECIMAL(12,2) NOT NULL,
    documents VARCHAR(100) NOT NULL,
    submission_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_winner BOOLEAN NOT NULL,
    additional_notes TEXT,
    company_id BIGINT NOT NULL REFERENCES tender_app_user(id),
    tender_id BIGINT NOT NULL REFERENCES tender_app_tender(id)
);

CREATE TABLE tender_app_companyprofile (
    id BIGSERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(254) NOT NULL,
    phone_number VARCHAR(20),
    address TEXT,
    registration_number VARCHAR(50) NOT NULL,
    user_id BIGINT NOT NULL UNIQUE REFERENCES tender_app_user(id)
);

CREATE TABLE tender_app_user_groups (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES tender_app_user(id),
    group_id INTEGER NOT NULL REFERENCES auth_group(id),
    CONSTRAINT tender_app_user_groups_user_id_group_id_key UNIQUE (user_id, group_id)
);

CREATE TABLE tender_app_user_user_permissions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES tender_app_user(id),
    permission_id INTEGER NOT NULL REFERENCES auth_permission(id),
    CONSTRAINT tender_app_user_user_permissions_user_id_permission_id_key UNIQUE (user_id, permission_id)
);

-- 创建索引
CREATE INDEX tender_app_bid_company_id_idx ON tender_app_bid(company_id);
CREATE INDEX tender_app_bid_tender_id_idx ON tender_app_bid(tender_id);
CREATE INDEX tender_app_tender_created_by_id_idx ON tender_app_tender(created_by_id); 