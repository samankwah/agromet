# Production Database Schema Recommendations

## Overview
For production deployment, replace the current JSON file storage with a proper database system for better performance, data integrity, and district-specific filtering capabilities.

## Recommended Database: PostgreSQL

### Why PostgreSQL?
- Excellent JSON support for flexible data structures
- JSONB indexing for fast queries on agricultural data
- Strong indexing capabilities for region/district filtering
- ACID compliance for data integrity
- Excellent performance with large datasets

## Database Schema

### 1. Core Tables

```sql
-- Regions and Districts
CREATE TABLE regions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE districts (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    region_id INTEGER REFERENCES regions(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Commodities/Crops
CREATE TABLE commodities (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50), -- 'crop', 'poultry', etc.
    created_at TIMESTAMP DEFAULT NOW()
);

-- Users and Authentication
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    organization VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Agricultural Data Tables

```sql
-- Crop Calendars
CREATE TABLE crop_calendars (
    id SERIAL PRIMARY KEY,
    unique_id VARCHAR(255) UNIQUE NOT NULL,
    region_id INTEGER REFERENCES regions(id),
    district_id INTEGER REFERENCES districts(id),
    commodity_id INTEGER REFERENCES commodities(id),
    season_type VARCHAR(20) CHECK (season_type IN ('major', 'minor')),
    start_month VARCHAR(20),
    start_week DATE,
    calendar_data JSONB, -- Stores parsed Excel data
    file_metadata JSONB, -- Original file info
    uploaded_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Agromet Advisories
CREATE TABLE agromet_advisories (
    id SERIAL PRIMARY KEY,
    unique_id VARCHAR(255) UNIQUE NOT NULL,
    region_id INTEGER REFERENCES regions(id),
    district_id INTEGER REFERENCES districts(id),
    commodity_id INTEGER REFERENCES commodities(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    activity VARCHAR(100),
    advisory_data JSONB, -- Multi-sheet Excel data
    file_metadata JSONB,
    uploaded_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Poultry Calendars
CREATE TABLE poultry_calendars (
    id SERIAL PRIMARY KEY,
    unique_id VARCHAR(255) UNIQUE NOT NULL,
    region_id INTEGER REFERENCES regions(id),
    district_id INTEGER REFERENCES districts(id),
    poultry_type_id INTEGER REFERENCES commodities(id),
    breed VARCHAR(100),
    stage VARCHAR(50),
    calendar_data JSONB,
    file_metadata JSONB,
    uploaded_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Poultry Advisories
CREATE TABLE poultry_advisories (
    id SERIAL PRIMARY KEY,
    unique_id VARCHAR(255) UNIQUE NOT NULL,
    region_id INTEGER REFERENCES regions(id),
    district_id INTEGER REFERENCES districts(id),
    poultry_type_id INTEGER REFERENCES commodities(id),
    breed VARCHAR(100),
    stage VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    advisory_data JSONB,
    file_metadata JSONB,
    uploaded_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Performance Indexes

```sql
-- Geographic filtering
CREATE INDEX idx_crop_calendars_region ON crop_calendars(region_id);
CREATE INDEX idx_crop_calendars_district ON crop_calendars(district_id);
CREATE INDEX idx_crop_calendars_commodity ON crop_calendars(commodity_id);

CREATE INDEX idx_agromet_region ON agromet_advisories(region_id);
CREATE INDEX idx_agromet_district ON agromet_advisories(district_id);
CREATE INDEX idx_agromet_commodity ON agromet_advisories(commodity_id);

CREATE INDEX idx_poultry_cal_region ON poultry_calendars(region_id);
CREATE INDEX idx_poultry_cal_district ON poultry_calendars(district_id);

CREATE INDEX idx_poultry_adv_region ON poultry_advisories(region_id);
CREATE INDEX idx_poultry_adv_district ON poultry_advisories(district_id);

-- JSONB data searches
CREATE INDEX idx_crop_calendar_data ON crop_calendars USING GIN (calendar_data);
CREATE INDEX idx_agromet_advisory_data ON agromet_advisories USING GIN (advisory_data);
CREATE INDEX idx_poultry_calendar_data ON poultry_calendars USING GIN (calendar_data);
CREATE INDEX idx_poultry_advisory_data ON poultry_advisories USING GIN (advisory_data);

-- Text searches
CREATE INDEX idx_agromet_title ON agromet_advisories USING GIN (to_tsvector('english', title));
CREATE INDEX idx_poultry_adv_title ON poultry_advisories USING GIN (to_tsvector('english', title));
```

### 4. Sample Queries for District-Specific Filtering

```sql
-- Get crop calendars for specific district
SELECT 
    cc.*,
    r.name as region_name,
    d.name as district_name,
    c.name as commodity_name
FROM crop_calendars cc
JOIN regions r ON cc.region_id = r.id
JOIN districts d ON cc.district_id = d.id
JOIN commodities c ON cc.commodity_id = c.id
WHERE d.code = 'GA01' -- Specific district code
AND r.code = 'GA'     -- Greater Accra region
ORDER BY cc.created_at DESC;

-- Search within advisory data
SELECT *
FROM agromet_advisories 
WHERE region_id = (SELECT id FROM regions WHERE code = 'GA')
AND advisory_data @> '{"activity": "planting"}'::jsonb;

-- Get all data for a specific region with counts
SELECT 
    r.name as region_name,
    d.name as district_name,
    COUNT(cc.id) as crop_calendars,
    COUNT(aa.id) as agromet_advisories
FROM regions r
LEFT JOIN districts d ON d.region_id = r.id
LEFT JOIN crop_calendars cc ON cc.district_id = d.id
LEFT JOIN agromet_advisories aa ON aa.district_id = d.id
WHERE r.code = 'OT' -- Oti Region
GROUP BY r.id, r.name, d.id, d.name
ORDER BY r.name, d.name;
```

### 5. Migration Strategy

```sql
-- Sample data migration from JSON file
INSERT INTO regions (code, name) VALUES 
('GA', 'Greater Accra Region'),
('OT', 'Oti Region'),
('AS', 'Ashanti Region');

INSERT INTO districts (code, name, region_id) VALUES 
('GA01', 'Accra Metropolitan', (SELECT id FROM regions WHERE code = 'GA')),
('OT01', 'Biakoye', (SELECT id FROM regions WHERE code = 'OT'));

INSERT INTO commodities (code, name, category) VALUES 
('CT001', 'Maize', 'crop'),
('CT002', 'Tomato', 'crop'),
('PT001', 'Broiler', 'poultry');
```

## API Changes Required

### Update Backend Endpoints

```javascript
// Example API endpoint with database integration
app.get('/api/agricultural-data/crop-calendar', async (req, res) => {
  const { regionCode, districtCode, commodityCode } = req.query;
  
  let query = `
    SELECT 
      cc.*,
      r.name as region_name,
      d.name as district_name,
      c.name as commodity_name
    FROM crop_calendars cc
    JOIN regions r ON cc.region_id = r.id
    JOIN districts d ON cc.district_id = d.id
    JOIN commodities c ON cc.commodity_id = c.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (regionCode) {
    query += ` AND r.code = $${params.length + 1}`;
    params.push(regionCode);
  }
  
  if (districtCode) {
    query += ` AND d.code = $${params.length + 1}`;
    params.push(districtCode);
  }
  
  if (commodityCode) {
    query += ` AND c.code = $${params.length + 1}`;
    params.push(commodityCode);
  }
  
  query += ` ORDER BY cc.created_at DESC`;
  
  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Benefits of Database Implementation

1. **Performance**: Fast queries with proper indexing
2. **Scalability**: Handle thousands of records efficiently
3. **Data Integrity**: Foreign key constraints ensure valid references
4. **District Filtering**: Optimized queries for location-based searches
5. **Full-Text Search**: Search within advisory content
6. **Backup & Recovery**: Proper database backup strategies
7. **Concurrent Access**: Multiple users can safely access data
8. **Reporting**: Complex analytical queries possible

## Implementation Priority

1. **Phase 1**: Set up PostgreSQL database and basic tables
2. **Phase 2**: Migrate existing JSON data to database
3. **Phase 3**: Update API endpoints to use database
4. **Phase 4**: Add advanced features (search, analytics)
5. **Phase 5**: Implement caching and optimization

The current JSON file approach works for development but should be replaced with this database schema for production deployment.