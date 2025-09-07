import XLSX from 'xlsx';
import Papa from 'papaparse';
import moment from 'moment';
import fs from 'fs';

/**
 * Enhanced Agricultural Data Parser Service V2
 * Supports Western Region Excel format and improved data processing
 */

class AgriculturalDataParserV2 {
  constructor() {
    // Ghana districts for validation (expanded list)
    this.ghanaDistricts = [
      'Accra Metropolitan', 'Tema Metropolitan', 'Kumasi Metropolitan',
      'Tamale Metropolitan', 'Sekondi-Takoradi Metropolitan', 'Cape Coast Metropolitan',
      'Obuasi Municipal', 'Sunyani Municipal', 'Ho Municipal', 'Koforidua Municipal',
      'Wa Municipal', 'Bolgatanga Municipal', 'Techiman Municipal', 'Nkoranza Municipal',
      'Biakoye', 'La-Dade-Kotopon', 'Ahanta West Municipal', 'Shama District',
      'Ellembelle District', 'Jomoro Municipal', 'Wassa East District',
      'Wassa Amenfi West Municipal', 'Wassa Amenfi Central Municipal',
      'Prestea Huni-Valley Municipal', 'Tarkwa-Nsuaem Municipal'
    ];

    // Crop types for validation (expanded)
    this.cropTypes = [
      'Maize', 'Rice', 'Cassava', 'Yam', 'Plantain', 'Cocoa', 'Coffee',
      'Tomato', 'Pepper', 'Onion', 'Okra', 'Garden Egg', 'Cabbage',
      'Lettuce', 'Carrot', 'Beans', 'Groundnut', 'Soybean', 'Cowpea',
      'Oil Palm', 'Coconut', 'Shea', 'Mango', 'Orange', 'Pineapple',
      'Broiler Chicken', 'Layer Chicken', 'Cattle', 'Goat', 'Sheep', 'Pig'
    ];

    // Production stages mapping
    this.productionStages = {
      'site selection': 'Site Selection',
      'site_selection': 'Site Selection',
      'land preparation': 'Land Preparation',
      'land_preparation': 'Land Preparation',
      'seed selection': 'Seed Selection',
      'seed selection and seed treatme': 'Seed Selection', // Handle truncated names
      'seed selection and seed treatment': 'Seed Selection',
      'planting sowing': 'Planting/Sowing',
      'planting_sowing': 'Planting/Sowing',
      'planting': 'Planting/Sowing',
      'sowing': 'Planting/Sowing',
      'germination test': 'Germination',
      'germination': 'Germination',
      'nursery': 'Nursery Management',
      'nursery management': 'Nursery Management',
      'transplanting': 'Transplanting',
      '1st fertilizer': '1st Fertilizer Application',
      '1st fertilizer application': '1st Fertilizer Application',
      '2nd fertilizer': '2nd Fertilizer Application',
      '2nd fertilizer application': '2nd Fertilizer Application',
      '2nd fertilizer applciation': '2nd Fertilizer Application', // Handle typos
      '3rd fertilizer': '3rd Fertilizer Application',
      '3rd fertilizer application': '3rd Fertilizer Application',
      'pest and disease': 'Pest and Disease Control',
      'pest and disease control': 'Pest and Disease Control',
      'weeding': 'Weeding',
      '2nd weed control': '2nd Weed Control',
      '2nd weed & pest control': '2nd Weed & Pest Control',
      'rogueing': 'Rogueing',
      'bird scaring and netting': 'Bird Scaring and Netting',
      'harvesting': 'Harvesting',
      'post harvest handling': 'Post-Harvest Handling',
      'post-harvest handling': 'Post-Harvest Handling'
    };

    // Region code mappings
    this.regionCodes = {
      'REG01': 'Greater Accra Region',
      'REG02': 'Ashanti Region', 
      'REG03': 'Western Region',
      'REG04': 'Central Region',
      'REG05': 'Eastern Region',
      'REG06': 'Western North Region',
      'REG07': 'Volta Region',
      'REG08': 'Northern Region',
      'REG09': 'Upper East Region',
      'REG10': 'Oti Region',
      'REG11': 'Upper West Region',
      'REG12': 'Brong Ahafo Region',
      'REG13': 'Ahafo Region',
      'REG14': 'Bono Region',
      'REG15': 'Bono East Region',
      'REG16': 'Savannah Region'
    };

    // Commodity code mappings
    this.commodityCodes = {
      'CT0000000001': 'maize',
      'CT0000000002': 'rice',
      'CT0000000005': 'broiler_chicken',
      'CT0000000006': 'tomato',
      'CT0000000008': 'rice', // Alternative rice code
      'CT0000000024': 'layer_chicken'
    };
  }

