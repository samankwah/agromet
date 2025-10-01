import ReferenceData from '../models/ReferenceData.js';

/**
 * Data Validation Engine
 * Validates agricultural data against reference tables and business rules
 */

class DataValidationEngine {
  constructor() {
    // Cached reference data for performance
    this.cache = {
      regions: new Map(),
      districts: new Map(),
      commodities: new Map(),
      productionStages: new Map(),
      lastCacheUpdate: null,
      cacheValidityMs: 30 * 60 * 1000 // 30 minutes
    };

    // Validation rules
    this.validationRules = {
      required: ['region', 'district', 'commodity'],
      dateFields: ['startDate', 'endDate', 'plantingStart', 'harvestStart'],
      numericFields: ['year', 'durationDays'],
      enumFields: {
        priority: ['High', 'Medium', 'Low'],
        status: ['active', 'inactive', 'deleted'],
        season: ['Major', 'Minor', 'Dry', 'Year-round']
      }
    };

    // Common validation patterns
    this.patterns = {
      regionCode: /^REG\d{2}$/,
      districtCode: /^DS\d{3}$/,
      commodityCode: /^CT\d{10}$/,
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      year: /^\d{4}$/,
      monthYear: /^[A-Za-z]+\/[A-Za-z]+\s+\d{4}$|^\d{4}$/
    };
  }

