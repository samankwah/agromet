# PostgreSQL Integration PRD
## TriAgro AI Agricultural Calendar System

**Version:** 1.0
**Date:** January 2025
**Author:** Development Team
**Status:** In Development

---

## 1. Executive Summary

### 1.1 Project Overview
Migrate TriAgro AI's agricultural calendar data storage from JSON file-based system to PostgreSQL database to improve scalability, data integrity, and support concurrent user access.

### 1.2 Business Goals
- **Scalability**: Support multiple concurrent users uploading and accessing calendar data
- **Data Integrity**: Implement ACID transactions and referential integrity
- **Performance**: Faster data retrieval through indexed queries
- **Reliability**: Robust backup and recovery mechanisms
- **Analytics**: Enable SQL-based data analysis and reporting

### 1.3 Success Metrics
- Zero data loss during migration
- 100% preservation of existing functionality
- Improved response times for data operations
- Support for concurrent users without conflicts

---

## 2. Current State Analysis

### 2.1 Existing System
- **Storage**: JSON file (`agricultural-data.json`)
- **Data Types**: crop-calendar, agromet-advisory, poultry-calendar, poultry-advisory
- **Structure**: Nested JSON with calendar data, activities, timelines, and metadata
- **Limitations**:
  - Single file access (no concurrency)
  - Manual file locking required
  - No data validation at storage level
  - Limited query capabilities

### 2.2 Current Data Structure
```json
{
  "crop-calendar": [
    {
      "id": "1758976589019",
      "uniqueId": "CC_Western Region_Ahanta West_Maize_1758976589019",
      "region": "Western Region",
      "district": "Ahanta West",
      "crop": "Maize",
      "majorSeason": {
        "startMonth": "JAN",
        "startWeek": "2025-01-01",
        "file": "Western Calendar for Maize.xlsx"
      },
      "timeline": { ... },
      "activities": [ ... ]
    }
  ]
}
```

---

## 3. Requirements

### 3.1 Functional Requirements

#### 3.1.1 Data Storage
- **FR-001**: Store all existing calendar data types in PostgreSQL tables
- **FR-002**: Maintain data relationships through foreign keys
- **FR-003**: Support JSONB fields for complex nested data
- **FR-004**: Preserve all existing data fields and structures

#### 3.1.2 API Compatibility
- **FR-005**: Maintain existing API endpoint contracts
- **FR-006**: No changes required to frontend components
- **FR-007**: Preserve response formats and data structures
- **FR-008**: Support all existing CRUD operations

#### 3.1.3 Data Migration
- **FR-009**: Migrate all existing JSON data to PostgreSQL
- **FR-010**: Validate data integrity after migration
- **FR-011**: Provide rollback mechanism if needed
- **FR-012**: Create backup of original JSON data

### 3.2 Non-Functional Requirements

#### 3.2.1 Performance
- **NFR-001**: Database queries complete within 200ms for typical operations
- **NFR-002**: Support up to 100 concurrent users
- **NFR-003**: Handle calendar files up to 10MB in size

#### 3.2.2 Reliability
- **NFR-004**: 99.9% uptime for database operations
- **NFR-005**: Automatic backup every 24 hours
- **NFR-006**: Point-in-time recovery capability

#### 3.2.3 Security
- **NFR-007**: Use connection pooling with proper authentication
- **NFR-008**: Implement prepared statements to prevent SQL injection
- **NFR-009**: Encrypt sensitive data in transit and at rest

---

## 4. Technical Architecture

### 4.1 Database Schema Design

#### 4.1.1 Core Tables
```sql
-- Main calendar storage
CREATE TABLE crop_calendars (
    id SERIAL PRIMARY KEY,
    unique_id VARCHAR(255) UNIQUE NOT NULL,
    region VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    crop VARCHAR(100) NOT NULL,
    data_type VARCHAR(50) NOT NULL DEFAULT 'crop-calendar',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Season information
CREATE TABLE calendar_seasons (
    id SERIAL PRIMARY KEY,
    calendar_id INTEGER REFERENCES crop_calendars(id) ON DELETE CASCADE,
    season_type VARCHAR(20) NOT NULL, -- 'major' or 'minor'
    start_month VARCHAR(10),
    start_week DATE,
    filename VARCHAR(255),
    has_file BOOLEAN DEFAULT FALSE
);

-- Timeline data
CREATE TABLE calendar_timelines (
    id SERIAL PRIMARY KEY,
    calendar_id INTEGER REFERENCES crop_calendars(id) ON DELETE CASCADE,
    timeline_type VARCHAR(20) NOT NULL,
    total_weeks INTEGER,
    start_month VARCHAR(10),
    end_month VARCHAR(10),
    months JSONB,
    weeks JSONB
);

-- Activity information
CREATE TABLE calendar_activities (
    id SERIAL PRIMARY KEY,
    calendar_id INTEGER REFERENCES crop_calendars(id) ON DELETE CASCADE,
    activity_name VARCHAR(255) NOT NULL,
    row_index INTEGER,
    excel_row INTEGER,
    activity_data JSONB
);

-- Calendar grid data
CREATE TABLE calendar_grids (
    id SERIAL PRIMARY KEY,
    calendar_id INTEGER REFERENCES crop_calendars(id) ON DELETE CASCADE,
    grid_data JSONB NOT NULL
);
```

