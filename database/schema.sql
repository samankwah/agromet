-- TriAgro AI Database Schema
-- PostgreSQL Database Schema for Agricultural Calendar System
-- Version: 1.0
-- Created: January 2025

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Main Tables
-- ============================================================================

-- Main calendar storage table
CREATE TABLE IF NOT EXISTS crop_calendars (
    id SERIAL PRIMARY KEY,
    unique_id VARCHAR(255) UNIQUE NOT NULL,
    region VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    crop VARCHAR(100) NOT NULL,
    data_type VARCHAR(50) NOT NULL DEFAULT 'crop-calendar',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Add constraints
    CONSTRAINT check_data_type CHECK (data_type IN ('crop-calendar', 'agromet-advisory', 'poultry-calendar', 'poultry-advisory', 'enhanced-calendar'))
);

-- Season information table
CREATE TABLE IF NOT EXISTS calendar_seasons (
    id SERIAL PRIMARY KEY,
    calendar_id INTEGER NOT NULL,
    season_type VARCHAR(20) NOT NULL,
    start_month VARCHAR(10),
    start_week DATE,
    filename VARCHAR(255),
    has_file BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),

    -- Foreign key constraint
    CONSTRAINT fk_seasons_calendar FOREIGN KEY (calendar_id) REFERENCES crop_calendars(id) ON DELETE CASCADE,

    -- Check constraints
    CONSTRAINT check_season_type CHECK (season_type IN ('major', 'minor')),
    CONSTRAINT check_start_month CHECK (start_month IN ('JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'))
);

-- Timeline data table
CREATE TABLE IF NOT EXISTS calendar_timelines (
    id SERIAL PRIMARY KEY,
    calendar_id INTEGER NOT NULL,
    timeline_type VARCHAR(20) NOT NULL DEFAULT 'absolute',
    total_weeks INTEGER NOT NULL DEFAULT 52,
    start_month VARCHAR(10),
    end_month VARCHAR(10),
    months JSONB,
    weeks JSONB,
    created_at TIMESTAMP DEFAULT NOW(),

    -- Foreign key constraint
    CONSTRAINT fk_timelines_calendar FOREIGN KEY (calendar_id) REFERENCES crop_calendars(id) ON DELETE CASCADE,

    -- Check constraints
    CONSTRAINT check_timeline_type CHECK (timeline_type IN ('absolute', 'relative')),
    CONSTRAINT check_total_weeks CHECK (total_weeks > 0 AND total_weeks <= 52)
);

-- Activity information table
CREATE TABLE IF NOT EXISTS calendar_activities (
    id SERIAL PRIMARY KEY,
    calendar_id INTEGER NOT NULL,
    activity_name VARCHAR(255) NOT NULL,
    row_index INTEGER,
    excel_row INTEGER,
    activity_data JSONB,
    color VARCHAR(20),
    weeks_active INTEGER[],
    created_at TIMESTAMP DEFAULT NOW(),

    -- Foreign key constraint
    CONSTRAINT fk_activities_calendar FOREIGN KEY (calendar_id) REFERENCES crop_calendars(id) ON DELETE CASCADE
);

-- Calendar grid data table (stores the main calendar matrix)
CREATE TABLE IF NOT EXISTS calendar_grids (
    id SERIAL PRIMARY KEY,
    calendar_id INTEGER NOT NULL,
    grid_data JSONB NOT NULL,
    cell_colors JSONB,
    activity_mappings JSONB,
    created_at TIMESTAMP DEFAULT NOW(),

    -- Foreign key constraint
    CONSTRAINT fk_grids_calendar FOREIGN KEY (calendar_id) REFERENCES crop_calendars(id) ON DELETE CASCADE
);

-- ============================================================================
-- Performance Indexes
-- ============================================================================

-- Primary lookup indexes
CREATE INDEX IF NOT EXISTS idx_crop_calendars_region_district ON crop_calendars(region, district);
CREATE INDEX IF NOT EXISTS idx_crop_calendars_crop ON crop_calendars(crop);
CREATE INDEX IF NOT EXISTS idx_crop_calendars_data_type ON crop_calendars(data_type);
CREATE INDEX IF NOT EXISTS idx_crop_calendars_unique_id ON crop_calendars(unique_id);
CREATE INDEX IF NOT EXISTS idx_crop_calendars_created_at ON crop_calendars(created_at);

