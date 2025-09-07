import { query, transaction } from '../config/database.js';

class AgriculturalRecord {
  constructor(recordData = {}) {
    this.id = recordData.id;
    this.fileId = recordData.file_id;
    this.userId = recordData.user_id;
    this.contentType = recordData.content_type;
    this.regionId = recordData.region_id;
    this.districtId = recordData.district_id;
    this.zone = recordData.zone;
    this.commodityId = recordData.commodity_id;
    this.variety = recordData.variety;
    this.productionStageId = recordData.production_stage_id;
    this.productionStageName = recordData.production_stage_name;
    this.season = recordData.season;
    this.year = recordData.year;
    this.monthYear = recordData.month_year;
    this.weekRange = recordData.week_range;
    this.startDate = recordData.start_date;
    this.endDate = recordData.end_date;
    this.plantingStart = recordData.planting_start;
    this.plantingEnd = recordData.planting_end;
    this.harvestStart = recordData.harvest_start;
    this.harvestEnd = recordData.harvest_end;
    this.activityDescription = recordData.activity_description;
    this.priority = recordData.priority;
    this.weatherCondition = recordData.weather_condition;
    this.temperatureRange = recordData.temperature_range;
    this.rainfallInfo = recordData.rainfall_info;
    this.humidityInfo = recordData.humidity_info;
    this.soilMoisture = recordData.soil_moisture;
    this.advisoryText = recordData.advisory_text;
    this.activity = recordData.activity;
    this.toolsRequired = recordData.tools_required;
    this.durationDays = recordData.duration_days;
    this.notes = recordData.notes;
    this.status = recordData.status || 'active';
    this.rawData = recordData.raw_data;
    this.validationErrors = recordData.validation_errors;
    this.createdAt = recordData.created_at;
    this.updatedAt = recordData.updated_at;
  }