  /**
   * Enhanced file parsing with better format detection
   */
  async parseFile(filePath, fileType, originalName) {
    try {
      console.log(`📊 Parsing agricultural data file: ${originalName}`);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      let data;
      let isMultiSheet = false;
      let sheetData = {};

      if (fileType === 'csv') {
        data = await this.parseCSV(filePath);
      } else if (fileType === 'excel') {
        // First, check if it's a multi-sheet file
        const workbook = XLSX.readFile(filePath);
        
        if (workbook.SheetNames.length > 1) {
          console.log(`📋 Multi-sheet Excel file detected: ${workbook.SheetNames.length} sheets`);
          isMultiSheet = true;
          sheetData = await this.parseMultiSheetExcel(filePath);
          
          // For multi-sheet files, process each sheet separately
          return await this.processMultiSheetData(sheetData, originalName);
        } else {
          data = await this.parseExcel(filePath);
        }
      } else {
        throw new Error('Unsupported file type. Please use CSV or Excel files.');
      }

      if (!data || (Array.isArray(data) && data.length === 0)) {
        throw new Error('No data found in file or file is empty');
      }

      // Determine content type
      const contentType = this.determineContentType(originalName, data);
      console.log(`🔍 Detected content type: ${contentType}`);

      // Parse based on content type
      let parsedData;
      switch (contentType) {
        case 'crop_calendar':
          parsedData = this.parseCropCalendar(data);
          break;
        case 'production_calendar':
          parsedData = this.parseProductionCalendar(data);
          break;
        case 'agromet_advisory':
          parsedData = this.parseAgrometAdvisory(data);
          break;
        case 'poultry_calendar':
          parsedData = this.parsePoultryCalendar(data);
          break;
        case 'commodity_advisory':
          parsedData = this.parseCommodityAdvisory(data);
          break;
        default:
          // Try to auto-detect from structure
          parsedData = this.parseGenericStructure(data, originalName);
      }

      if (!parsedData || parsedData.length === 0) {
        throw new Error('No valid records found after parsing');
      }

      console.log(`✅ Successfully parsed ${parsedData.length} records`);

      return {
        contentType,
        data: parsedData,
        metadata: {
          originalName,
          recordCount: parsedData.length,
          parsedAt: new Date().toISOString(),
          isMultiSheet: isMultiSheet,
          sheets: isMultiSheet ? Object.keys(sheetData) : null
        }
      };

    } catch (error) {
      console.error('❌ Error parsing agricultural data:', error);
      throw error;
    }
  }

  /**
   * Enhanced multi-sheet Excel parsing for Western Region format
   */
  async parseMultiSheetExcel(filePath) {
    try {
      const workbook = XLSX.readFile(filePath);
      const allSheetData = {};

      console.log(`📋 Processing ${workbook.SheetNames.length} sheets:`, workbook.SheetNames);

      workbook.SheetNames.forEach(sheetName => {
        try {
          const worksheet = workbook.Sheets[sheetName];
          
          // Use header option to preserve exact column names
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            raw: false,  // Convert dates to strings
            dateNF: 'yyyy-mm-dd' // Date format
          });

          console.log(`   📄 Sheet "${sheetName}": ${jsonData.length} rows`);

          // Filter out completely empty rows
          const filteredData = jsonData.filter(row => {
            const values = Object.values(row);
            return values.some(value => 
              value !== null && 
              value !== undefined && 
              value.toString().trim() !== ''
            );
          });

          if (filteredData.length > 0) {
            // Add sheet name to each record for tracking
            const enrichedData = filteredData.map((record, index) => ({
              ...record,
              _sheetName: sheetName,
              _rowIndex: index + 2, // +2 because Excel is 1-indexed and we skip header
              _originalSheetName: sheetName
            }));

            allSheetData[sheetName] = enrichedData;
          }
        } catch (sheetError) {
          console.warn(`⚠️ Error processing sheet "${sheetName}":`, sheetError.message);
        }
      });