-- Activity lookup indexes
CREATE INDEX IF NOT EXISTS idx_calendar_activities_name ON calendar_activities(activity_name);
CREATE INDEX IF NOT EXISTS idx_calendar_activities_calendar_id ON calendar_activities(calendar_id);

-- Season lookup indexes
CREATE INDEX IF NOT EXISTS idx_calendar_seasons_calendar_id ON calendar_seasons(calendar_id);
CREATE INDEX IF NOT EXISTS idx_calendar_seasons_type ON calendar_seasons(season_type);

-- Timeline lookup indexes
CREATE INDEX IF NOT EXISTS idx_calendar_timelines_calendar_id ON calendar_timelines(calendar_id);

-- Grid lookup indexes
CREATE INDEX IF NOT EXISTS idx_calendar_grids_calendar_id ON calendar_grids(calendar_id);

-- ============================================================================
-- Triggers for Updated_At
-- ============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to crop_calendars table
CREATE TRIGGER update_crop_calendars_updated_at
    BEFORE UPDATE ON crop_calendars
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Views for Common Queries
-- ============================================================================

-- View for complete calendar information
CREATE OR REPLACE VIEW calendar_overview AS
SELECT
    cc.id,
    cc.unique_id,
    cc.region,
    cc.district,
    cc.crop,
    cc.data_type,
    cc.created_at,
    cc.updated_at,

    -- Season information
    json_agg(
        DISTINCT jsonb_build_object(
            'season_type', cs.season_type,
            'start_month', cs.start_month,
            'start_week', cs.start_week,
            'filename', cs.filename,
            'has_file', cs.has_file
        )
    ) FILTER (WHERE cs.id IS NOT NULL) as seasons,

    -- Timeline information
    json_agg(
        DISTINCT jsonb_build_object(
            'timeline_type', ct.timeline_type,
            'total_weeks', ct.total_weeks,
            'start_month', ct.start_month,
            'end_month', ct.end_month
        )
    ) FILTER (WHERE ct.id IS NOT NULL) as timelines,

    -- Activity count
    COUNT(DISTINCT ca.id) as activity_count

FROM crop_calendars cc
LEFT JOIN calendar_seasons cs ON cc.id = cs.calendar_id
LEFT JOIN calendar_timelines ct ON cc.id = ct.calendar_id
LEFT JOIN calendar_activities ca ON cc.id = ca.calendar_id
GROUP BY cc.id, cc.unique_id, cc.region, cc.district, cc.crop, cc.data_type, cc.created_at, cc.updated_at;

-- ============================================================================
-- Sample Data (for testing)
-- ============================================================================

-- This section can be uncommented for development/testing purposes
/*
-- Sample crop calendar entry
INSERT INTO crop_calendars (unique_id, region, district, crop, data_type)
VALUES ('CC_Western Region_Test District_Test Crop_' || extract(epoch from now()), 'Western Region', 'Test District', 'Test Crop', 'crop-calendar');

-- Sample season data
INSERT INTO calendar_seasons (calendar_id, season_type, start_month, start_week, has_file)
VALUES (1, 'major', 'JAN', '2025-01-01', true);

-- Sample timeline data
INSERT INTO calendar_timelines (calendar_id, timeline_type, total_weeks, start_month, end_month)
VALUES (1, 'absolute', 37, 'JAN', 'SEP');
*/

-- ============================================================================
-- Database Information
-- ============================================================================

COMMENT ON TABLE crop_calendars IS 'Main table storing agricultural calendar metadata';
COMMENT ON TABLE calendar_seasons IS 'Season-specific information for each calendar';
COMMENT ON TABLE calendar_timelines IS 'Timeline data including weeks and months structure';
COMMENT ON TABLE calendar_activities IS 'Individual activities with their timing and properties';
COMMENT ON TABLE calendar_grids IS 'Main calendar grid data in JSONB format for flexibility';

COMMENT ON COLUMN crop_calendars.unique_id IS 'Unique identifier in format: CC_Region_District_Crop_Timestamp';
COMMENT ON COLUMN crop_calendars.data_type IS 'Type of agricultural data: crop-calendar, poultry-calendar, etc.';
COMMENT ON COLUMN calendar_activities.weeks_active IS 'Array of week numbers when this activity is active';
COMMENT ON COLUMN calendar_grids.grid_data IS 'Main calendar matrix data in JSONB format';