-- TriAgro AI Database Schema
-- Initial migration for agricultural data management system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin');
CREATE TYPE content_type AS ENUM ('crop_calendar', 'production_calendar', 'agromet_advisory', 'poultry_calendar', 'commodity_advisory');
CREATE TYPE file_status AS ENUM ('uploaded', 'processing', 'processed', 'failed');
CREATE TYPE record_status AS ENUM ('active', 'inactive', 'deleted');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    organization VARCHAR(255),
    role user_role DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Regions reference table
CREATE TABLE regions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL, -- e.g., REG06, REG10
    name VARCHAR(100) NOT NULL, -- e.g., Western Region, Oti Region
    zone VARCHAR(50), -- e.g., Transition, West Coast
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Districts reference table
CREATE TABLE districts (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL, -- e.g., DS179, DS148
    name VARCHAR(100) NOT NULL, -- e.g., Biakoye, La-Dade-Kotopon
    capital VARCHAR(100),
    region_id INTEGER REFERENCES regions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Commodities reference table
CREATE TABLE commodities (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL, -- e.g., CT0000000008, CT0000000001
    name VARCHAR(100) NOT NULL, -- e.g., rice, maize
    category VARCHAR(50), -- e.g., cereal, vegetable, livestock
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Files table - tracks uploaded files
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    original_name VARCHAR(500) NOT NULL,
    stored_filename VARCHAR(500) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    status file_status DEFAULT 'uploaded',
    content_type content_type,
    processing_log TEXT, -- Store processing errors/warnings
    metadata JSONB, -- Additional file metadata
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Production stages lookup table
CREATE TABLE production_stages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    sequence_order INTEGER,
    category VARCHAR(50) -- e.g., 'crop', 'poultry', 'general'
);

-- Agricultural records - main data table
CREATE TABLE agricultural_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    content_type content_type NOT NULL,
    
    -- Geographic information
    region_id INTEGER REFERENCES regions(id),
    district_id INTEGER REFERENCES districts(id),
    zone VARCHAR(50),
    
    -- Commodity information
    commodity_id INTEGER REFERENCES commodities(id),
    variety VARCHAR(100),
    
    -- Production stage information
    production_stage_id INTEGER REFERENCES production_stages(id),
    production_stage_name VARCHAR(100),
    
    -- Time-based information
    season VARCHAR(20), -- e.g., 'Major', 'Minor'
    year INTEGER,
    month_year VARCHAR(50), -- e.g., "May/June 2025"
    week_range VARCHAR(50), -- e.g., "1 - 7", "WK1", "21 - 24"
    start_date DATE,
    end_date DATE,
    
    -- Calendar-specific fields
    planting_start VARCHAR(20),
    planting_end VARCHAR(20),
    harvest_start VARCHAR(20),
    harvest_end VARCHAR(20),
    
    -- Advisory-specific fields
    activity_description TEXT,
    priority VARCHAR(20), -- e.g., 'High', 'Medium', 'Low'
    weather_condition VARCHAR(100),
    temperature_range VARCHAR(50),
    rainfall_info VARCHAR(100),
    humidity_info VARCHAR(50),
    soil_moisture VARCHAR(50),
    advisory_text TEXT,
    
    -- Production calendar fields
    activity VARCHAR(200),
    tools_required TEXT,
    duration_days INTEGER,
    notes TEXT,
    
    -- Status and metadata
    status record_status DEFAULT 'active',
    raw_data JSONB, -- Store original parsed data
    validation_errors JSONB, -- Store validation issues
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for common queries
    CONSTRAINT valid_year CHECK (year IS NULL OR (year >= 2020 AND year <= 2030)),
    CONSTRAINT valid_priority CHECK (priority IS NULL OR priority IN ('High', 'Medium', 'Low'))
);

-- User sessions table (for JWT token management)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_status ON files(status);
CREATE INDEX idx_files_content_type ON files(content_type);
CREATE INDEX idx_files_uploaded_at ON files(uploaded_at);

CREATE INDEX idx_agricultural_records_file_id ON agricultural_records(file_id);
CREATE INDEX idx_agricultural_records_user_id ON agricultural_records(user_id);
CREATE INDEX idx_agricultural_records_content_type ON agricultural_records(content_type);
CREATE INDEX idx_agricultural_records_region_id ON agricultural_records(region_id);
CREATE INDEX idx_agricultural_records_district_id ON agricultural_records(district_id);
CREATE INDEX idx_agricultural_records_commodity_id ON agricultural_records(commodity_id);
CREATE INDEX idx_agricultural_records_production_stage_id ON agricultural_records(production_stage_id);
CREATE INDEX idx_agricultural_records_season ON agricultural_records(season);
CREATE INDEX idx_agricultural_records_year ON agricultural_records(year);
CREATE INDEX idx_agricultural_records_status ON agricultural_records(status);
CREATE INDEX idx_agricultural_records_dates ON agricultural_records(start_date, end_date);
CREATE INDEX idx_agricultural_records_created_at ON agricultural_records(created_at);

-- GIN index for JSONB columns
CREATE INDEX idx_agricultural_records_raw_data ON agricultural_records USING GIN(raw_data);
CREATE INDEX idx_files_metadata ON files USING GIN(metadata);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agricultural_records_updated_at 
    BEFORE UPDATE ON agricultural_records 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for common queries
CREATE VIEW v_agricultural_records_detailed AS
SELECT 
    ar.*,
    u.name as user_name,
    u.email as user_email,
    f.original_name as file_name,
    f.uploaded_at as file_uploaded_at,
    r.name as region_name,
    r.code as region_code,
    d.name as district_name,
    d.code as district_code,
    c.name as commodity_name,
    c.code as commodity_code,
    ps.name as stage_name,
    ps.sequence_order as stage_order
FROM agricultural_records ar
LEFT JOIN users u ON ar.user_id = u.id
LEFT JOIN files f ON ar.file_id = f.id
LEFT JOIN regions r ON ar.region_id = r.id
LEFT JOIN districts d ON ar.district_id = d.id
LEFT JOIN commodities c ON ar.commodity_id = c.id
LEFT JOIN production_stages ps ON ar.production_stage_id = ps.id
WHERE ar.status = 'active';

-- Create view for file statistics
CREATE VIEW v_file_statistics AS
SELECT 
    content_type,
    status,
    COUNT(*) as file_count,
    SUM(file_size) as total_size,
    AVG(file_size) as avg_size,
    MAX(uploaded_at) as latest_upload
FROM files 
GROUP BY content_type, status;

-- Insert default admin user (password: admin123 - should be changed in production)
INSERT INTO users (name, email, password_hash, organization, role) 
VALUES (
    'System Administrator', 
    'admin@triagro-ai.com', 
    '$2a$10$8K1p/a0dUrziIFOd4kKGeuCwNhGgYbw8YP4F0ZjQdJlQzO0WkYhBW', -- admin123
    'TriAgro AI System', 
    'super_admin'
);

-- Success message
SELECT 'Database schema created successfully! 🎉' as message;