      return allSheetData;
    } catch (error) {
      throw new Error(`Multi-sheet Excel parsing error: ${error.message}`);
    }
  }

  /**
   * Process multi-sheet data (like Western Region advisory format)
   */
  async processMultiSheetData(sheetData, originalName) {
    const allRecords = [];
    const contentType = 'commodity_advisory'; // Multi-sheet files are typically commodity advisories

    for (const [sheetName, records] of Object.entries(sheetData)) {
      console.log(`🔄 Processing sheet: ${sheetName} (${records.length} records)`);

      try {
        // Normalize sheet name to production stage
        const productionStage = this.normalizeProductionStage(sheetName);

        const processedRecords = records.map((record, index) => {
          return this.processCommodityAdvisoryRecord(record, productionStage, index);
        }).filter(record => record !== null);

        allRecords.push(...processedRecords);
        console.log(`   ✅ Processed ${processedRecords.length} valid records from "${sheetName}"`);

      } catch (sheetError) {
        console.warn(`   ⚠️ Error processing sheet "${sheetName}":`, sheetError.message);
      }
    }

    return {
      contentType,
      data: allRecords,
      metadata: {
        originalName,
        recordCount: allRecords.length,
        parsedAt: new Date().toISOString(),
        isMultiSheet: true,
        sheets: Object.keys(sheetData),
        sheetsProcessed: Object.keys(sheetData).length
      }
    };
  }

  /**
   * Process individual commodity advisory record (Western Region format)
   */
  processCommodityAdvisoryRecord(record, productionStage, index) {
    try {
      // Extract standardized field values
      const zone = this.extractFieldValue(record, ['[ZONE]', 'ZONE', 'Zone', 'zone']);
      const regionRaw = this.extractFieldValue(record, ['[REGION]', 'REGION', 'Region', 'region']);
      const districtRaw = this.extractFieldValue(record, ['[DISTRICT]', 'DISTRICT', 'District', 'district']);
      const monthYear = this.extractFieldValue(record, ['[MONTH/YEAR]', 'MONTH/YEAR', 'Month/Year', 'month_year']);
      const weekRange = this.extractFieldValue(record, ['[WEEK]', 'WEEK', 'Week', 'week']);
      const startDateRaw = this.extractFieldValue(record, ['[START DATE]', 'START DATE', 'Start Date', 'start_date']);
      const endDateRaw = this.extractFieldValue(record, ['[END DATE]', 'END DATE', 'End Date', 'end_date']);
      const cropRaw = this.extractFieldValue(record, ['[CROP]', 'CROP', 'Crop', 'crop']);

      // Skip records that are clearly template placeholders or empty
      if (this.isPlaceholderRecord(zone, regionRaw, districtRaw, monthYear, weekRange)) {
        return null;
      }

      // Parse region and district
      const { region, regionCode } = this.parseRegionField(regionRaw);
      const { district, districtCode } = this.parseDistrictField(districtRaw);
      const { crop, commodityCode } = this.parseCropField(cropRaw);

      // Parse dates
      const startDate = this.parseExcelDate(startDateRaw);
      const endDate = this.parseExcelDate(endDateRaw);

      // Create standardized record
      const processedRecord = {
        id: `commodity_${Date.now()}_${index}`,
        
        // Geographic information
        zone: this.cleanString(zone),
        region: region,
        regionCode: regionCode,
        district: district,
        districtCode: districtCode,
        
        // Commodity information
        crop: crop,
        commodityCode: commodityCode,
        
        // Production stage
        productionStage: productionStage,
        stage: productionStage, // Alias for backward compatibility
        
        // Timing information
        monthYear: this.cleanString(monthYear),
        weekRange: this.cleanString(weekRange),
        startDate: startDate,
        endDate: endDate,
        
        // Additional fields from the record
        year: this.extractYearFromMonthYear(monthYear),
        season: this.determineSeason(monthYear),
        
        // Metadata
        sheetName: record._originalSheetName,
        rowIndex: record._rowIndex,
        rawData: { ...record }, // Store original data
        createdAt: new Date().toISOString(),
        
        // Content type
        contentType: 'commodity_advisory'
      };

      return processedRecord;

    } catch (error) {
      console.warn(`⚠️ Error processing record ${index}:`, error.message);
      return null;
    }
  }

  /**
   * Extract field value from record using multiple possible field names
   */
  extractFieldValue(record, possibleFields) {
    for (const field of possibleFields) {
      if (record[field] !== undefined && record[field] !== null) {
        const value = record[field].toString().trim();
        if (value !== '') {
          return value;
        }
      }
    }
    return null;
  }

  /**
   * Check if record contains placeholder data
   */
  isPlaceholderRecord(zone, region, district, monthYear, weekRange) {
    const placeholders = [
      'enter zone', 'enter region', 'enter district', 'enter month/year', 'enter week',
      'zone', 'region', 'district', 'month/year', 'week', '', null, undefined
    ];

    const values = [zone, region, district, monthYear, weekRange].map(v => 
      v ? v.toString().toLowerCase().trim() : ''
    );

    // If all values are empty or placeholders, skip this record
    return values.every(value => 
      !value || placeholders.includes(value)
    );
  }

  /**
   * Parse region field (handles "REG06/Western Region" format)
   */
  parseRegionField(regionRaw) {
    if (!regionRaw) return { region: null, regionCode: null };

    const regionStr = regionRaw.toString().trim();
    
    // Handle "REG06/Western Region" format
    const match = regionStr.match(/^(REG\d+)\/(.+)$/);
    if (match) {
      return {
        region: match[2].trim(),
        regionCode: match[1].trim()
      };
    }

    // Check if it's just a region code
    if (regionStr.match(/^REG\d+$/)) {
      return {
        region: this.regionCodes[regionStr] || regionStr,
        regionCode: regionStr
      };
    }

    // Assume it's just a region name
    return {
      region: regionStr,
      regionCode: null
    };
  }

  /**
   * Parse district field (handles "DS179/Biakoye" format)
   */
  parseDistrictField(districtRaw) {
    if (!districtRaw) return { district: null, districtCode: null };

    const districtStr = districtRaw.toString().trim();
    
    // Handle "DS179/Biakoye" format
    const match = districtStr.match(/^(DS\d+)\/(.+)$/);
    if (match) {
      return {
        district: match[2].trim(),
        districtCode: match[1].trim()
      };
    }

    // Check if it's just a district code
    if (districtStr.match(/^DS\d+$/)) {
      return {
        district: districtStr, // Keep as is if we don't have mapping
        districtCode: districtStr
      };
    }

    // Assume it's just a district name
    return {
      district: districtStr,
      districtCode: null
    };
  }

  /**
   * Parse crop field (handles "CT0000000008/rice" format)
   */
  parseCropField(cropRaw) {
    if (!cropRaw) return { crop: null, commodityCode: null };

    const cropStr = cropRaw.toString().trim();
    
    // Handle "CT0000000008/rice" format
    const match = cropStr.match(/^(CT\d+)\/(.+)$/);
    if (match) {
      return {
        crop: match[2].trim(),
        commodityCode: match[1].trim()
      };
    }

    // Check if it's just a commodity code
    if (cropStr.match(/^CT\d+$/)) {
      return {
        crop: this.commodityCodes[cropStr] || cropStr,
        commodityCode: cropStr
      };
    }

    // Assume it's just a crop name
    return {
      crop: cropStr.toLowerCase(),
      commodityCode: null
    };
  }

  /**
   * Normalize production stage names
   */
  normalizeProductionStage(stageName) {
    if (!stageName) return 'Unknown Stage';

    const normalized = stageName.toLowerCase().trim();
    
    // Check direct mappings first
    if (this.productionStages[normalized]) {
      return this.productionStages[normalized];
    }

    // Handle partial matches
    for (const [key, value] of Object.entries(this.productionStages)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return value;
      }
    }

    // Return cleaned version if no mapping found
    return stageName.trim().replace(/^\w/, c => c.toUpperCase());
  }

  /**
   * Parse Excel date values (handles Excel serial numbers)
   */
  parseExcelDate(dateValue) {
    if (!dateValue) return null;

    const str = dateValue.toString().trim();
    
    // If it's already a date string, return it
    if (str.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return str;
    }

    // If it's an Excel serial number
    const num = parseFloat(str);
    if (!isNaN(num) && num > 25568) { // Excel epoch check
      const excelEpoch = new Date(1900, 0, 1);
      const jsDate = new Date(excelEpoch.getTime() + (num - 2) * 24 * 60 * 60 * 1000);
      
      if (!isNaN(jsDate.getTime())) {
        return jsDate.toISOString().split('T')[0];
      }
    }

    // Try parsing as regular date
    try {
      const parsed = new Date(str);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }
    } catch (e) {
      // Ignore
    }

    return null;
  }

  /**
   * Extract year from month/year field
   */
  extractYearFromMonthYear(monthYear) {
    if (!monthYear) return new Date().getFullYear();

    const yearMatch = monthYear.toString().match(/(\d{4})/);
    return yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
  }

  /**
   * Determine season from month/year
   */
  determineSeason(monthYear) {
    if (!monthYear) return 'Unknown';

    const str = monthYear.toString().toLowerCase();
    
    // Major season months: March-July
    if (str.includes('march') || str.includes('april') || str.includes('may') || 
        str.includes('june') || str.includes('july')) {
      return 'Major';
    }

    // Minor season months: September-November  
    if (str.includes('september') || str.includes('october') || str.includes('november')) {
      return 'Minor';
    }

    // Dry season: December-February
    if (str.includes('december') || str.includes('january') || str.includes('february')) {
      return 'Dry';
    }

    return 'Unknown';
  }

  /**
   * Enhanced content type determination
   */
  determineContentType(filename, data) {
    const name = filename.toLowerCase();
    
    // Western Region specific patterns
    if (name.includes('western') && (name.includes('calendar') || name.includes('advisory'))) {
      if (name.includes('calendar')) {
        return 'crop_calendar';
      } else {
        return 'commodity_advisory';
      }
    }

    // Multi-sheet advisory detection
    if (name.includes('advisory') && (
        name.includes('rice') || name.includes('maize') || name.includes('tomato') ||
        name.includes('biakoye') || name.includes('layers') || name.includes('broilers')
    )) {
      return 'commodity_advisory';
    }

    // Standard patterns
    if (name.includes('crop') && name.includes('calendar')) {
      return 'crop_calendar';
    }

    if (name.includes('production') && name.includes('calendar')) {
      return 'production_calendar';
    }

    if (name.includes('poultry') && name.includes('calendar')) {
      return 'poultry_calendar';
    }

    if (name.includes('agromet') || (name.includes('advisory') && name.includes('weather'))) {
      return 'agromet_advisory';
    }

    // Analyze data structure if available
    if (data && data.length > 0) {
      const firstRecord = data[0];
      const headers = Object.keys(firstRecord).map(k => k.toLowerCase()).join(' ');

      // Check for Western Region advisory structure
      if (headers.includes('[zone]') && headers.includes('[region]') && 
          headers.includes('[district]') && headers.includes('[crop]')) {
        return 'commodity_advisory';
      }

      // Standard structure detection
      if (headers.includes('plant') && headers.includes('harvest')) {
        return 'crop_calendar';
      }

      if (headers.includes('activity') && headers.includes('month')) {
        return 'production_calendar';
      }

      if (headers.includes('weather') || headers.includes('advisory')) {
        return 'agromet_advisory';
      }

      if (headers.includes('poultry') || headers.includes('bird')) {
        return 'poultry_calendar';
      }
    }

    return 'unknown';
  }

  /**
   * Enhanced CSV parsing
   */
  async parseCSV(filePath) {
    return new Promise((resolve, reject) => {
      try {
        const csvData = fs.readFileSync(filePath, 'utf8');
        
        Papa.parse(csvData, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.trim(),
          transform: (value) => value.trim(),
          complete: (results) => {
            if (results.errors.length > 0) {
              console.warn('CSV parsing warnings:', results.errors);
            }
            resolve(results.data);
          },
          error: (error) => {
            reject(error);
          }
        });
      } catch (error) {
        reject(new Error(`File reading error: ${error.message}`));
      }
    });
  }

  /**
   * Enhanced Excel parsing
   */
  async parseExcel(filePath) {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Use header option and preserve formatting
      const data = XLSX.utils.sheet_to_json(worksheet, {
        raw: false,
        dateNF: 'yyyy-mm-dd',
        defval: '' // Default value for empty cells
      });
      
      if (data.length < 1) {
        throw new Error('Excel file contains no data rows');
      }

      return data;
    } catch (error) {
      throw new Error(`Excel parsing error: ${error.message}`);
    }
  }

  /**
   * Parse commodity advisory data (single sheet)
   */
  parseCommodityAdvisory(data) {
    return data.map((row, index) => {
      try {
        return this.processCommodityAdvisoryRecord(row, 'General Advisory', index);
      } catch (error) {
        console.warn(`Error parsing advisory record ${index}:`, error.message);
        return null;
      }
    }).filter(record => record !== null);
  }

  /**
   * Generic structure parser (fallback)
   */
  parseGenericStructure(data, filename) {
    console.log(`🔄 Using generic structure parser for: ${filename}`);
    
    return data.map((row, index) => ({
      id: `generic_${Date.now()}_${index}`,
      originalData: row,
      filename: filename,
      parsedAt: new Date().toISOString(),
      contentType: 'unknown'
    }));
  }

  /**
   * Parse crop calendar data
   */
  parseCropCalendar(data) {
    return data.map((row, index) => ({
      id: `crop_${Date.now()}_${index}`,
      district: this.cleanString(row.District || row.district || ''),
      crop: this.cleanString(row.Crop || row.crop || ''),
      plantingStart: this.parseMonth(row.PlantingStart || row['Planting Start'] || ''),
      plantingEnd: this.parseMonth(row.PlantingEnd || row['Planting End'] || ''),
      harvestStart: this.parseMonth(row.HarvestStart || row['Harvest Start'] || ''),
      harvestEnd: this.parseMonth(row.HarvestEnd || row['Harvest End'] || ''),
      season: this.cleanString(row.Season || row.season || 'Major'),
      year: parseInt(row.Year || row.year || new Date().getFullYear()),
      variety: this.cleanString(row.Variety || row.variety || ''),
      notes: this.cleanString(row.Notes || row.notes || ''),
      createdAt: new Date().toISOString(),
      contentType: 'crop_calendar'
    }));
  }

  /**
   * Parse production calendar data
   */
  parseProductionCalendar(data) {
    return data.map((row, index) => ({
      id: `production_${Date.now()}_${index}`,
      district: this.cleanString(row.District || row.district || ''),
      month: this.cleanString(row.Month || row.month || ''),
      crop: this.cleanString(row.Crop || row.crop || ''),
      activity: this.cleanString(row.Activity || row.activity || ''),
      tools: this.cleanString(row.Tools || row.tools || ''),
      duration: this.cleanString(row.Duration || row.duration || ''),
      priority: this.cleanString(row.Priority || row.priority || 'Medium'),
      createdAt: new Date().toISOString(),
      contentType: 'production_calendar'
    }));
  }

  /**
   * Parse agromet advisory data
   */
  parseAgrometAdvisory(data) {
    return data.map((row, index) => ({
      id: `agromet_${Date.now()}_${index}`,
      district: this.cleanString(row.District || row.district || ''),
      crop: this.cleanString(row.Crop || row.crop || ''),
      advisory: this.cleanString(row.Advisory || row.advisory || ''),
      weatherCondition: this.cleanString(row.WeatherCondition || row['Weather Condition'] || ''),
      temperature: this.cleanString(row.Temperature || row.temperature || ''),
      rainfall: this.cleanString(row.Rainfall || row.rainfall || ''),
      priority: this.cleanString(row.Priority || row.priority || 'Medium'),
      validFrom: this.parseDate(row.ValidFrom || row['Valid From'] || ''),
      validTo: this.parseDate(row.ValidTo || row['Valid To'] || ''),
      createdAt: new Date().toISOString(),
      contentType: 'agromet_advisory'
    }));
  }

  /**
   * Parse poultry calendar data
   */
  parsePoultryCalendar(data) {
    return data.map((row, index) => ({
      id: `poultry_${Date.now()}_${index}`,
      district: this.cleanString(row.District || row.district || ''),
      poultryType: this.cleanString(row.PoultryType || row['Poultry Type'] || 'Broiler'),
      weekRange: this.cleanString(row.WeekRange || row['Week Range'] || ''),
      activity: this.cleanString(row.Activity || row.activity || ''),
      advisory: this.cleanString(row.Advisory || row.advisory || ''),
      priority: this.cleanString(row.Priority || row.priority || 'Medium'),
      season: this.cleanString(row.Season || row.season || ''),
      year: parseInt(row.Year || row.year || new Date().getFullYear()),
      createdAt: new Date().toISOString(),
      contentType: 'poultry_calendar'
    }));
  }

  /**
   * Helper methods
   */
  cleanString(value) {
    if (value === null || value === undefined) return '';
    return value.toString().trim();
  }

  parseMonth(value) {
    if (!value) return '';
    const str = value.toString().toLowerCase().trim();
    const months = ['january', 'february', 'march', 'april', 'may', 'june',
                   'july', 'august', 'september', 'october', 'november', 'december'];
    
    for (const month of months) {
      if (str.includes(month)) {
        return month.charAt(0).toUpperCase() + month.slice(1);
      }
    }
    return str;
  }

  parseDate(value) {
    if (!value) return null;
    try {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
    } catch (error) {
      return null;
    }
  }
}

export default new AgriculturalDataParserV2();