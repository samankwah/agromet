import { query } from '../config/database.js';

class ReferenceData {
  /**
   * Get all regions
   */
  static async getRegions(filters = {}) {
    try {
      const { search, zone } = filters;
      
      let baseQuery = 'SELECT * FROM regions WHERE 1=1';
      const params = [];
      let paramCount = 0;

      if (search) {
        paramCount++;
        baseQuery += ` AND (name ILIKE $${paramCount} OR code ILIKE $${paramCount})`;
        params.push(`%${search}%`);
      }

      if (zone) {
        paramCount++;
        baseQuery += ` AND zone ILIKE $${paramCount}`;
        params.push(`%${zone}%`);
      }

      baseQuery += ' ORDER BY name';

      const result = await query(baseQuery, params);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get regions: ${error.message}`);
    }
  }

  /**
   * Get region by code
   */
  static async getRegionByCode(code) {
    try {
      const result = await query('SELECT * FROM regions WHERE code = $1', [code]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw new Error(`Failed to get region by code: ${error.message}`);
    }
  }

  /**
   * Get region by name
   */
  static async getRegionByName(name) {
    try {
      const result = await query('SELECT * FROM regions WHERE name ILIKE $1', [`%${name}%`]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw new Error(`Failed to get region by name: ${error.message}`);
    }
  }

  /**
   * Get all districts
   */
  static async getDistricts(filters = {}) {
    try {
      const { search, regionId, regionCode } = filters;
      
      let baseQuery = `
        SELECT d.*, r.name as region_name, r.code as region_code, r.zone as region_zone
        FROM districts d
        LEFT JOIN regions r ON d.region_id = r.id
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 0;

      if (search) {
        paramCount++;
        baseQuery += ` AND (d.name ILIKE $${paramCount} OR d.code ILIKE $${paramCount})`;
        params.push(`%${search}%`);
      }

      if (regionId) {
        paramCount++;
        baseQuery += ` AND d.region_id = $${paramCount}`;
        params.push(regionId);
      }

      if (regionCode) {
        paramCount++;
        baseQuery += ` AND r.code = $${paramCount}`;
        params.push(regionCode);
      }

      baseQuery += ' ORDER BY r.name, d.name';

      const result = await query(baseQuery, params);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get districts: ${error.message}`);
    }
  }

  /**
   * Get district by code
   */
  static async getDistrictByCode(code) {
    try {
      const result = await query(`
        SELECT d.*, r.name as region_name, r.code as region_code, r.zone as region_zone
        FROM districts d
        LEFT JOIN regions r ON d.region_id = r.id
        WHERE d.code = $1
      `, [code]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw new Error(`Failed to get district by code: ${error.message}`);
    }
  }

  /**
   * Get district by name
   */
  static async getDistrictByName(name, regionCode = null) {
    try {
      let queryText = `
        SELECT d.*, r.name as region_name, r.code as region_code, r.zone as region_zone
        FROM districts d
        LEFT JOIN regions r ON d.region_id = r.id
        WHERE d.name ILIKE $1
      `;
      const params = [`%${name}%`];

      if (regionCode) {
        queryText += ' AND r.code = $2';
        params.push(regionCode);
      }

      const result = await query(queryText, params);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw new Error(`Failed to get district by name: ${error.message}`);
    }
  }

  /**
   * Get districts by region
   */
  static async getDistrictsByRegion(regionCode) {
    try {
      const result = await query(`
        SELECT d.*, r.name as region_name, r.code as region_code, r.zone as region_zone
        FROM districts d
        JOIN regions r ON d.region_id = r.id
        WHERE r.code = $1
        ORDER BY d.name
      `, [regionCode]);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get districts by region: ${error.message}`);
    }
  }

  /**
   * Get all commodities
   */
  static async getCommodities(filters = {}) {
    try {
      const { search, category } = filters;
      
      let baseQuery = 'SELECT * FROM commodities WHERE 1=1';
      const params = [];
      let paramCount = 0;

      if (search) {
        paramCount++;
        baseQuery += ` AND (name ILIKE $${paramCount} OR code ILIKE $${paramCount})`;
        params.push(`%${search}%`);
      }

      if (category) {
        paramCount++;
        baseQuery += ` AND category = $${paramCount}`;
        params.push(category);
      }

      baseQuery += ' ORDER BY category, name';

      const result = await query(baseQuery, params);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get commodities: ${error.message}`);
    }
  }

  /**
   * Get commodity by code
   */
  static async getCommodityByCode(code) {
    try {
      const result = await query('SELECT * FROM commodities WHERE code = $1', [code]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw new Error(`Failed to get commodity by code: ${error.message}`);
    }
  }

  /**
   * Get commodity by name
   */
  static async getCommodityByName(name) {
    try {
      const result = await query('SELECT * FROM commodities WHERE name ILIKE $1', [`%${name}%`]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw new Error(`Failed to get commodity by name: ${error.message}`);
    }
  }

  /**
   * Get commodities by category
   */
  static async getCommoditiesByCategory(category) {
    try {
      const result = await query(
        'SELECT * FROM commodities WHERE category = $1 ORDER BY name',
        [category]
      );
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get commodities by category: ${error.message}`);
    }
  }

  /**
   * Get all production stages
   */
  static async getProductionStages(filters = {}) {
    try {
      const { search, category } = filters;
      
      let baseQuery = 'SELECT * FROM production_stages WHERE 1=1';
      const params = [];
      let paramCount = 0;

      if (search) {
        paramCount++;
        baseQuery += ` AND name ILIKE $${paramCount}`;
        params.push(`%${search}%`);
      }

      if (category) {
        paramCount++;
        baseQuery += ` AND category = $${paramCount}`;
        params.push(category);
      }

      baseQuery += ' ORDER BY category, sequence_order, name';

      const result = await query(baseQuery, params);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get production stages: ${error.message}`);
    }
  }

  /**
   * Get production stage by name
   */
  static async getProductionStageByName(name) {
    try {
      const result = await query(
        'SELECT * FROM production_stages WHERE name ILIKE $1',
        [`%${name}%`]
      );
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw new Error(`Failed to get production stage by name: ${error.message}`);
    }
  }

  /**
   * Search across all reference data
   */
  static async globalSearch(searchTerm, limit = 50) {
    try {
      const results = {
        regions: [],
        districts: [],
        commodities: [],
        productionStages: []
      };

      // Search regions
      const regionResult = await query(`
        SELECT 'region' as type, id, name, code, zone as extra_info
        FROM regions
        WHERE name ILIKE $1 OR code ILIKE $1
        ORDER BY name
        LIMIT $2
      `, [`%${searchTerm}%`, Math.floor(limit / 4)]);

      // Search districts
      const districtResult = await query(`
        SELECT 'district' as type, d.id, d.name, d.code, r.name as extra_info
        FROM districts d
        LEFT JOIN regions r ON d.region_id = r.id
        WHERE d.name ILIKE $1 OR d.code ILIKE $1
        ORDER BY d.name
        LIMIT $2
      `, [`%${searchTerm}%`, Math.floor(limit / 4)]);

      // Search commodities
      const commodityResult = await query(`
        SELECT 'commodity' as type, id, name, code, category as extra_info
        FROM commodities
        WHERE name ILIKE $1 OR code ILIKE $1
        ORDER BY name
        LIMIT $2
      `, [`%${searchTerm}%`, Math.floor(limit / 4)]);

      // Search production stages
      const stageResult = await query(`
        SELECT 'production_stage' as type, id, name, '' as code, category as extra_info
        FROM production_stages
        WHERE name ILIKE $1
        ORDER BY name
        LIMIT $2
      `, [`%${searchTerm}%`, Math.floor(limit / 4)]);

      return [
        ...regionResult.rows,
        ...districtResult.rows,
        ...commodityResult.rows,
        ...stageResult.rows
      ];
    } catch (error) {
      throw new Error(`Failed to perform global search: ${error.message}`);
    }
  }

  /**
   * Get reference data statistics
   */
  static async getStatistics() {
    try {
      const result = await query(`
        SELECT 
          (SELECT COUNT(*) FROM regions) as regions_count,
          (SELECT COUNT(*) FROM districts) as districts_count,
          (SELECT COUNT(*) FROM commodities) as commodities_count,
          (SELECT COUNT(*) FROM production_stages) as production_stages_count,
          (SELECT COUNT(DISTINCT category) FROM commodities) as commodity_categories_count,
          (SELECT COUNT(DISTINCT zone) FROM regions) as zones_count
      `);

      // Get category breakdown for commodities
      const categoryResult = await query(`
        SELECT category, COUNT(*) as count
        FROM commodities
        GROUP BY category
        ORDER BY count DESC
      `);

      // Get zone breakdown for regions
      const zoneResult = await query(`
        SELECT zone, COUNT(*) as count
        FROM regions
        GROUP BY zone
        ORDER BY count DESC
      `);

      return {
        overview: result.rows[0],
        commodityCategories: categoryResult.rows,
        regionZones: zoneResult.rows
      };
    } catch (error) {
      throw new Error(`Failed to get reference data statistics: ${error.message}`);
    }
  }

  /**
   * Validate region-district combination
   */
  static async validateRegionDistrict(regionCode, districtCode) {
    try {
      const result = await query(`
        SELECT COUNT(*) as count
        FROM districts d
        JOIN regions r ON d.region_id = r.id
        WHERE r.code = $1 AND d.code = $2
      `, [regionCode, districtCode]);

      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      throw new Error(`Failed to validate region-district combination: ${error.message}`);
    }
  }

  /**
   * Get complete location hierarchy
   */
  static async getLocationHierarchy() {
    try {
      const result = await query(`
        SELECT 
          r.id as region_id,
          r.code as region_code,
          r.name as region_name,
          r.zone,
          json_agg(
            json_build_object(
              'id', d.id,
              'code', d.code,
              'name', d.name,
              'capital', d.capital
            ) ORDER BY d.name
          ) as districts
        FROM regions r
        LEFT JOIN districts d ON r.id = d.region_id
        GROUP BY r.id, r.code, r.name, r.zone
        ORDER BY r.name
      `);

      return result.rows.map(row => ({
        ...row,
        districts: row.districts.filter(d => d.id !== null) // Remove null districts
      }));
    } catch (error) {
      throw new Error(`Failed to get location hierarchy: ${error.message}`);
    }
  }

  /**
   * Bulk create regions
   */
  static async createRegions(regions) {
    try {
      const results = [];
      
      for (const region of regions) {
        const { code, name, zone } = region;
        const result = await query(`
          INSERT INTO regions (code, name, zone)
          VALUES ($1, $2, $3)
          ON CONFLICT (code) DO UPDATE SET
            name = EXCLUDED.name,
            zone = EXCLUDED.zone
          RETURNING *
        `, [code, name, zone]);
        
        results.push(result.rows[0]);
      }
      
      return results;
    } catch (error) {
      throw new Error(`Failed to create regions: ${error.message}`);
    }
  }

  /**
   * Bulk create districts
   */
  static async createDistricts(districts) {
    try {
      const results = [];
      
      for (const district of districts) {
        const { code, name, capital, regionCode } = district;
        
        // Get region ID
        const regionResult = await query('SELECT id FROM regions WHERE code = $1', [regionCode]);
        if (regionResult.rows.length === 0) {
          throw new Error(`Region with code ${regionCode} not found`);
        }
        
        const regionId = regionResult.rows[0].id;
        
        const result = await query(`
          INSERT INTO districts (code, name, capital, region_id)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (code) DO UPDATE SET
            name = EXCLUDED.name,
            capital = EXCLUDED.capital,
            region_id = EXCLUDED.region_id
          RETURNING *
        `, [code, name, capital, regionId]);
        
        results.push(result.rows[0]);
      }
      
      return results;
    } catch (error) {
      throw new Error(`Failed to create districts: ${error.message}`);
    }
  }

  /**
   * Bulk create commodities
   */
  static async createCommodities(commodities) {
    try {
      const results = [];
      
      for (const commodity of commodities) {
        const { code, name, category } = commodity;
        
        const result = await query(`
          INSERT INTO commodities (code, name, category)
          VALUES ($1, $2, $3)
          ON CONFLICT (code) DO UPDATE SET
            name = EXCLUDED.name,
            category = EXCLUDED.category
          RETURNING *
        `, [code, name, category]);
        
        results.push(result.rows[0]);
      }
      
      return results;
    } catch (error) {
      throw new Error(`Failed to create commodities: ${error.message}`);
    }
  }
}

export default ReferenceData;