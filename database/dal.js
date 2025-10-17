/**
 * Data Access Layer (DAL) for TriAgro AI
 *
 * Handles all database operations for agricultural calendar data
 * Provides CRUD operations and maintains compatibility with existing JSON structure
 */

import { query, transaction, getClient } from './connection.js';

// ============================================================================
// CROP CALENDAR OPERATIONS
// ============================================================================

/**
 * Insert a new crop calendar
 * @param {Object} calendarData - Calendar data object
 * @returns {Promise<Object>} Inserted calendar with ID
 */
export const insertCropCalendar = async (calendarData) => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // 1. Insert main calendar record
    const calendarResult = await client.query(`
      INSERT INTO crop_calendars (unique_id, region, district, crop, data_type)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, unique_id, created_at
    `, [
      calendarData.uniqueId || calendarData.unique_id,
      calendarData.region,
      calendarData.district,
      calendarData.crop,
      calendarData.dataType || 'crop-calendar'
    ]);

    const calendarId = calendarResult.rows[0].id;
    const result = {
      id: calendarId,
      unique_id: calendarResult.rows[0].unique_id,
      created_at: calendarResult.rows[0].created_at,
      ...calendarData
    };

    // 2. Insert season data
    if (calendarData.majorSeason) {
      await client.query(`
        INSERT INTO calendar_seasons (calendar_id, season_type, start_month, start_week, filename, has_file)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        calendarId,
        'major',
        calendarData.majorSeason.startMonth,
        calendarData.majorSeason.startWeek || null,
        calendarData.majorSeason.file || calendarData.majorSeason.filename,
        !!calendarData.majorSeason.file || !!calendarData.majorSeason.filename
      ]);
    }

    if (calendarData.minorSeason && (calendarData.minorSeason.startMonth || calendarData.minorSeason.file)) {
      await client.query(`
        INSERT INTO calendar_seasons (calendar_id, season_type, start_month, start_week, filename, has_file)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        calendarId,
        'minor',
        calendarData.minorSeason.startMonth,
        calendarData.minorSeason.startWeek || null,
        calendarData.minorSeason.file || calendarData.minorSeason.filename,
        !!calendarData.minorSeason.file || !!calendarData.minorSeason.filename
      ]);
    }

    // 3. Insert timeline data
    if (calendarData.timeline) {
      await client.query(`
        INSERT INTO calendar_timelines (calendar_id, timeline_type, total_weeks, start_month, end_month, months, weeks)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        calendarId,
        calendarData.timeline.type || 'absolute',
        calendarData.timeline.totalWeeks || 52,
        calendarData.timeline.startMonth,
        calendarData.timeline.endMonth,
        JSON.stringify(calendarData.timeline.months || []),
        JSON.stringify(calendarData.timeline.weeks || [])
      ]);
    }

    // 4. Insert activities
    if (calendarData.activities && Array.isArray(calendarData.activities)) {
      for (const activity of calendarData.activities) {
        await client.query(`
          INSERT INTO calendar_activities (calendar_id, activity_name, row_index, excel_row, activity_data, color, weeks_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          calendarId,
          activity.name,
          activity.rowIndex,
          activity.excelRow,
          JSON.stringify(activity),
          activity.color || null,
          activity.weeks || []
        ]);
      }
    }

    // 5. Insert calendar grid and schedule data
    // ENHANCED: Now stores schedule with period-level color information
    if (calendarData.calendarGrid || calendarData.grid_data || calendarData.schedule) {
      await client.query(`
        INSERT INTO calendar_grids (calendar_id, grid_data, cell_colors, activity_mappings)
        VALUES ($1, $2, $3, $4)
      `, [
        calendarId,
        JSON.stringify(calendarData.calendarGrid || calendarData.grid_data || {}),
        JSON.stringify(calendarData.cellColors || {}),
        // CRITICAL: Store schedule in activity_mappings to preserve period-level colors
        JSON.stringify(calendarData.schedule || calendarData.activityMappings || {})
      ]);

      console.log('✅ Calendar schedule saved with color data:', {
        scheduleActivities: calendarData.schedule?.length || 0,
        totalPeriods: calendarData.schedule?.reduce((sum, act) => sum + (act.periods?.length || 0), 0) || 0
      });
    }

    await client.query('COMMIT');

    console.log('✅ Calendar inserted successfully:', result.unique_id);
    return result;

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error inserting calendar:', error.message);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get crop calendars by data type with optional filters
 * @param {string} dataType - Type of data to retrieve
 * @param {Object} filters - Optional filters (region, district, crop)
 * @returns {Promise<Array>} Array of calendar objects
 */
