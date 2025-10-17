-- Weekly Advisories Schema
-- This table stores weekly agricultural advisories with weather forecasts and recommendations

CREATE TABLE IF NOT EXISTS weekly_advisories (
    id SERIAL PRIMARY KEY,
    advisory_id VARCHAR(100) UNIQUE NOT NULL,

    -- Metadata
    zone VARCHAR(50),
    region VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    crop_type VARCHAR(100) NOT NULL,
    activity_stage VARCHAR(200) NOT NULL,

    -- Date and Week Information
    week_number INTEGER,
    weeks_range VARCHAR(50),
    year INTEGER NOT NULL,
    start_date DATE,
    end_date DATE,
    month_year VARCHAR(50),

    -- Weather Forecast Data (9 parameters)
    rainfall_forecast VARCHAR(200),
    temperature_forecast VARCHAR(200),
    humidity_forecast VARCHAR(200),
    soil_moisture_forecast VARCHAR(200),
    soil_temperature_forecast VARCHAR(200),
    sunshine_forecast VARCHAR(200),
    sunrise_forecast VARCHAR(200),
    sunset_forecast VARCHAR(200),
    evapotranspiration_forecast VARCHAR(200),

    -- Weather Implications
    rainfall_implication TEXT,
    temperature_implication TEXT,
    humidity_implication TEXT,
    soil_moisture_implication TEXT,
    soil_temperature_implication TEXT,
    sunshine_implication TEXT,
    sunrise_implication TEXT,
    sunset_implication TEXT,
    evapotranspiration_implication TEXT,

    -- Advisory Recommendations
    rainfall_advisory TEXT,
    temperature_advisory TEXT,
    humidity_advisory TEXT,
    soil_moisture_advisory TEXT,
    soil_temperature_advisory TEXT,
    sunshine_advisory TEXT,
    sunrise_advisory TEXT,
    sunset_advisory TEXT,
    evapotranspiration_advisory TEXT,

    -- Summary and SMS
    sms_text TEXT,
    overall_summary TEXT,

    -- Metadata timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Unique constraint
    CONSTRAINT unique_advisory_combination UNIQUE (region, district, crop_type, activity_stage, year, week_number)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_weekly_advisory_lookup
    ON weekly_advisories(region, district, crop_type, year);

CREATE INDEX IF NOT EXISTS idx_weekly_advisory_id
    ON weekly_advisories(advisory_id);

CREATE INDEX IF NOT EXISTS idx_weekly_advisory_activity
    ON weekly_advisories(crop_type, activity_stage);

CREATE INDEX IF NOT EXISTS idx_weekly_advisory_week
    ON weekly_advisories(year, week_number);

-- Comments
COMMENT ON TABLE weekly_advisories IS 'Stores weekly agricultural advisories with weather forecasts and farming recommendations';
COMMENT ON COLUMN weekly_advisories.advisory_id IS 'Unique identifier format: REGION_DISTRICT_CROP_YEAR_WXX_ACTIVITY';
COMMENT ON COLUMN weekly_advisories.activity_stage IS 'Agricultural activity stage (e.g., Land Preparation, Planting Sowing, Harvesting)';
COMMENT ON COLUMN weekly_advisories.weeks_range IS 'Week range in format: 25 - 32';
