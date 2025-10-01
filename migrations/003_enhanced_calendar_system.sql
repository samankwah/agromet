-- Enhanced Agricultural Calendar System Migration
-- Supports both seasonal calendars (crops) and flexible production cycles (poultry)

-- Drop existing tables if they exist to recreate with enhanced structure
DROP TABLE IF EXISTS calendar_activities CASCADE;
DROP TABLE IF EXISTS production_cycles CASCADE;
DROP TABLE IF EXISTS user_production_cycles CASCADE;
DROP TABLE IF EXISTS agricultural_calendars CASCADE;

-- Main calendar registry (both seasonal and cycle)
CREATE TABLE agricultural_calendars (
    id SERIAL PRIMARY KEY,
    calendar_type VARCHAR(20) NOT NULL CHECK (calendar_type IN ('seasonal', 'cycle')),
    commodity VARCHAR(50) NOT NULL,
    title VARCHAR(200),
    
    -- Regional information
    region_code VARCHAR(10),
    district_code VARCHAR(10),
    region_name VARCHAR(100),
    district_name VARCHAR(100),
    
    -- Seasonal calendar specific fields
    season VARCHAR(20), -- major, minor, dry, wet
    year INTEGER,
    start_month INTEGER,
    end_month INTEGER,
    total_weeks INTEGER,
    
    -- Cycle calendar specific fields
    cycle_duration_weeks INTEGER,
    breed_type VARCHAR(100),
    flexible_start BOOLEAN DEFAULT FALSE,
    
    -- Common metadata
    created_by INTEGER,
    file_name VARCHAR(200),
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',
    
    -- JSON fields for complex data
    timeline_data JSONB, -- Stores week/month mapping
    metadata JSONB, -- Additional calendar metadata
    
    -- Indexes
    CONSTRAINT unique_seasonal_calendar UNIQUE (commodity, region_code, district_code, season, year)
);

-- Calendar activities (detailed schedule)
CREATE TABLE calendar_activities (
    id SERIAL PRIMARY KEY,
    calendar_id INTEGER REFERENCES agricultural_calendars(id) ON DELETE CASCADE,
    
    -- Activity information
    activity_name VARCHAR(200) NOT NULL,
    activity_order INTEGER,
    
    -- Seasonal calendar timing (absolute)
    calendar_weeks TEXT[], -- ['WK1', 'WK2'] for seasonal
    calendar_months TEXT[], -- ['JAN', 'FEB'] for seasonal
    start_date DATE, -- Calculated absolute date for seasonal
    end_date DATE, -- Calculated absolute date for seasonal
    
    -- Cycle calendar timing (relative)
    production_week_start INTEGER, -- Week 1, 2, 3... for cycles
    production_week_end INTEGER,
    
    -- Activity details
    activity_description TEXT,
    priority INTEGER DEFAULT 1,
    tools_required TEXT[],
    duration_days INTEGER,
    
    -- Visual information from Excel
    color_code VARCHAR(20),
    cell_positions TEXT[], -- Excel cell positions for reference
    
    -- Metadata
    notes TEXT,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key
    CONSTRAINT fk_activity_calendar FOREIGN KEY (calendar_id) REFERENCES agricultural_calendars(id)
);

-- User production cycles (for flexible poultry farming)
CREATE TABLE user_production_cycles (
    id SERIAL PRIMARY KEY,
    calendar_id INTEGER REFERENCES agricultural_calendars(id),
    user_id INTEGER,
    
    -- Cycle tracking
    start_date DATE NOT NULL,
    current_week INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'active', -- active, completed, paused
    
    -- Cycle information
    expected_end_date DATE,
    actual_end_date DATE,
    total_duration_weeks INTEGER,
    
    -- Production data
    batch_name VARCHAR(100),
    initial_quantity INTEGER,
    current_quantity INTEGER,
    
    -- Progress tracking
    completed_activities JSONB DEFAULT '[]', -- Track completed activities
    notes TEXT,
    
    -- Timestamps
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key
    CONSTRAINT fk_cycle_calendar FOREIGN KEY (calendar_id) REFERENCES agricultural_calendars(id)
);

-- Calendar activity templates (for common activities across calendars)
CREATE TABLE activity_templates (
    id SERIAL PRIMARY KEY,
    commodity_type VARCHAR(50) NOT NULL,
    activity_name VARCHAR(200) NOT NULL,
    standard_description TEXT,
    typical_duration_days INTEGER,
    common_tools TEXT[],
    best_practices JSONB,
    
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique Constraint
    UNIQUE(commodity_type, activity_name)
);