export const getCropCalendarsByType = async (dataType = 'crop-calendar', filters = {}) => {
  try {
    console.log('📊 getCropCalendarsByType called with:', { dataType, filters });

    let whereClause = 'WHERE cc.data_type = $1';
    const params = [dataType];
    let paramIndex = 2;

    // Add filters with case-insensitive matching - ONLY if values are actually provided
    // Skip undefined, null, empty string, or string "undefined"
    if (filters.region && filters.region !== 'undefined' && filters.region.trim() !== '') {
      whereClause += ` AND LOWER(cc.region) = LOWER($${paramIndex})`;
      params.push(filters.region);
      console.log(`   🔍 Filter: region = "${filters.region}"`);
      paramIndex++;
    } else {
      console.log(`   ⏭️  Skipping region filter (value: ${filters.region})`);
    }

    if (filters.district && filters.district !== 'undefined' && filters.district.trim() !== '') {
      whereClause += ` AND LOWER(cc.district) = LOWER($${paramIndex})`;
      params.push(filters.district);
      console.log(`   🔍 Filter: district = "${filters.district}"`);
      paramIndex++;
    } else {
      console.log(`   ⏭️  Skipping district filter (value: ${filters.district})`);
    }

    if (filters.crop && filters.crop !== 'undefined' && filters.crop.trim() !== '') {
      whereClause += ` AND LOWER(cc.crop) = LOWER($${paramIndex})`;
      params.push(filters.crop);
      console.log(`   🔍 Filter: crop = "${filters.crop}"`);
      paramIndex++;
    } else {
      console.log(`   ⏭️  Skipping crop filter (value: ${filters.crop})`);
    }

    console.log('   📋 Final WHERE clause:', whereClause);
    console.log('   📋 Final params:', params);

    const calendarsResult = await query(`
      SELECT
        cc.id,
        cc.unique_id,
        cc.region,
        cc.district,
        cc.crop,
        cc.data_type,
        cc.created_at,
        cc.updated_at
      FROM crop_calendars cc
      ${whereClause}
      ORDER BY cc.created_at DESC
    `, params);

    console.log(`   ✅ Found ${calendarsResult.rows.length} matching calendars in database`);

    const calendars = [];

    // For each calendar, get related data
    for (const calendar of calendarsResult.rows) {
      console.log(`   📖 Loading full data for calendar: ${calendar.unique_id}`);
      const fullCalendar = await getFullCalendarById(calendar.id);
      calendars.push(fullCalendar);
    }

    console.log(`📋 Retrieved ${calendars.length} calendars for type: ${dataType}`);
    if (calendars.length > 0) {
      console.log(`   📄 Sample calendar structure:`, {
        id: calendars[0].id,
        district: calendars[0].district,
        crop: calendars[0].crop,
        hasSchedule: !!calendars[0].schedule,
        hasActivities: !!calendars[0].activities,
        scheduleLength: calendars[0].schedule?.length || 0,
        activitiesLength: calendars[0].activities?.length || 0
      });
    }

    return calendars;

  } catch (error) {
    console.error('❌ Error retrieving calendars:', error.message);
    console.error('   Error type:', error.name);
    console.error('   Error code:', error.code);
    console.error('   Stack:', error.stack);

    // Check for specific PostgreSQL errors
    if (error.code) {
      console.error(`   PostgreSQL Error Code: ${error.code}`);
      if (error.code === '42P01') {
        console.error('   ⚠️  Table does not exist - database schema may not be initialized');
      } else if (error.code === '42703') {
        console.error('   ⚠️  Column does not exist - database schema may be out of date');
      } else if (error.code === 'ECONNREFUSED') {
        console.error('   ⚠️  Cannot connect to PostgreSQL database');
      }
    }

    throw error;
  }
};