#### 4.1.2 Indexes
```sql
-- Performance indexes
CREATE INDEX idx_crop_calendars_region_district ON crop_calendars(region, district);
CREATE INDEX idx_crop_calendars_crop ON crop_calendars(crop);
CREATE INDEX idx_crop_calendars_data_type ON crop_calendars(data_type);
CREATE INDEX idx_crop_calendars_unique_id ON crop_calendars(unique_id);
CREATE INDEX idx_calendar_activities_name ON calendar_activities(activity_name);
```

### 4.2 Data Access Layer

#### 4.2.1 Connection Management
- Use `pg` connection pooling
- Configuration via environment variables
- Graceful connection handling and retry logic

#### 4.2.2 Query Functions
```javascript
// Example DAL functions
async function insertCropCalendar(calendarData)
async function getCropCalendarsByType(dataType, filters)
async function updateCropCalendar(id, updateData)
async function deleteCropCalendar(id)
async function migrationFromJSON(jsonData)
```

---

## 5. Implementation Plan

### 5.1 Phase 1: Foundation Setup (Week 1)
- **Task 1.1**: Update environment configuration
- **Task 1.2**: Install PostgreSQL dependencies (`pg`)
- **Task 1.3**: Create database schema and tables
- **Task 1.4**: Set up connection pooling

### 5.2 Phase 2: Data Access Layer (Week 1-2)
- **Task 2.1**: Create database utility functions
- **Task 2.2**: Implement CRUD operations for calendars
- **Task 2.3**: Add transaction support
- **Task 2.4**: Create migration utilities

### 5.3 Phase 3: API Integration (Week 2)
- **Task 3.1**: Update `/api/agricultural-data/upload` endpoint
- **Task 3.2**: Modify GET endpoints for data retrieval
- **Task 3.3**: Update DELETE operations
- **Task 3.4**: Add error handling and logging

### 5.4 Phase 4: Data Migration (Week 2)
- **Task 4.1**: Create migration script
- **Task 4.2**: Backup existing JSON data
- **Task 4.3**: Execute migration with validation
- **Task 4.4**: Verify data integrity

### 5.5 Phase 5: Testing & Deployment (Week 3)
- **Task 5.1**: Unit testing for database operations
- **Task 5.2**: Integration testing with frontend
- **Task 5.3**: Performance testing
- **Task 5.4**: Production deployment

---

## 6. Environment Configuration

### 6.1 Required Environment Variables
```env
# PostgreSQL Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=triagro_ai
DB_USER=triagro_user
DB_PASSWORD=triagro_password
DB_SSL=false
DB_MAX_CONNECTIONS=20
DB_IDLE_TIMEOUT=10000
DB_CONNECTION_TIMEOUT=2000
```

### 6.2 Development vs Production
- **Development**: Local PostgreSQL instance
- **Production**: Managed PostgreSQL service with SSL

---

## 7. Risk Assessment

### 7.1 Technical Risks
- **Risk**: Data loss during migration
  - **Mitigation**: Complete backup before migration, validation scripts
- **Risk**: API breaking changes
  - **Mitigation**: Maintain exact response formats, comprehensive testing
- **Risk**: Performance degradation
  - **Mitigation**: Proper indexing, query optimization, monitoring

### 7.2 Business Risks
- **Risk**: System downtime during migration
  - **Mitigation**: Execute during low-usage periods, quick rollback plan
- **Risk**: User training needed
  - **Mitigation**: No UI changes required, transparent backend change

---

## 8. Success Criteria

### 8.1 Technical Acceptance
- [ ] All existing JSON data successfully migrated
- [ ] API endpoints maintain existing contracts
- [ ] Frontend functionality unchanged
- [ ] Database queries perform within SLA
- [ ] Concurrent user support verified

### 8.2 Business Acceptance
- [ ] Zero data loss confirmed
- [ ] System stability maintained
- [ ] Performance improvements measured
- [ ] Backup and recovery tested

---

## 9. Maintenance & Monitoring

### 9.1 Database Monitoring
- Query performance metrics
- Connection pool utilization
- Storage usage tracking
- Error rate monitoring

### 9.2 Backup Strategy
- Daily automated backups
- Point-in-time recovery setup
- Backup validation procedures
- Disaster recovery testing

---

## 10. Future Considerations

### 10.1 Enhancements
- Advanced analytics and reporting
- Data archiving strategies
- Multi-tenant support
- Real-time data synchronization

### 10.2 Scalability
- Read replicas for reporting
- Database partitioning for large datasets
- Caching layer implementation
- API rate limiting

---

**Document Status**: Active
**Next Review Date**: February 2025
**Approval Required**: Technical Lead, Product Owner