-- Regional calendar variations (for district-specific adjustments)
CREATE TABLE regional_calendar_adjustments (
    id SERIAL PRIMARY KEY,
    base_calendar_id INTEGER REFERENCES agricultural_calendars(id),
    region_code VARCHAR(10) NOT NULL,
    district_code VARCHAR(10) NOT NULL,
    
    -- Adjustments
    week_offset INTEGER DEFAULT 0, -- Shift activities by N weeks
    month_offset INTEGER DEFAULT 0, -- Shift activities by N months
    activity_modifications JSONB, -- Specific activity adjustments
    
    -- Metadata
    reason TEXT,
    climate_factor VARCHAR(100),
    soil_factor VARCHAR(100),
    
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key
    CONSTRAINT fk_adjustment_calendar FOREIGN KEY (base_calendar_id) REFERENCES agricultural_calendars(id)
);

-- Insert some template activities for common commodities
INSERT INTO activity_templates (commodity_type, activity_name, standard_description, typical_duration_days, common_tools) VALUES
-- Crop activities
('maize', 'Site Selection', 'Select appropriate land with good drainage and soil fertility', 7, ARRAY['Soil auger', 'pH meter', 'GPS']),
('maize', 'Land Preparation', 'Clear land, plow and prepare seedbed', 14, ARRAY['Tractor', 'Plow', 'Harrow', 'Cutlass']),
('maize', 'Planting/Sowing', 'Plant maize seeds at recommended spacing', 7, ARRAY['Planter', 'Seeds', 'Measuring tape']),
('rice', 'Nursery Establishment', 'Prepare rice nursery and sow seeds', 21, ARRAY['Nursery bed', 'Seeds', 'Water pump']),
('rice', 'Transplanting', 'Transplant rice seedlings to main field', 14, ARRAY['Transplanter', 'Seedlings', 'Water']),

-- Poultry activities  
('broiler', 'Site Selection/Construction', 'Select and prepare appropriate housing', 14, ARRAY['Construction materials', 'Tools', 'Plans']),
('broiler', 'Brooder Management', 'Manage temperature and environment for chicks', 14, ARRAY['Brooder', 'Thermometer', 'Heat source']),
('broiler', 'Harvesting and Processing', 'Harvest mature birds for processing', 3, ARRAY['Processing equipment', 'Scales', 'Transport']),
('layer', 'Site Selection/Construction', 'Prepare housing and source for market', 21, ARRAY['Housing materials', 'Feeders', 'Drinkers']),
('layer', 'Layer Phase Management', 'Manage laying hens for optimal egg production', 140, ARRAY['Egg collection', 'Feeders', 'Nest boxes']);

-- Create functions for common calendar operations