/**
 * Get full calendar data by ID (including all related tables)
 * @param {number} calendarId - Calendar ID
 * @returns {Promise<Object>} Complete calendar object
 */
export const getFullCalendarById = async (calendarId) => {
  try {
    // Get main calendar data
    const calendarResult = await query(`
      SELECT * FROM crop_calendars WHERE id = $1
    `, [calendarId]);

    if (calendarResult.rows.length === 0) {
      throw new Error(`Calendar not found with ID: ${calendarId}`);
    }

    const calendar = calendarResult.rows[0];

    // Get seasons
    const seasonsResult = await query(`
      SELECT * FROM calendar_seasons WHERE calendar_id = $1 ORDER BY season_type
    `, [calendarId]);

    // Get timeline
    const timelineResult = await query(`
      SELECT * FROM calendar_timelines WHERE calendar_id = $1
    `, [calendarId]);

    // Get activities
    const activitiesResult = await query(`
      SELECT * FROM calendar_activities WHERE calendar_id = $1 ORDER BY row_index
    `, [calendarId]);

    // Get grid data
    const gridResult = await query(`
      SELECT * FROM calendar_grids WHERE calendar_id = $1
    `, [calendarId]);

    // Construct the full calendar object in the expected format
    const fullCalendar = {
      id: calendar.unique_id, // Use unique_id as the main ID for compatibility
      uniqueId: calendar.unique_id,
      region: calendar.region,
      district: calendar.district,
      crop: calendar.crop,
      dataType: calendar.data_type,

      // Seasons
      majorSeason: null,
      minorSeason: null,

      // Timeline
      timeline: null,

      // Activities
      activities: [],

      // Calendar grid
      calendarGrid: null,

      // Metadata
      createdAt: calendar.created_at,
      updatedAt: calendar.updated_at
    };

    // Process seasons
    seasonsResult.rows.forEach(season => {
      const seasonData = {
        startMonth: season.start_month,
        startWeek: season.start_week,
        file: season.filename,
        filename: season.filename,
        hasFile: season.has_file
      };

      if (season.season_type === 'major') {
        fullCalendar.majorSeason = seasonData;
      } else if (season.season_type === 'minor') {
        fullCalendar.minorSeason = seasonData;
      }
    });

    // Process timeline
    if (timelineResult.rows.length > 0) {
      const timeline = timelineResult.rows[0];
      fullCalendar.timeline = {
        type: timeline.timeline_type,
        totalWeeks: timeline.total_weeks,
        startMonth: timeline.start_month,
        endMonth: timeline.end_month,
        months: timeline.months,
        weeks: timeline.weeks
      };
    }

    // Process activities
    fullCalendar.activities = activitiesResult.rows.map(activity => {
      // Parse activity_data if it exists, otherwise construct from available fields
      if (activity.activity_data) {
        return activity.activity_data;
      } else {
        return {
          id: `activity_${activity.row_index}`,
          name: activity.activity_name,
          rowIndex: activity.row_index,
          excelRow: activity.excel_row,
          color: activity.color,
          weeks: activity.weeks_active || []
        };
      }
    });

    // Process grid data and schedule
    if (gridResult.rows.length > 0) {
      const grid = gridResult.rows[0];
      fullCalendar.calendarGrid = grid.grid_data;
      fullCalendar.cellColors = grid.cell_colors;

      // ENHANCED: Retrieve schedule from activity_mappings
      // activity_mappings now stores the complete schedule array with period-level colors
      if (grid.activity_mappings) {
        // Check if activity_mappings is the schedule array (has periods with colors)
        if (Array.isArray(grid.activity_mappings) && grid.activity_mappings.length > 0) {
          fullCalendar.schedule = grid.activity_mappings;
          console.log('✅ Retrieved schedule with color data:', {
            scheduleActivities: fullCalendar.schedule.length,
            totalPeriods: fullCalendar.schedule.reduce((sum, act) => sum + (act.periods?.length || 0), 0)
          });
        } else {
          // Legacy format - store as activityMappings
          fullCalendar.activityMappings = grid.activity_mappings;
        }
      }
    }

    return fullCalendar;

  } catch (error) {
    console.error('❌ Error getting full calendar:', error.message);
    throw error;
  }
};

