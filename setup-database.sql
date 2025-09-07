-- TriAgro AI Database Setup Script
-- Run this script as the postgres superuser

-- Create user if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'triagro_user') THEN
        CREATE USER triagro_user WITH PASSWORD 'triagro_password';
        RAISE NOTICE 'User triagro_user created';
    ELSE
        RAISE NOTICE 'User triagro_user already exists';
    END IF;
END
$$;

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE triagro_ai OWNER triagro_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'triagro_ai')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE triagro_ai TO triagro_user;

-- Connect to the database to grant schema privileges
\c triagro_ai;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO triagro_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO triagro_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO triagro_user;

-- Grant default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO triagro_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO triagro_user;

-- Show confirmation
SELECT 'Database setup completed successfully' AS status;