-- Function to get current week for a production cycle
CREATE OR REPLACE FUNCTION get_current_production_week(cycle_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    cycle_start_date DATE;
    current_date_val DATE := CURRENT_DATE;
    weeks_elapsed INTEGER;
BEGIN
    SELECT start_date INTO cycle_start_date 
    FROM user_production_cycles 
    WHERE id = cycle_id;
    
    IF cycle_start_date IS NULL THEN
        RETURN NULL;
    END IF;
    
    weeks_elapsed := FLOOR(EXTRACT(DAYS FROM (current_date_val - cycle_start_date)) / 7) + 1;
    
    RETURN weeks_elapsed;
END;
$$ LANGUAGE plpgsql;

-- Function to get activities for current week in a production cycle
CREATE OR REPLACE FUNCTION get_current_cycle_activities(cycle_id INTEGER)
RETURNS TABLE(
    activity_name VARCHAR,
    activity_description TEXT,
    production_week_start INTEGER,
    production_week_end INTEGER
) AS $$
DECLARE
    current_week INTEGER;
    calendar_id_val INTEGER;
BEGIN
    -- Get current production week and calendar ID
    SELECT get_current_production_week(cycle_id), upc.calendar_id
    INTO current_week, calendar_id_val
    FROM user_production_cycles upc
    WHERE upc.id = cycle_id;
    
    -- Return activities for current week
    RETURN QUERY
    SELECT ca.activity_name, ca.activity_description, ca.production_week_start, ca.production_week_end
    FROM calendar_activities ca
    WHERE ca.calendar_id = calendar_id_val
    AND current_week >= ca.production_week_start 
    AND current_week <= COALESCE(ca.production_week_end, ca.production_week_start);
END;
$$ LANGUAGE plpgsql;

-- Function to get seasonal calendar activities for current date
CREATE OR REPLACE FUNCTION get_current_seasonal_activities(calendar_id_val INTEGER)
RETURNS TABLE(
    activity_name VARCHAR,
    activity_description TEXT,
    start_date DATE,
    end_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT ca.activity_name, ca.activity_description, ca.start_date, ca.end_date
    FROM calendar_activities ca
    WHERE ca.calendar_id = calendar_id_val
    AND CURRENT_DATE >= ca.start_date 
    AND CURRENT_DATE <= COALESCE(ca.end_date, ca.start_date);
END;
$$ LANGUAGE plpgsql;

-- Create views for easier querying

-- View for active seasonal calendars with current activities
CREATE VIEW active_seasonal_calendars AS
SELECT 
    ac.*,
    COUNT(ca.id) as total_activities,
    COUNT(CASE WHEN CURRENT_DATE BETWEEN ca.start_date AND COALESCE(ca.end_date, ca.start_date) THEN 1 END) as current_activities
FROM agricultural_calendars ac
LEFT JOIN calendar_activities ca ON ac.id = ca.calendar_id
WHERE ac.calendar_type = 'seasonal' AND ac.status = 'active'
GROUP BY ac.id;

-- View for active production cycles with progress
CREATE VIEW active_production_cycles AS
SELECT 
    upc.*,
    ac.commodity,
    ac.title,
    get_current_production_week(upc.id) as current_week_calculated,
    CASE 
        WHEN get_current_production_week(upc.id) > ac.cycle_duration_weeks THEN 'overdue'
        WHEN get_current_production_week(upc.id) = ac.cycle_duration_weeks THEN 'ready'
        ELSE 'active'
    END as cycle_status
FROM user_production_cycles upc
JOIN agricultural_calendars ac ON upc.calendar_id = ac.id
WHERE upc.status = 'active';

-- Performance Indexes (aligned with existing schema pattern)
-- Geographic filtering indexes
CREATE INDEX idx_enhanced_calendars_region ON agricultural_calendars(region_code);
CREATE INDEX idx_enhanced_calendars_district ON agricultural_calendars(district_code);
CREATE INDEX idx_enhanced_calendars_commodity ON agricultural_calendars(commodity);
CREATE INDEX idx_enhanced_calendars_type ON agricultural_calendars(calendar_type);
CREATE INDEX idx_enhanced_calendars_season ON agricultural_calendars(season, year);

-- Calendar activities indexes
CREATE INDEX idx_calendar_activities_calendar ON calendar_activities(calendar_id);
CREATE INDEX idx_calendar_activities_timing ON calendar_activities(production_week_start, production_week_end);
CREATE INDEX idx_calendar_activities_seasonal ON calendar_activities(start_date, end_date);

-- Production cycles indexes
CREATE INDEX idx_user_cycles_user ON user_production_cycles(user_id, status);
CREATE INDEX idx_user_cycles_calendar ON user_production_cycles(calendar_id);
CREATE INDEX idx_user_cycles_dates ON user_production_cycles(start_date, expected_end_date);
CREATE INDEX idx_user_cycles_commodity ON user_production_cycles(commodity);

-- Activity templates indexes
CREATE INDEX idx_activity_templates_commodity ON activity_templates(commodity_type);

-- Regional adjustments indexes
CREATE INDEX idx_regional_adjustments_region ON regional_calendar_adjustments(region_code, district_code);
CREATE INDEX idx_regional_adjustments_calendar ON regional_calendar_adjustments(base_calendar_id);

-- JSONB data indexes for fast searching
CREATE INDEX idx_enhanced_calendar_timeline_data ON agricultural_calendars USING GIN (timeline_data);
CREATE INDEX idx_enhanced_calendar_metadata ON agricultural_calendars USING GIN (metadata);
CREATE INDEX idx_user_cycle_completed_activities ON user_production_cycles USING GIN (completed_activities);
CREATE INDEX idx_activity_template_best_practices ON activity_templates USING GIN (best_practices);
CREATE INDEX idx_regional_adjustments_modifications ON regional_calendar_adjustments USING GIN (activity_modifications);

-- Text search indexes for enhanced searching
CREATE INDEX idx_enhanced_calendar_title_search ON agricultural_calendars USING gin(to_tsvector('english', title));
CREATE INDEX idx_activity_name_search ON calendar_activities USING gin(to_tsvector('english', activity_name));
CREATE INDEX idx_activity_description_search ON calendar_activities USING gin(to_tsvector('english', activity_description));

-- Composite indexes for common query patterns
CREATE INDEX idx_enhanced_calendar_region_commodity ON agricultural_calendars(region_code, commodity, calendar_type);
CREATE INDEX idx_enhanced_calendar_seasonal_lookup ON agricultural_calendars(calendar_type, season, year, commodity);
CREATE INDEX idx_user_cycle_active_lookup ON user_production_cycles(user_id, status, calendar_id);

COMMIT;

-- Additional compatibility views for existing schema integration
CREATE OR REPLACE VIEW legacy_crop_calendars AS
SELECT 
    id,
    commodity,
    region_code as region_id,
    district_code as district_id,
    commodity as commodity_id,
    title,
    season,
    year,
    timeline_data as calendar_data,
    upload_date as created_at
FROM agricultural_calendars 
WHERE calendar_type = 'seasonal';

CREATE OR REPLACE VIEW legacy_poultry_calendars AS
SELECT 
    id,
    commodity,
    region_code as region_id,
    district_code as district_id,
    title,
    cycle_duration_weeks as duration,
    breed_type,
    timeline_data as calendar_data,
    upload_date as created_at
FROM agricultural_calendars 
WHERE calendar_type = 'cycle';