  /**
   * Create new agricultural record
   */
  static async create(recordData) {
    try {
      const {
        fileId, userId, contentType, regionId, districtId, zone,
        commodityId, variety, productionStageId, productionStageName,
        season, year, monthYear, weekRange, startDate, endDate,
        plantingStart, plantingEnd, harvestStart, harvestEnd,
        activityDescription, priority, weatherCondition, temperatureRange,
        rainfallInfo, humidityInfo, soilMoisture, advisoryText,
        activity, toolsRequired, durationDays, notes, rawData, validationErrors
      } = recordData;

      const result = await query(`
        INSERT INTO agricultural_records (
          file_id, user_id, content_type, region_id, district_id, zone,
          commodity_id, variety, production_stage_id, production_stage_name,
          season, year, month_year, week_range, start_date, end_date,
          planting_start, planting_end, harvest_start, harvest_end,
          activity_description, priority, weather_condition, temperature_range,
          rainfall_info, humidity_info, soil_moisture, advisory_text,
          activity, tools_required, duration_days, notes, raw_data, validation_errors
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
          $31, $32, $33, $34
        ) RETURNING *
      `, [
        fileId, userId, contentType, regionId, districtId, zone,
        commodityId, variety, productionStageId, productionStageName,
        season, year, monthYear, weekRange, startDate, endDate,
        plantingStart, plantingEnd, harvestStart, harvestEnd,
        activityDescription, priority, weatherCondition, temperatureRange,
        rainfallInfo, humidityInfo, soilMoisture, advisoryText,
        activity, toolsRequired, durationDays, notes,
        rawData ? JSON.stringify(rawData) : null,
        validationErrors ? JSON.stringify(validationErrors) : null
      ]);

      return new AgriculturalRecord(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to create agricultural record: ${error.message}`);
    }
  }

  /**
   * Create multiple records in a transaction
   */
  static async createBatch(recordsData) {
    try {
      return await transaction(async (client) => {
        const records = [];
        
        for (const recordData of recordsData) {
          const {
            fileId, userId, contentType, regionId, districtId, zone,
            commodityId, variety, productionStageId, productionStageName,
            season, year, monthYear, weekRange, startDate, endDate,
            plantingStart, plantingEnd, harvestStart, harvestEnd,
            activityDescription, priority, weatherCondition, temperatureRange,
            rainfallInfo, humidityInfo, soilMoisture, advisoryText,
            activity, toolsRequired, durationDays, notes, rawData, validationErrors
          } = recordData;

          const result = await client.query(`
            INSERT INTO agricultural_records (
              file_id, user_id, content_type, region_id, district_id, zone,
              commodity_id, variety, production_stage_id, production_stage_name,
              season, year, month_year, week_range, start_date, end_date,
              planting_start, planting_end, harvest_start, harvest_end,
              activity_description, priority, weather_condition, temperature_range,
              rainfall_info, humidity_info, soil_moisture, advisory_text,
              activity, tools_required, duration_days, notes, raw_data, validation_errors
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
              $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
              $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
              $31, $32, $33, $34
            ) RETURNING *
          `, [
            fileId, userId, contentType, regionId, districtId, zone,
            commodityId, variety, productionStageId, productionStageName,
            season, year, monthYear, weekRange, startDate, endDate,
            plantingStart, plantingEnd, harvestStart, harvestEnd,
            activityDescription, priority, weatherCondition, temperatureRange,
            rainfallInfo, humidityInfo, soilMoisture, advisoryText,
            activity, toolsRequired, durationDays, notes,
            rawData ? JSON.stringify(rawData) : null,
            validationErrors ? JSON.stringify(validationErrors) : null
          ]);

          records.push(new AgriculturalRecord(result.rows[0]));
        }

        return records;
      });
    } catch (error) {
      throw new Error(`Failed to create batch records: ${error.message}`);
    }
  }

  /**
   * Find records with detailed information (joins with related tables)
   */
  static async findWithDetails(filters = {}) {
    try {
      const {
        contentType, region, district, commodity, season, year,
        startDate, endDate, priority, activity, userId,
        page = 1, limit = 50
      } = filters;

      let baseQuery = `
        SELECT 
          ar.*,
          r.name as region_name,
          r.code as region_code,
          r.zone as region_zone,
          d.name as district_name,
          d.code as district_code,
          c.name as commodity_name,
          c.code as commodity_code,
          c.category as commodity_category,
          ps.name as stage_name,
          ps.sequence_order as stage_order,
          f.original_name as file_name,
          u.name as uploaded_by
        FROM v_agricultural_records_detailed ar
        WHERE ar.status = 'active'
      `;

      const params = [];
      let paramCount = 0;

      // Add filters
      if (contentType) {
        paramCount++;
        baseQuery += ` AND ar.content_type = $${paramCount}`;
        params.push(contentType);
      }

      if (region) {
        paramCount++;
        baseQuery += ` AND (ar.region_name ILIKE $${paramCount} OR ar.region_code ILIKE $${paramCount})`;
        params.push(`%${region}%`);
      }

      if (district) {
        paramCount++;
        baseQuery += ` AND (ar.district_name ILIKE $${paramCount} OR ar.district_code ILIKE $${paramCount})`;
        params.push(`%${district}%`);
      }

      if (commodity) {
        paramCount++;
        baseQuery += ` AND (ar.commodity_name ILIKE $${paramCount} OR ar.commodity_code ILIKE $${paramCount})`;
        params.push(`%${commodity}%`);
      }

      if (season) {
        paramCount++;
        baseQuery += ` AND ar.season ILIKE $${paramCount}`;
        params.push(`%${season}%`);
      }

      if (year) {
        paramCount++;
        baseQuery += ` AND ar.year = $${paramCount}`;
        params.push(year);
      }

      if (startDate) {
        paramCount++;
        baseQuery += ` AND ar.start_date >= $${paramCount}`;
        params.push(startDate);
      }

      if (endDate) {
        paramCount++;
        baseQuery += ` AND ar.end_date <= $${paramCount}`;
        params.push(endDate);
      }

      if (priority) {
        paramCount++;
        baseQuery += ` AND ar.priority = $${paramCount}`;
        params.push(priority);
      }

      if (activity) {
        paramCount++;
        baseQuery += ` AND (ar.activity_description ILIKE $${paramCount} OR ar.activity ILIKE $${paramCount})`;
        params.push(`%${activity}%`);
      }

      if (userId) {
        paramCount++;
        baseQuery += ` AND ar.user_id = $${paramCount}`;
        params.push(userId);
      }

      // Add ordering and pagination
      const offset = (page - 1) * limit;
      baseQuery += ` ORDER BY ar.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(limit, offset);

      const result = await query(baseQuery, params);

      // Get total count
      let countQuery = baseQuery.replace(/SELECT.*FROM/, 'SELECT COUNT(*) FROM').split('ORDER BY')[0];
      const countResult = await query(countQuery, params.slice(0, -2)); // Remove limit and offset
      const totalCount = parseInt(countResult.rows[0].count);

      return {
        records: result.rows.map(row => {
          // Parse JSON fields
          const record = { ...row };
          if (record.raw_data) {
            record.raw_data = typeof record.raw_data === 'string' ? JSON.parse(record.raw_data) : record.raw_data;
          }
          if (record.validation_errors) {
            record.validation_errors = typeof record.validation_errors === 'string' ? JSON.parse(record.validation_errors) : record.validation_errors;
          }
          return record;
        }),
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to find records with details: ${error.message}`);
    }
  }

  /**
   * Get records by content type with aggregation
   */
  static async getByContentType(contentType, filters = {}) {
    try {
      const result = await this.findWithDetails({
        contentType,
        ...filters
      });
      
      return result;
    } catch (error) {
      throw new Error(`Failed to get records by content type: ${error.message}`);
    }
  }

  /**
   * Get crop calendar data
   */
  static async getCropCalendar(filters = {}) {
    return await this.getByContentType('crop_calendar', filters);
  }

  /**
   * Get production calendar data
   */
  static async getProductionCalendar(filters = {}) {
    return await this.getByContentType('production_calendar', filters);
  }

  /**
   * Get agromet advisory data
   */
  static async getAgrometAdvisory(filters = {}) {
    return await this.getByContentType('agromet_advisory', filters);
  }

  /**
   * Get poultry calendar data
   */
  static async getPoultryCalendar(filters = {}) {
    return await this.getByContentType('poultry_calendar', filters);
  }

  /**
   * Get commodity advisory data
   */
  static async getCommodityAdvisory(filters = {}) {
    return await this.getByContentType('commodity_advisory', filters);
  }

  /**
   * Get available filter values
   */
  static async getFilterValues(field) {
    try {
      let query_text;
      
      switch (field) {
        case 'districts':
          query_text = `
            SELECT DISTINCT d.name, d.code, r.name as region_name
            FROM agricultural_records ar
            JOIN districts d ON ar.district_id = d.id
            JOIN regions r ON d.region_id = r.id
            WHERE ar.status = 'active'
            ORDER BY r.name, d.name
          `;
          break;
          
        case 'commodities':
          query_text = `
            SELECT DISTINCT c.name, c.code, c.category
            FROM agricultural_records ar
            JOIN commodities c ON ar.commodity_id = c.id
            WHERE ar.status = 'active'
            ORDER BY c.category, c.name
          `;
          break;
          
        case 'regions':
          query_text = `
            SELECT DISTINCT r.name, r.code, r.zone
            FROM agricultural_records ar
            JOIN regions r ON ar.region_id = r.id
            WHERE ar.status = 'active'
            ORDER BY r.name
          `;
          break;
          
        case 'seasons':
          query_text = `
            SELECT DISTINCT season as name
            FROM agricultural_records
            WHERE status = 'active' AND season IS NOT NULL
            ORDER BY season
          `;
          break;
          
        case 'years':
          query_text = `
            SELECT DISTINCT year as name
            FROM agricultural_records
            WHERE status = 'active' AND year IS NOT NULL
            ORDER BY year DESC
          `;
          break;
          
        default:
          throw new Error(`Unknown filter field: ${field}`);
      }
      
      const result = await query(query_text);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get filter values for ${field}: ${error.message}`);
    }
  }

  /**
   * Get statistics
   */
  static async getStatistics() {
    try {
      const result = await query(`
        SELECT 
          content_type,
          COUNT(*) as record_count,
          COUNT(DISTINCT region_id) as unique_regions,
          COUNT(DISTINCT district_id) as unique_districts,
          COUNT(DISTINCT commodity_id) as unique_commodities,
          MAX(created_at) as latest_record
        FROM agricultural_records
        WHERE status = 'active'
        GROUP BY content_type
        ORDER BY content_type
      `);

      // Get overall statistics
      const overallResult = await query(`
        SELECT 
          COUNT(*) as total_records,
          COUNT(DISTINCT file_id) as unique_files,
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(DISTINCT region_id) as total_regions,
          COUNT(DISTINCT district_id) as total_districts,
          COUNT(DISTINCT commodity_id) as total_commodities
        FROM agricultural_records
        WHERE status = 'active'
      `);

      return {
        byContentType: result.rows,
        overall: overallResult.rows[0]
      };
    } catch (error) {
      throw new Error(`Failed to get statistics: ${error.message}`);
    }
  }

  /**
   * Update record
   */
  async update(updateData) {
    try {
      const allowedFields = [
        'variety', 'season', 'year', 'month_year', 'week_range',
        'start_date', 'end_date', 'planting_start', 'planting_end',
        'harvest_start', 'harvest_end', 'activity_description',
        'priority', 'weather_condition', 'temperature_range',
        'rainfall_info', 'humidity_info', 'soil_moisture',
        'advisory_text', 'activity', 'tools_required',
        'duration_days', 'notes', 'status'
      ];

      const updateFields = [];
      const params = [];
      let paramCount = 0;

      Object.keys(updateData).forEach(field => {
        if (allowedFields.includes(field) && updateData[field] !== undefined) {
          paramCount++;
          updateFields.push(`${field} = $${paramCount}`);
          params.push(updateData[field]);
        }
      });

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      paramCount++;
      params.push(this.id);

      const result = await query(`
        UPDATE agricultural_records 
        SET ${updateFields.join(', ')}, updated_at = NOW()
        WHERE id = $${paramCount}
        RETURNING *
      `, params);

      if (result.rows.length === 0) {
        throw new Error('Record not found');
      }

      Object.assign(this, result.rows[0]);
      return this;
    } catch (error) {
      throw new Error(`Failed to update record: ${error.message}`);
    }
  }

  /**
   * Soft delete record
   */
  async delete() {
    try {
      await query(
        'UPDATE agricultural_records SET status = $1, updated_at = NOW() WHERE id = $2',
        ['deleted', this.id]
      );
      
      this.status = 'deleted';
      return this;
    } catch (error) {
      throw new Error(`Failed to delete record: ${error.message}`);
    }
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    const json = { ...this };
    
    // Parse JSON fields if they're strings
    if (typeof json.rawData === 'string') {
      try {
        json.rawData = JSON.parse(json.rawData);
      } catch (e) {
        // Keep as string if parsing fails
      }
    }
    
    if (typeof json.validationErrors === 'string') {
      try {
        json.validationErrors = JSON.parse(json.validationErrors);
      } catch (e) {
        // Keep as string if parsing fails
      }
    }
    
    return json;
  }
}

export default AgriculturalRecord;