/**
 * Update a crop calendar
 * @param {number} calendarId - Calendar ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated calendar
 */
export const updateCropCalendar = async (calendarId, updateData) => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Update main calendar record if basic info changed
    if (updateData.region || updateData.district || updateData.crop) {
      await client.query(`
        UPDATE crop_calendars
        SET region = COALESCE($2, region),
            district = COALESCE($3, district),
            crop = COALESCE($4, crop),
            updated_at = NOW()
        WHERE id = $1
      `, [calendarId, updateData.region, updateData.district, updateData.crop]);
    }

    // Update season data if provided
    if (updateData.majorSeason) {
      await client.query(`
        UPDATE calendar_seasons
        SET start_month = $2, start_week = $3, filename = $4, has_file = $5
        WHERE calendar_id = $1 AND season_type = 'major'
      `, [
        calendarId,
        updateData.majorSeason.startMonth,
        updateData.majorSeason.startWeek,
        updateData.majorSeason.filename,
        !!updateData.majorSeason.filename
      ]);
    }

    // Update other related tables as needed...

    await client.query('COMMIT');

    // Return updated calendar
    const updatedCalendar = await getFullCalendarById(calendarId);
    console.log('✅ Calendar updated successfully:', updatedCalendar.uniqueId);
    return updatedCalendar;

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error updating calendar:', error.message);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Delete a crop calendar and all related data
 * @param {string} dataType - Data type
 * @param {string} recordId - Record ID (unique_id)
 * @returns {Promise<boolean>} Success status
 */
export const deleteCropCalendar = async (dataType, recordId) => {
  try {
    // Get calendar by unique_id first
    const calendarResult = await query(`
      SELECT id FROM crop_calendars WHERE unique_id = $1 AND data_type = $2
    `, [recordId, dataType]);

    if (calendarResult.rows.length === 0) {
      throw new Error(`Calendar not found: ${recordId}`);
    }

    const calendarId = calendarResult.rows[0].id;

    // Delete calendar (CASCADE will handle related tables)
    const deleteResult = await query(`
      DELETE FROM crop_calendars WHERE id = $1
    `, [calendarId]);

    console.log('✅ Calendar deleted successfully:', recordId);
    return deleteResult.rowCount > 0;

  } catch (error) {
    console.error('❌ Error deleting calendar:', error.message);
    throw error;
  }
};

// ============================================================================
// MIGRATION HELPERS
// ============================================================================

/**
 * Migrate data from JSON format to PostgreSQL
 * @param {Object} jsonData - Original JSON data structure
 * @returns {Promise<Object>} Migration results
 */