  /**
   * Validate a single agricultural record
   */
  async validateRecord(record, contentType = 'general') {
    const errors = [];
    const warnings = [];

    try {
      // Basic field validation
      const basicValidation = this.validateBasicFields(record);
      errors.push(...basicValidation.errors);
      warnings.push(...basicValidation.warnings);

      // Reference data validation
      const refValidation = await this.validateReferenceData(record);
      errors.push(...refValidation.errors);
      warnings.push(...refValidation.warnings);

      // Content type specific validation
      const contentValidation = this.validateContentSpecificFields(record, contentType);
      errors.push(...contentValidation.errors);
      warnings.push(...contentValidation.warnings);

      // Business rules validation
      const businessValidation = this.validateBusinessRules(record, contentType);
      errors.push(...businessValidation.errors);
      warnings.push(...businessValidation.warnings);

      // Date consistency validation
      const dateValidation = this.validateDateConsistency(record);
      errors.push(...dateValidation.errors);
      warnings.push(...dateValidation.warnings);

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        score: this.calculateValidationScore(errors, warnings),
        validatedAt: new Date().toISOString()
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [`Validation failed: ${error.message}`],
        warnings: [],
        score: 0,
        validatedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Validate multiple records in batch
   */
  async validateBatch(records, contentType = 'general') {
    const results = [];
    const summary = {
      total: records.length,
      valid: 0,
      invalid: 0,
      warnings: 0,
      averageScore: 0
    };

    // Refresh cache before batch validation
    await this.refreshCache();

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const validation = await this.validateRecord(record, contentType);
      
      validation.index = i;
      validation.recordId = record.id || `record_${i}`;
      
      results.push(validation);

      // Update summary
      if (validation.isValid) {
        summary.valid++;
      } else {
        summary.invalid++;
      }

      if (validation.warnings.length > 0) {
        summary.warnings++;
      }

      summary.averageScore += validation.score;
    }

    summary.averageScore = summary.averageScore / records.length;

    return {
      summary,
      results,
      validatedAt: new Date().toISOString()
    };
  }

  /**
   * Validate basic fields (required, format, type)
   */
  validateBasicFields(record) {
    const errors = [];
    const warnings = [];

    // Check required fields
    this.validationRules.required.forEach(field => {
      if (!record[field] || record[field].toString().trim() === '') {
        errors.push(`Required field '${field}' is missing or empty`);
      }
    });

    // Validate date fields
    this.validationRules.dateFields.forEach(field => {
      if (record[field]) {
        if (!this.isValidDate(record[field])) {
          errors.push(`Invalid date format in field '${field}': ${record[field]}`);
        }
      }
    });

    // Validate numeric fields
    this.validationRules.numericFields.forEach(field => {
      if (record[field] !== undefined && record[field] !== null) {
        const num = Number(record[field]);
        if (isNaN(num)) {
          errors.push(`Field '${field}' must be a number, got: ${record[field]}`);
        }
      }
    });

    // Validate enum fields
    Object.entries(this.validationRules.enumFields).forEach(([field, allowedValues]) => {
      if (record[field] && !allowedValues.includes(record[field])) {
        errors.push(`Field '${field}' has invalid value '${record[field]}'. Allowed values: ${allowedValues.join(', ')}`);
      }
    });

    // Validate year
    if (record.year) {
      const year = Number(record.year);
      const currentYear = new Date().getFullYear();
      if (year < 2020 || year > currentYear + 5) {
        warnings.push(`Year ${year} seems outside normal range (2020-${currentYear + 5})`);
      }
    }

    // Validate email if present
    if (record.email && !this.patterns.email.test(record.email)) {
      errors.push(`Invalid email format: ${record.email}`);
    }

    return { errors, warnings };
  }

  /**
   * Validate against reference data
   */
  async validateReferenceData(record) {
    const errors = [];
    const warnings = [];

    await this.ensureCacheValid();

    // Validate region
    if (record.region || record.regionCode) {
      const regionValid = await this.validateRegion(record.region, record.regionCode);
      if (!regionValid.isValid) {
        errors.push(regionValid.error);
      } else if (regionValid.warning) {
        warnings.push(regionValid.warning);
      }
    }

    // Validate district
    if (record.district || record.districtCode) {
      const districtValid = await this.validateDistrict(record.district, record.districtCode, record.regionCode);
      if (!districtValid.isValid) {
        errors.push(districtValid.error);
      } else if (districtValid.warning) {
        warnings.push(districtValid.warning);
      }
    }

    // Validate commodity
    if (record.crop || record.commodity || record.commodityCode) {
      const commodityValid = await this.validateCommodity(record.crop || record.commodity, record.commodityCode);
      if (!commodityValid.isValid) {
        errors.push(commodityValid.error);
      } else if (commodityValid.warning) {
        warnings.push(commodityValid.warning);
      }
    }

    // Validate production stage
    if (record.productionStage || record.stage) {
      const stageValid = await this.validateProductionStage(record.productionStage || record.stage);
      if (!stageValid.isValid) {
        warnings.push(stageValid.error); // Stage validation is usually a warning, not error
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate region against reference data
   */
  async validateRegion(regionName, regionCode) {
    if (regionCode) {
      if (!this.patterns.regionCode.test(regionCode)) {
        return { isValid: false, error: `Invalid region code format: ${regionCode}` };
      }

      const region = await ReferenceData.getRegionByCode(regionCode);
      if (!region) {
        return { isValid: false, error: `Region code '${regionCode}' not found in database` };
      }

      // Check name consistency if both provided
      if (regionName && region.name.toLowerCase() !== regionName.toLowerCase()) {
        return { 
          isValid: true, 
          warning: `Region name '${regionName}' doesn't match code '${regionCode}' (${region.name})` 
        };
      }
    } else if (regionName) {
      const region = await ReferenceData.getRegionByName(regionName);
      if (!region) {
        return { isValid: false, error: `Region '${regionName}' not found in database` };
      }
    }

    return { isValid: true };
  }

  /**
   * Validate district against reference data
   */
  async validateDistrict(districtName, districtCode, regionCode) {
    if (districtCode) {
      if (!this.patterns.districtCode.test(districtCode)) {
        return { isValid: false, error: `Invalid district code format: ${districtCode}` };
      }

      const district = await ReferenceData.getDistrictByCode(districtCode);
      if (!district) {
        return { isValid: false, error: `District code '${districtCode}' not found in database` };
      }

      // Check region-district relationship
      if (regionCode) {
        const isValidCombination = await ReferenceData.validateRegionDistrict(regionCode, districtCode);
        if (!isValidCombination) {
          return { 
            isValid: false, 
            error: `District '${districtCode}' does not belong to region '${regionCode}'` 
          };
        }
      }

      // Check name consistency
      if (districtName && district.name.toLowerCase() !== districtName.toLowerCase()) {
        return { 
          isValid: true, 
          warning: `District name '${districtName}' doesn't match code '${districtCode}' (${district.name})` 
        };
      }
    } else if (districtName) {
      const district = await ReferenceData.getDistrictByName(districtName, regionCode);
      if (!district) {
        return { isValid: false, error: `District '${districtName}' not found in database` };
      }
    }

    return { isValid: true };
  }

  /**
   * Validate commodity against reference data
   */
  async validateCommodity(commodityName, commodityCode) {
    if (commodityCode) {
      if (!this.patterns.commodityCode.test(commodityCode)) {
        return { isValid: false, error: `Invalid commodity code format: ${commodityCode}` };
      }

      const commodity = await ReferenceData.getCommodityByCode(commodityCode);
      if (!commodity) {
        return { isValid: false, error: `Commodity code '${commodityCode}' not found in database` };
      }

      // Check name consistency
      if (commodityName && commodity.name.toLowerCase() !== commodityName.toLowerCase()) {
        return { 
          isValid: true, 
          warning: `Commodity name '${commodityName}' doesn't match code '${commodityCode}' (${commodity.name})` 
        };
      }
    } else if (commodityName) {
      const commodity = await ReferenceData.getCommodityByName(commodityName);
      if (!commodity) {
        return { isValid: false, error: `Commodity '${commodityName}' not found in database` };
      }
    }

    return { isValid: true };
  }

  /**
   * Validate production stage
   */
  async validateProductionStage(stageName) {
    if (!stageName) return { isValid: true };

    const stage = await ReferenceData.getProductionStageByName(stageName);
    if (!stage) {
      return { isValid: false, error: `Production stage '${stageName}' not found in database` };
    }

    return { isValid: true };
  }

  /**
   * Validate content-specific fields
   */
  validateContentSpecificFields(record, contentType) {
    const errors = [];
    const warnings = [];

    switch (contentType) {
      case 'crop_calendar':
        return this.validateCropCalendarFields(record);
      
      case 'production_calendar':
        return this.validateProductionCalendarFields(record);
      
      case 'agromet_advisory':
        return this.validateAgrometAdvisoryFields(record);
      
      case 'poultry_calendar':
        return this.validatePoultryCalendarFields(record);
      
      case 'commodity_advisory':
        return this.validateCommodityAdvisoryFields(record);
      
      default:
        return { errors, warnings };
    }
  }

  /**
   * Validate crop calendar specific fields
   */
  validateCropCalendarFields(record) {
    const errors = [];
    const warnings = [];

    // Check if planting dates are provided
    if (!record.plantingStart && !record.plantingEnd) {
      warnings.push('No planting dates specified');
    }

    // Check if harvest dates are provided
    if (!record.harvestStart && !record.harvestEnd) {
      warnings.push('No harvest dates specified');
    }

    // Validate season
    if (!record.season) {
      warnings.push('Season not specified');
    }

    return { errors, warnings };
  }

  /**
   * Validate production calendar specific fields
   */
  validateProductionCalendarFields(record) {
    const errors = [];
    const warnings = [];

    if (!record.activity && !record.activityDescription) {
      warnings.push('No activity description provided');
    }

    if (!record.monthYear && !record.month) {
      warnings.push('No timing information provided');
    }

    return { errors, warnings };
  }

  /**
   * Validate agromet advisory specific fields
   */
  validateAgrometAdvisoryFields(record) {
    const errors = [];
    const warnings = [];

    if (!record.advisoryText && !record.weatherCondition) {
      warnings.push('No advisory or weather information provided');
    }

    return { errors, warnings };
  }

  /**
   * Validate poultry calendar specific fields
   */
  validatePoultryCalendarFields(record) {
    const errors = [];
    const warnings = [];

    if (!record.poultryType) {
      warnings.push('Poultry type not specified');
    }

    if (!record.activity && !record.activityDescription) {
      warnings.push('No activity description provided');
    }

    return { errors, warnings };
  }

  /**
   * Validate commodity advisory specific fields
   */
  validateCommodityAdvisoryFields(record) {
    const errors = [];
    const warnings = [];

    if (!record.productionStage && !record.stage) {
      warnings.push('Production stage not specified');
    }

    if (!record.monthYear) {
      warnings.push('Month/year not specified');
    }

    if (!record.weekRange) {
      warnings.push('Week range not specified');
    }

    return { errors, warnings };
  }

  /**
   * Validate business rules
   */
  validateBusinessRules(record, contentType) {
    const errors = [];
    const warnings = [];

    // Check for duplicate data patterns (basic check)
    if (record.id && record.id.includes('duplicate')) {
      warnings.push('Potential duplicate record detected');
    }

    // Validate crop-season combinations
    if (record.crop && record.season) {
      const validation = this.validateCropSeasonCombination(record.crop, record.season);
      if (!validation.isValid) {
        warnings.push(validation.message);
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate date consistency
   */
  validateDateConsistency(record) {
    const errors = [];
    const warnings = [];

    // Check start and end date consistency
    if (record.startDate && record.endDate) {
      const startDate = new Date(record.startDate);
      const endDate = new Date(record.endDate);

      if (startDate > endDate) {
        errors.push('Start date cannot be after end date');
      }

      // Check for unreasonably long periods
      const diffDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
      if (diffDays > 365) {
        warnings.push(`Period spans ${Math.round(diffDays)} days, which seems unusually long`);
      }
    }

    // Check planting-harvest consistency for crop calendars
    if (record.plantingStart && record.harvestStart) {
      const plantingMonths = this.getMonthNumber(record.plantingStart);
      const harvestMonths = this.getMonthNumber(record.harvestStart);

      if (plantingMonths >= harvestMonths) {
        warnings.push('Harvest typically should be after planting');
      }
    }

    return { errors, warnings };
  }

  /**
   * Calculate validation score (0-100)
   */
  calculateValidationScore(errors, warnings) {
    let score = 100;
    
    // Deduct points for errors (more severe)
    score -= errors.length * 20;
    
    // Deduct points for warnings (less severe)
    score -= warnings.length * 5;
    
    return Math.max(0, score);
  }

  /**
   * Validate crop-season combination
   */
  validateCropSeasonCombination(crop, season) {
    // Basic crop-season validation logic
    const cropSeasonRules = {
      'rice': ['Major', 'Minor'],
      'maize': ['Major', 'Minor'],
      'cassava': ['Year-round'],
      'yam': ['Major'],
      'cocoa': ['Year-round']
    };

    const normalizedCrop = crop.toLowerCase();
    const allowedSeasons = cropSeasonRules[normalizedCrop];

    if (allowedSeasons && !allowedSeasons.includes(season)) {
      return {
        isValid: false,
        message: `${crop} is not typically grown in ${season} season`
      };
    }

    return { isValid: true };
  }

  /**
   * Ensure cache is valid and refresh if needed
   */
  async ensureCacheValid() {
    const now = new Date();
    const cacheAge = now - this.cache.lastCacheUpdate;

    if (!this.cache.lastCacheUpdate || cacheAge > this.cache.cacheValidityMs) {
      await this.refreshCache();
    }
  }

  /**
   * Refresh reference data cache
   */
  async refreshCache() {
    try {
      console.log('🔄 Refreshing validation cache...');

      // Load all reference data
      const [regions, districts, commodities, stages] = await Promise.all([
        ReferenceData.getRegions(),
        ReferenceData.getDistricts(),
        ReferenceData.getCommodities(),
        ReferenceData.getProductionStages()
      ]);

      // Clear existing cache
      this.cache.regions.clear();
      this.cache.districts.clear();
      this.cache.commodities.clear();
      this.cache.productionStages.clear();

      // Populate cache
      regions.forEach(region => {
        this.cache.regions.set(region.code, region);
        this.cache.regions.set(region.name.toLowerCase(), region);
      });

      districts.forEach(district => {
        this.cache.districts.set(district.code, district);
        this.cache.districts.set(district.name.toLowerCase(), district);
      });

      commodities.forEach(commodity => {
        this.cache.commodities.set(commodity.code, commodity);
        this.cache.commodities.set(commodity.name.toLowerCase(), commodity);
      });

      stages.forEach(stage => {
        this.cache.productionStages.set(stage.name.toLowerCase(), stage);
      });

      this.cache.lastCacheUpdate = new Date();
      console.log('✅ Validation cache refreshed');

    } catch (error) {
      console.error('❌ Error refreshing validation cache:', error);
    }
  }

  /**
   * Helper methods
   */
  isValidDate(dateString) {
    if (!dateString) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  getMonthNumber(monthName) {
    const months = {
      january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
      july: 7, august: 8, september: 9, october: 10, november: 11, december: 12
    };
    return months[monthName.toLowerCase()] || 0;
  }

  /**
   * Generate validation report
   */
  generateValidationReport(batchResults) {
    const { summary, results } = batchResults;

    const report = {
      summary: {
        ...summary,
        validationRate: `${Math.round((summary.valid / summary.total) * 100)}%`,
        warningRate: `${Math.round((summary.warnings / summary.total) * 100)}%`
      },
      errorBreakdown: {},
      warningBreakdown: {},
      recommendations: []
    };

    // Count error types
    results.forEach(result => {
      result.errors.forEach(error => {
        report.errorBreakdown[error] = (report.errorBreakdown[error] || 0) + 1;
      });

      result.warnings.forEach(warning => {
        report.warningBreakdown[warning] = (report.warningBreakdown[warning] || 0) + 1;
      });
    });

    // Generate recommendations
    if (summary.invalid > summary.valid) {
      report.recommendations.push('High number of invalid records detected. Review data formatting and required fields.');
    }

    if (summary.warnings > summary.total * 0.5) {
      report.recommendations.push('Many records have warnings. Consider reviewing data quality and completeness.');
    }

    if (summary.averageScore < 70) {
      report.recommendations.push('Overall data quality is below recommended threshold. Recommend data cleanup.');
    }

    return report;
  }
}

export default new DataValidationEngine();