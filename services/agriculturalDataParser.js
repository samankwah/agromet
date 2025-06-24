import XLSX from 'xlsx';
import Papa from 'papaparse';
import moment from 'moment';
import fs from 'fs';

/**
 * Agricultural Data Parser Service
 * Handles parsing of Excel/CSV files containing:
 * - Crop Calendars
 * - Production Calendars  
 * - Agromet Advisory data
 */

class AgriculturalDataParser {
  constructor() {
    // Ghana districts for validation
    this.ghanaDistricts = [
      'Accra Metropolitan', 'Tema Metropolitan', 'Kumasi Metropolitan',
      'Tamale Metropolitan', 'Sekondi-Takoradi Metropolitan', 'Cape Coast Metropolitan',
      'Obuasi Municipal', 'Sunyani Municipal', 'Ho Municipal', 'Koforidua Municipal',
      'Wa Municipal', 'Bolgatanga Municipal', 'Techiman Municipal', 'Nkoranza Municipal',
      'Ejisu Municipal', 'Offinso Municipal', 'Asante Akim Central Municipal',
      'Asante Akim North Municipal', 'Asante Akim South Municipal', 'Atwima Nwabiagya Municipal',
      // Add more districts as needed
    ];

    // Crop types for validation
    this.cropTypes = [
      'Maize', 'Rice', 'Cassava', 'Yam', 'Plantain', 'Cocoa', 'Coffee',
      'Tomato', 'Pepper', 'Onion', 'Okra', 'Garden Egg', 'Cabbage',
      'Lettuce', 'Carrot', 'Beans', 'Groundnut', 'Soybean', 'Cowpea',
      'Oil Palm', 'Coconut', 'Shea', 'Mango', 'Orange', 'Pineapple'
    ];

    // Months for validation
    this.months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
  }

