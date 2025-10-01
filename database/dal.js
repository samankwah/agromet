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

    // 5. Insert calendar grid if present
    if (calendarData.calendarGrid || calendarData.grid_data) {
      await client.query(`
        INSERT INTO calendar_grids (calendar_id, grid_data, cell_colors, activity_mappings)
        VALUES ($1, $2, $3, $4)
      `, [
        calendarId,
        JSON.stringify(calendarData.calendarGrid || calendarData.grid_data),
        JSON.stringify(calendarData.cellColors || {}),
        JSON.stringify(calendarData.activityMappings || {})
      ]);
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
    let whereClause = 'WHERE cc.data_type = $1';
    const params = [dataType];
    let paramIndex = 2;

    // Add filters
    if (filters.region) {
      whereClause += ` AND cc.region = $${paramIndex}`;
      params.push(filters.region);
      paramIndex++;
    }

    if (filters.district) {
      whereClause += ` AND cc.district = $${paramIndex}`;
      params.push(filters.district);
      paramIndex++;
    }

    if (filters.crop) {
      whereClause += ` AND cc.crop = $${paramIndex}`;
      params.push(filters.crop);
      paramIndex++;
    }

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

    const calendars = [];

    // For each calendar, get related data
    for (const calendar of calendarsResult.rows) {
      const fullCalendar = await getFullCalendarById(calendar.id);
      calendars.push(fullCalendar);
    }

    console.log(`📋 Retrieved ${calendars.length} calendars for type: ${dataType}`);
    return calendars;

  } catch (error) {
    console.error('❌ Error retrieving calendars:', error.message);
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

    // Process grid data
    if (gridResult.rows.length > 0) {
      const grid = gridResult.rows[0];
      fullCalendar.calendarGrid = grid.grid_data;
      fullCalendar.cellColors = grid.cell_colors;
      fullCalendar.activityMappings = grid.activity_mappings;
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

export default {
  insertCropCalendar,
  getCropCalendarsByType,
  getFullCalendarById,
  updateCropCalendar,
  deleteCropCalendar,
  migrateFromJSON,
  getDatabaseStats,
  searchCalendars
};