export const migrateFromJSON = async (jsonData) => {
  const results = {
    success: 0,
    errors: 0,
    details: []
  };

  for (const [dataType, calendars] of Object.entries(jsonData)) {
    if (!Array.isArray(calendars)) continue;

    console.log(`🔄 Migrating ${calendars.length} records for type: ${dataType}`);

    for (const calendar of calendars) {
      try {
        await insertCropCalendar({
          ...calendar,
          dataType: dataType
        });
        results.success++;
        results.details.push({
          type: dataType,
          id: calendar.uniqueId || calendar.unique_id,
          status: 'success'
        });
      } catch (error) {
        results.errors++;
        results.details.push({
          type: dataType,
          id: calendar.uniqueId || calendar.unique_id,
          status: 'error',
          error: error.message
        });
        console.error(`❌ Migration error for ${calendar.uniqueId}:`, error.message);
      }
    }
  }

  console.log(`📊 Migration completed: ${results.success} success, ${results.errors} errors`);
  return results;
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get database statistics
 * @returns {Promise<Object>} Database statistics
 */
export const getDatabaseStats = async () => {
  try {
    const stats = await query(`
      SELECT
        'crop_calendars' as table_name,
        COUNT(*) as record_count,
        MAX(created_at) as latest_record
      FROM crop_calendars
      UNION ALL
      SELECT
        'calendar_activities' as table_name,
        COUNT(*) as record_count,
        MAX(created_at) as latest_record
      FROM calendar_activities
      UNION ALL
      SELECT
        'calendar_seasons' as table_name,
        COUNT(*) as record_count,
        MAX(created_at) as latest_record
      FROM calendar_seasons
    `);

    return stats.rows;
  } catch (error) {
    console.error('❌ Error getting database stats:', error.message);
    throw error;
  }
};

/**
 * Search calendars across all fields
 * @param {string} searchTerm - Search term
 * @param {string} dataType - Optional data type filter
 * @returns {Promise<Array>} Matching calendars
 */
export const searchCalendars = async (searchTerm, dataType = null) => {
  try {
    let whereClause = `
      WHERE (cc.region ILIKE $1 OR cc.district ILIKE $1 OR cc.crop ILIKE $1)
    `;
    const params = [`%${searchTerm}%`];

    if (dataType) {
      whereClause += ` AND cc.data_type = $2`;
      params.push(dataType);
    }

    const result = await query(`
      SELECT cc.*,
             COUNT(ca.id) as activity_count
      FROM crop_calendars cc
      LEFT JOIN calendar_activities ca ON cc.id = ca.calendar_id
      ${whereClause}
      GROUP BY cc.id
      ORDER BY cc.created_at DESC
      LIMIT 50
    `, params);

    return result.rows;
  } catch (error) {
    console.error('❌ Error searching calendars:', error.message);
    throw error;
  }
};

// ============================================================================
// WEEKLY ADVISORY OPERATIONS
// ============================================================================

/**
 * Insert a new weekly advisory
 * @param {Object} advisoryData - Advisory data object
 * @returns {Promise<Object>} Inserted advisory with ID
 */
export const insertWeeklyAdvisory = async (advisoryData) => {
  try {
    const result = await query(`
      INSERT INTO weekly_advisories (
        advisory_id, zone, region, district, crop_type, activity_stage,
        week_number, weeks_range, year, start_date, end_date, month_year,
        rainfall_forecast, temperature_forecast, humidity_forecast,
        soil_moisture_forecast, soil_temperature_forecast, sunshine_forecast,
        sunrise_forecast, sunset_forecast, evapotranspiration_forecast,
        rainfall_implication, temperature_implication, humidity_implication,
        soil_moisture_implication, soil_temperature_implication, sunshine_implication,
        sunrise_implication, sunset_implication, evapotranspiration_implication,
        rainfall_advisory, temperature_advisory, humidity_advisory,
        soil_moisture_advisory, soil_temperature_advisory, sunshine_advisory,
        sunrise_advisory, sunset_advisory, evapotranspiration_advisory,
        sms_text, overall_summary
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17, $18, $19, $20, $21,
        $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, $33, $34, $35, $36, $37, $38, $39,
        $40, $41
      )
      ON CONFLICT (advisory_id) DO UPDATE SET
        zone = EXCLUDED.zone,
        rainfall_forecast = EXCLUDED.rainfall_forecast,
        temperature_forecast = EXCLUDED.temperature_forecast,
        humidity_forecast = EXCLUDED.humidity_forecast,
        soil_moisture_forecast = EXCLUDED.soil_moisture_forecast,
        soil_temperature_forecast = EXCLUDED.soil_temperature_forecast,
        sunshine_forecast = EXCLUDED.sunshine_forecast,
        sunrise_forecast = EXCLUDED.sunrise_forecast,
        sunset_forecast = EXCLUDED.sunset_forecast,
        evapotranspiration_forecast = EXCLUDED.evapotranspiration_forecast,
        rainfall_implication = EXCLUDED.rainfall_implication,
        temperature_implication = EXCLUDED.temperature_implication,
        humidity_implication = EXCLUDED.humidity_implication,
        soil_moisture_implication = EXCLUDED.soil_moisture_implication,
        soil_temperature_implication = EXCLUDED.soil_temperature_implication,
        sunshine_implication = EXCLUDED.sunshine_implication,
        sunrise_implication = EXCLUDED.sunrise_implication,
        sunset_implication = EXCLUDED.sunset_implication,
        evapotranspiration_implication = EXCLUDED.evapotranspiration_implication,
        rainfall_advisory = EXCLUDED.rainfall_advisory,
        temperature_advisory = EXCLUDED.temperature_advisory,
        humidity_advisory = EXCLUDED.humidity_advisory,
        soil_moisture_advisory = EXCLUDED.soil_moisture_advisory,
        soil_temperature_advisory = EXCLUDED.soil_temperature_advisory,
        sunshine_advisory = EXCLUDED.sunshine_advisory,
        sunrise_advisory = EXCLUDED.sunrise_advisory,
        sunset_advisory = EXCLUDED.sunset_advisory,
        evapotranspiration_advisory = EXCLUDED.evapotranspiration_advisory,
        sms_text = EXCLUDED.sms_text,
        overall_summary = EXCLUDED.overall_summary,
        updated_at = NOW()
      RETURNING id, advisory_id, created_at
    `, [
      advisoryData.advisory_id,
      advisoryData.zone,
      advisoryData.region,
      advisoryData.district,
      advisoryData.crop_type,
      advisoryData.activity_stage,
      advisoryData.week_number,
      advisoryData.weeks_range,
      advisoryData.year,
      advisoryData.start_date,
      advisoryData.end_date,
      advisoryData.month_year,
      advisoryData.rainfall_forecast,
      advisoryData.temperature_forecast,
      advisoryData.humidity_forecast,
      advisoryData.soil_moisture_forecast,
      advisoryData.soil_temperature_forecast,
      advisoryData.sunshine_forecast,
      advisoryData.sunrise_forecast,
      advisoryData.sunset_forecast,
      advisoryData.evapotranspiration_forecast,
      advisoryData.rainfall_implication,
      advisoryData.temperature_implication,
      advisoryData.humidity_implication,
      advisoryData.soil_moisture_implication,
      advisoryData.soil_temperature_implication,
      advisoryData.sunshine_implication,
      advisoryData.sunrise_implication,
      advisoryData.sunset_implication,
      advisoryData.evapotranspiration_implication,
      advisoryData.rainfall_advisory,
      advisoryData.temperature_advisory,
      advisoryData.humidity_advisory,
      advisoryData.soil_moisture_advisory,
      advisoryData.soil_temperature_advisory,
      advisoryData.sunshine_advisory,
      advisoryData.sunrise_advisory,
      advisoryData.sunset_advisory,
      advisoryData.evapotranspiration_advisory,
      advisoryData.sms_text,
      advisoryData.overall_summary
    ]);

    console.log('✅ Weekly advisory inserted/updated:', result.rows[0].advisory_id);
    return result.rows[0];
  } catch (error) {
    console.error('❌ Error inserting weekly advisory:', error.message);
    throw error;
  }
};

/**
 * Get weekly advisories by filters
 * @param {Object} filters - Filters (region, district, crop_type, year, week_number)
 * @returns {Promise<Array>} Array of advisory objects
 */
export const getWeeklyAdvisories = async (filters = {}) => {
  try {
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (filters.region) {
      whereClause += ` AND LOWER(region) = LOWER($${paramIndex})`;
      params.push(filters.region);
      paramIndex++;
    }

    if (filters.district) {
      whereClause += ` AND LOWER(district) = LOWER($${paramIndex})`;
      params.push(filters.district);
      paramIndex++;
    }

    if (filters.crop_type) {
      whereClause += ` AND LOWER(crop_type) = LOWER($${paramIndex})`;
      params.push(filters.crop_type);
      paramIndex++;
    }

    if (filters.year) {
      whereClause += ` AND year = $${paramIndex}`;
      params.push(filters.year);
      paramIndex++;
    }

    if (filters.week_number) {
      whereClause += ` AND week_number = $${paramIndex}`;
      params.push(filters.week_number);
      paramIndex++;
    }

    if (filters.activity_stage) {
      whereClause += ` AND LOWER(activity_stage) = LOWER($${paramIndex})`;
      params.push(filters.activity_stage);
      paramIndex++;
    }

    const result = await query(`
      SELECT * FROM weekly_advisories
      ${whereClause}
      ORDER BY year DESC, week_number ASC, activity_stage ASC
    `, params);

    console.log(`📋 Retrieved ${result.rows.length} weekly advisories`);
    return result.rows;
  } catch (error) {
    console.error('❌ Error retrieving weekly advisories:', error.message);
    throw error;
  }
};

/**
 * Get weekly advisory by advisory_id
 * @param {string} advisoryId - Advisory ID
 * @returns {Promise<Object>} Advisory object
 */
export const getWeeklyAdvisoryById = async (advisoryId) => {
  try {
    const result = await query(`
      SELECT * FROM weekly_advisories WHERE advisory_id = $1
    `, [advisoryId]);

    if (result.rows.length === 0) {
      throw new Error(`Weekly advisory not found: ${advisoryId}`);
    }

    return result.rows[0];
  } catch (error) {
    console.error('❌ Error retrieving weekly advisory:', error.message);
    throw error;
  }
};

/**
 * Get list of activities for a crop/region/district combination
 * @param {Object} filters - Filters (region, district, crop_type, year)
 * @returns {Promise<Array>} Array of activity stage names
 */
export const getWeeklyAdvisoryActivities = async (filters = {}) => {
  try {
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (filters.region) {
      whereClause += ` AND LOWER(region) = LOWER($${paramIndex})`;
      params.push(filters.region);
      paramIndex++;
    }

    if (filters.district) {
      whereClause += ` AND LOWER(district) = LOWER($${paramIndex})`;
      params.push(filters.district);
      paramIndex++;
    }

    if (filters.crop_type) {
      whereClause += ` AND LOWER(crop_type) = LOWER($${paramIndex})`;
      params.push(filters.crop_type);
      paramIndex++;
    }

    if (filters.year) {
      whereClause += ` AND year = $${paramIndex}`;
      params.push(filters.year);
      paramIndex++;
    }

    const result = await query(`
      SELECT DISTINCT activity_stage, id, advisory_id
      FROM weekly_advisories
      ${whereClause}
      ORDER BY activity_stage ASC
    `, params);

    return result.rows;
  } catch (error) {
    console.error('❌ Error retrieving advisory activities:', error.message);
    throw error;
  }
};

/**
 * Delete weekly advisory by advisory_id
 * @param {string} advisoryId - Advisory ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteWeeklyAdvisory = async (advisoryId) => {
  try {
    const result = await query(`
      DELETE FROM weekly_advisories WHERE advisory_id = $1
    `, [advisoryId]);

    console.log('✅ Weekly advisory deleted:', advisoryId);
    return result.rowCount > 0;
  } catch (error) {
    console.error('❌ Error deleting weekly advisory:', error.message);
    throw error;
  }
};

export default {
  insertCropCalendar,
  getCropCalendarsByType,
  getFullCalendarById,
  updateCropCalendar,
  deleteCropCalendar,
  migrateFromJSON,
  getDatabaseStats,
  searchCalendars,
  insertWeeklyAdvisory,
  getWeeklyAdvisories,
  getWeeklyAdvisoryById,
  getWeeklyAdvisoryActivities,
  deleteWeeklyAdvisory
};