  /**
   * Parse uploaded file based on content type
   */
  async parseFile(filePath, fileType, originalName) {
    try {
      // Validate inputs
      if (!filePath || !fileType || !originalName) {
        throw new Error('Missing required parameters: filePath, fileType, or originalName');
      }
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      
      console.log(`📊 Parsing agricultural data file: ${originalName}`);
      
      let data;
      let isMultiSheet = false;
      
      if (fileType === 'csv') {
        data = await this.parseCSV(filePath);
      } else if (fileType === 'excel') {
        // Check if this might be a multi-sheet commodity advisory
        const potentialContentType = this.determineContentType(originalName, []);
        
        if (potentialContentType === 'commodity_advisory') {
          isMultiSheet = true;
          data = await this.parseMultiSheetExcel(filePath);
        } else {
          data = await this.parseExcel(filePath);
        }
      } else {
        throw new Error('Unsupported file type. Please use CSV or Excel files.');
      }

      if (!data || (Array.isArray(data) && data.length === 0)) {
        throw new Error('No data found in file or file is empty');
      }

      // Determine content type based on filename and headers
      const contentType = this.determineContentType(originalName, isMultiSheet ? [] : data);
      
      // Parse based on content type
      let parsedData;
      try {
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
            throw new Error('Could not determine data type. Please ensure your file follows the expected format.');
        }
      } catch (parseError) {
        throw new Error(`Data parsing failed for ${contentType}: ${parseError.message}`);
      }

      if (!parsedData || parsedData.length === 0) {
        throw new Error('No valid records found after parsing');
      }

      console.log(`✅ Successfully parsed ${contentType} data with ${parsedData.length} records`);
      
      return {
        contentType,
        data: parsedData,
        metadata: {
          originalName,
          recordCount: parsedData.length,
          parsedAt: new Date().toISOString(),
          dataQuality: this.validateDataQuality(parsedData, contentType),
          isMultiSheet: isMultiSheet
        }
      };
    } catch (error) {
      console.error('❌ Error parsing agricultural data:', error);
      throw error;
    }
  }

  /**
   * Parse CSV file
   */
  async parseCSV(filePath) {
    return new Promise((resolve, reject) => {
      try {
        const csvData = fs.readFileSync(filePath, 'utf8');
        
        Papa.parse(csvData, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors.length > 0) {
              reject(new Error(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`));
            } else {
              resolve(results.data);
            }
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
   * Parse Excel file
   */
  async parseExcel(filePath) {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0]; // Use first sheet
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Convert to objects with headers
      if (data.length < 2) {
        throw new Error('Excel file must have at least 2 rows (headers + data)');
      }
      
      const headers = data[0];
      const rows = data.slice(1);
      
      return rows.map(row => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] || '';
        });
        return obj;
      });
    } catch (error) {
      throw new Error(`Excel parsing error: ${error.message}`);
    }
  }

  /**
   * Parse Multi-Sheet Excel file for commodity advisories
   */
  async parseMultiSheetExcel(filePath) {
    try {
      const workbook = XLSX.readFile(filePath);
      const allSheetData = {};
      
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Filter out empty rows
        const filteredData = jsonData.filter(row => {
          return Object.values(row).some(value => value && value.toString().trim() !== '');
        });
        
        if (filteredData.length > 0) {
          allSheetData[sheetName] = filteredData;
        }
      });
      
      return allSheetData;
    } catch (error) {
      throw new Error(`Multi-sheet Excel parsing error: ${error.message}`);
    }
  }

  /**
   * Determine content type based on filename and data structure
   */
  determineContentType(filename, data) {
    const name = filename.toLowerCase();
    
    if (name.includes('crop') && (name.includes('calendar') || name.includes('schedule'))) {
      return 'crop_calendar';
    }
    
    if (name.includes('production') && name.includes('calendar')) {
      return 'production_calendar';
    }
    
    if (name.includes('poultry') && name.includes('calendar')) {
      return 'poultry_calendar';
    }

    // Check for commodity advisory files (multi-sheet Excel files) - Check this BEFORE general advisory
    if (name.includes('advisory') && (name.includes('rice') || name.includes('maize') || 
        name.includes('tomato') || name.includes('layers') || name.includes('broilers') || 
        name.includes('soyabean') || name.includes('sorghum'))) {
      return 'commodity_advisory';
    }
    
    if (name.includes('agromet') || name.includes('advisory') || name.includes('weather')) {
      return 'agromet_advisory';
    }

    // Analyze headers to determine type
    if (data.length > 0) {
      const headers = Object.keys(data[0]).join(' ').toLowerCase();
      
      if (headers.includes('crop') && (headers.includes('plant') || headers.includes('harvest'))) {
        return 'crop_calendar';
      }
      
      if (headers.includes('production') || headers.includes('activity')) {
        return 'production_calendar';
      }
      
      if (headers.includes('weather') || headers.includes('advisory') || headers.includes('recommendation')) {
        return 'agromet_advisory';
      }
      
      if (headers.includes('poultry') || headers.includes('bird') || headers.includes('layer') || headers.includes('broiler')) {
        return 'poultry_calendar';
      }

      // Check for commodity advisory structure
      if (headers.includes('[zone]') && headers.includes('[region]') && headers.includes('[district]') && headers.includes('[crop]')) {
        return 'commodity_advisory';
      }
    }

    return 'unknown';
  }

  /**
   * Parse Crop Calendar data
   * Expected format: District, Crop, PlantingStart, PlantingEnd, HarvestStart, HarvestEnd, Season, Year
   */
  parseCropCalendar(data) {
    return data.map((row, index) => {
      try {
        const record = {
          id: `crop_${Date.now()}_${index}`,
          district: this.cleanString(row.District || row.district || ''),
          crop: this.cleanString(row.Crop || row.crop || ''),
          plantingStart: this.parseMonth(row.PlantingStart || row['Planting Start'] || row.planting_start || ''),
          plantingEnd: this.parseMonth(row.PlantingEnd || row['Planting End'] || row.planting_end || ''),
          harvestStart: this.parseMonth(row.HarvestStart || row['Harvest Start'] || row.harvest_start || ''),
          harvestEnd: this.parseMonth(row.HarvestEnd || row['Harvest End'] || row.harvest_end || ''),
          season: this.cleanString(row.Season || row.season || 'Major'),
          year: parseInt(row.Year || row.year || new Date().getFullYear()),
          variety: this.cleanString(row.Variety || row.variety || ''),
          notes: this.cleanString(row.Notes || row.notes || row.Remarks || row.remarks || ''),
          createdAt: new Date().toISOString()
        };

        // Validate required fields
        if (!record.district || !record.crop) {
          throw new Error(`Row ${index + 1}: District and Crop are required`);
        }

        return record;
      } catch (error) {
        throw new Error(`Error parsing crop calendar row ${index + 1}: ${error.message}`);
      }
    }).filter(record => record.district && record.crop);
  }

  /**
   * Parse Production Calendar data
   * Expected format: District, Activity, Month, Week, Crop, Description, Tools, Season
   */
  parseProductionCalendar(data) {
    return data.map((row, index) => {
      try {
        const record = {
          id: `prod_${Date.now()}_${index}`,
          district: this.cleanString(row.District || row.district || ''),
          activity: this.cleanString(row.Activity || row.activity || ''),
          month: this.parseMonth(row.Month || row.month || ''),
          week: parseInt(row.Week || row.week || 0),
          crop: this.cleanString(row.Crop || row.crop || ''),
          description: this.cleanString(row.Description || row.description || ''),
          tools: this.cleanString(row.Tools || row.tools || row.Equipment || row.equipment || ''),
          season: this.cleanString(row.Season || row.season || 'All'),
          priority: this.cleanString(row.Priority || row.priority || 'Medium'),
          duration: this.cleanString(row.Duration || row.duration || ''),
          createdAt: new Date().toISOString()
        };

        if (!record.district || !record.activity) {
          throw new Error(`Row ${index + 1}: District and Activity are required`);
        }

        return record;
      } catch (error) {
        throw new Error(`Error parsing production calendar row ${index + 1}: ${error.message}`);
      }
    }).filter(record => record.district && record.activity);
  }

  /**
   * Parse Agromet Advisory data
   * Expected format: District, Date, WeatherCondition, Advisory, Crop, Action, Priority
   */
  parseAgrometAdvisory(data) {
    return data.map((row, index) => {
      try {
        const record = {
          id: `advisory_${Date.now()}_${index}`,
          district: this.cleanString(row.District || row.district || ''),
          date: this.parseDate(row.Date || row.date || row.IssueDate || row.issue_date || ''),
          weatherCondition: this.cleanString(row.WeatherCondition || row['Weather Condition'] || row.weather_condition || ''),
          advisory: this.cleanString(row.Advisory || row.advisory || row.Recommendation || row.recommendation || ''),
          crop: this.cleanString(row.Crop || row.crop || 'General'),
          action: this.cleanString(row.Action || row.action || ''),
          priority: this.cleanString(row.Priority || row.priority || 'Medium'),
          validFrom: this.parseDate(row.ValidFrom || row['Valid From'] || row.valid_from || ''),
          validTo: this.parseDate(row.ValidTo || row['Valid To'] || row.valid_to || ''),
          temperature: this.cleanString(row.Temperature || row.temperature || ''),
          rainfall: this.cleanString(row.Rainfall || row.rainfall || ''),
          humidity: this.cleanString(row.Humidity || row.humidity || ''),
          category: this.cleanString(row.Category || row.category || 'General'),
          createdAt: new Date().toISOString()
        };

        if (!record.district || !record.advisory) {
          throw new Error(`Row ${index + 1}: District and Advisory are required`);
        }

        return record;
      } catch (error) {
        throw new Error(`Error parsing agromet advisory row ${index + 1}: ${error.message}`);
      }
    }).filter(record => record.district && record.advisory);
  }

  /**
   * Parse Poultry Calendar data
   * Expected format: District, PoultryType, Activity, StartWeek, EndWeek, Season, Year, Advisory
   */
  parsePoultryCalendar(data) {
    return data.map((row, index) => {
      try {
        const record = {
          id: `poultry_${Date.now()}_${index}`,
          district: this.cleanString(row.District || row.district || ''),
          poultryType: this.cleanString(row.PoultryType || row['Poultry Type'] || row.poultry_type || row.Type || row.type || 'Layers'),
          activity: this.cleanString(row.Activity || row.activity || ''),
          startWeek: parseInt(row.StartWeek || row['Start Week'] || row.start_week || row.Start || row.start || 1),
          endWeek: parseInt(row.EndWeek || row['End Week'] || row.end_week || row.End || row.end || 1),
          season: this.cleanString(row.Season || row.season || 'All'),
          year: parseInt(row.Year || row.year || new Date().getFullYear()),
          advisory: this.cleanString(row.Advisory || row.advisory || row.Description || row.description || ''),
          color: this.cleanString(row.Color || row.color || 'bg-blue-500'),
          priority: this.cleanString(row.Priority || row.priority || 'Medium'),
          duration: this.cleanString(row.Duration || row.duration || ''),
          notes: this.cleanString(row.Notes || row.notes || row.Remarks || row.remarks || ''),
          createdAt: new Date().toISOString()
        };

        // Validate required fields
        if (!record.district || !record.activity) {
          throw new Error(`Row ${index + 1}: District and Activity are required`);
        }

        // Ensure startWeek and endWeek are valid
        if (record.startWeek < 1 || record.startWeek > 52) {
          record.startWeek = 1;
        }
        if (record.endWeek < 1 || record.endWeek > 52) {
          record.endWeek = record.startWeek;
        }
        if (record.startWeek > record.endWeek) {
          // Swap them if start is greater than end
          [record.startWeek, record.endWeek] = [record.endWeek, record.startWeek];
        }

        return record;
      } catch (error) {
        throw new Error(`Error parsing poultry calendar row ${index + 1}: ${error.message}`);
      }
    }).filter(record => record.district && record.activity);
  }

  /**
   * Parse Commodity Advisory data (multi-sheet format)
   * Expected format: Multi-sheet Excel with production stages
   */
  parseCommodityAdvisory(sheetsData) {
    const allRecords = [];
    let recordIndex = 0;

    Object.keys(sheetsData).forEach(sheetName => {
      const sheetRecords = sheetsData[sheetName];
      
      sheetRecords.forEach((row, rowIndex) => {
        try {
          // Extract commodity code and crop name
          const cropField = row['[CROP]'] || '';
          const commodityCode = cropField.includes('/') ? cropField.split('/')[0] : '';
          const cropName = cropField.includes('/') ? cropField.split('/')[1] : cropField;

          // Extract region and district codes
          const regionField = row['[REGION]'] || '';
          const districtField = row['[DISTRICT]'] || '';
          
          const regionCode = regionField.includes('/') ? regionField.split('/')[0] : '';
          const regionName = regionField.includes('/') ? regionField.split('/')[1] : regionField;
          
          const districtCode = districtField.includes('/') ? districtField.split('/')[0] : '';
          const districtName = districtField.includes('/') ? districtField.split('/')[1] : districtField;

          // Parse week range
          const weekField = this.cleanString(row['[WEEK]'] || '');
          const weekRange = this.parseWeekRange(weekField);

          // Parse dates
          const startDate = this.parseExcelDate(row['[START DATE]']);
          const endDate = this.parseExcelDate(row['[END DATE]']);

          const record = {
            id: `commodity_advisory_${Date.now()}_${recordIndex++}`,
            commodityCode: this.cleanString(commodityCode),
            crop: this.cleanString(cropName),
            regionCode: this.cleanString(regionCode),
            region: this.cleanString(regionName),
            districtCode: this.cleanString(districtCode),
            district: this.cleanString(districtName),
            zone: this.cleanString(row['[ZONE]'] || ''),
            stage: this.cleanString(sheetName),
            activity: this.cleanString(sheetName),
            monthYear: this.cleanString(row['[MONTH/YEAR]'] || ''),
            week: weekField,
            startWeek: weekRange.start,
            endWeek: weekRange.end,
            startDate: startDate,
            endDate: endDate,
            advisory: `${sheetName} activities for ${cropName} in ${districtName}`,
            priority: 'Medium',
            category: 'Production Stage',
            createdAt: new Date().toISOString()
          };

          // Only include records with valid district and crop
          if (record.district && record.crop) {
            allRecords.push(record);
          }
        } catch (error) {
          console.warn(`Warning: Error parsing ${sheetName} row ${rowIndex + 1}: ${error.message}`);
        }
      });
    });

    return allRecords;
  }

  /**
   * Utility functions
   */
  cleanString(str) {
    return typeof str === 'string' ? str.trim() : String(str || '').trim();
  }

  parseMonth(monthStr) {
    if (!monthStr) return '';
    
    const cleaned = this.cleanString(monthStr);
    if (this.months.includes(cleaned)) {
      return cleaned;
    }
    
    // Try to parse as number (1-12)
    const monthNum = parseInt(cleaned);
    if (monthNum >= 1 && monthNum <= 12) {
      return this.months[monthNum - 1];
    }
    
    // Try to find partial match
    const match = this.months.find(month => 
      month.toLowerCase().includes(cleaned.toLowerCase()) ||
      cleaned.toLowerCase().includes(month.toLowerCase())
    );
    
    return match || cleaned;
  }

  parseDate(dateStr) {
    if (!dateStr) return '';
    
    const parsed = moment(dateStr);
    if (parsed.isValid()) {
      return parsed.format('YYYY-MM-DD');
    }
    
    return this.cleanString(dateStr);
  }

  /**
   * Parse Excel date (Excel serial number to date)
   */
  parseExcelDate(excelDate) {
    if (!excelDate || isNaN(excelDate)) return '';
    
    try {
      // Excel date serial numbers start from 1900-01-01
      const excelEpoch = new Date(1900, 0, 1);
      const date = new Date(excelEpoch.getTime() + (excelDate - 1) * 24 * 60 * 60 * 1000);
      return moment(date).format('YYYY-MM-DD');
    } catch (error) {
      return '';
    }
  }

  /**
   * Parse week range (e.g., "1 - 7", "8 - 10")
   */
  parseWeekRange(weekStr) {
    if (!weekStr) return { start: 1, end: 1 };
    
    const cleaned = this.cleanString(weekStr);
    
    // Handle ranges like "1 - 7", "8-10", "21 - 24"
    if (cleaned.includes('-')) {
      const parts = cleaned.split('-').map(part => parseInt(part.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return {
          start: Math.max(1, Math.min(52, parts[0])),
          end: Math.max(1, Math.min(52, parts[1]))
        };
      }
    }
    
    // Handle single week numbers
    const singleWeek = parseInt(cleaned);
    if (!isNaN(singleWeek)) {
      const week = Math.max(1, Math.min(52, singleWeek));
      return { start: week, end: week };
    }
    
    return { start: 1, end: 1 };
  }

  /**
   * Validate data quality
   */
  validateDataQuality(data, contentType) {
    const total = data.length;
    let validRecords = 0;
    let warnings = [];

    data.forEach((record, index) => {
      let isValid = true;

      switch (contentType) {
        case 'crop_calendar':
          if (!record.district || !record.crop) isValid = false;
          if (!this.ghanaDistricts.some(d => d.toLowerCase().includes(record.district.toLowerCase()))) {
            warnings.push(`Row ${index + 1}: District "${record.district}" not recognized`);
          }
          break;
        
        case 'production_calendar':
          if (!record.district || !record.activity) isValid = false;
          break;
        
        case 'agromet_advisory':
          if (!record.district || !record.advisory) isValid = false;
          break;
        
        case 'poultry_calendar':
          if (!record.district || !record.activity) isValid = false;
          if (record.startWeek < 1 || record.startWeek > 52 || record.endWeek < 1 || record.endWeek > 52) {
            warnings.push(`Row ${index + 1}: Invalid week range (${record.startWeek}-${record.endWeek})`);
          }
          break;
        
        case 'commodity_advisory':
          if (!record.district || !record.crop || !record.stage) isValid = false;
          if (!record.commodityCode) {
            warnings.push(`Row ${index + 1}: Missing commodity code`);
          }
          if (record.startWeek < 1 || record.startWeek > 52 || record.endWeek < 1 || record.endWeek > 52) {
            warnings.push(`Row ${index + 1}: Invalid week range (${record.startWeek}-${record.endWeek})`);
          }
          break;
      }

      if (isValid) validRecords++;
    });

    return {
      total,
      valid: validRecords,
      invalid: total - validRecords,
      quality: Math.round((validRecords / total) * 100),
      warnings
    };
  }
}

export default new AgriculturalDataParser();