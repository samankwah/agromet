/**
 * Weekly Advisory Parser
 * Parses multi-sheet Excel files containing weekly agricultural advisories
 * Each sheet represents one activity stage with weather forecasts and recommendations
 */

import XLSX from 'xlsx';

class WeeklyAdvisoryParser {
  constructor() {
    this.weatherParameters = [
      'rainfall',
      'temperature',
      'humidity',
      'soil_moisture',
      'soil_temperature',
      'sunshine',
      'sunrise',
      'sunset',
      'evapotranspiration'
    ];
  }

  /**
   * Generate unique advisory ID
   * Format: REGION_DISTRICT_CROP_YEAR_WXX_ACTIVITY
   */
  generateAdvisoryId(region, district, crop, year, weekNumber, activityStage) {
    const cleanStr = (str) => String(str || '')
      .toUpperCase()
      .replace(/\s+/g, '_')
      .replace(/[^A-Z0-9_]/g, '');

    return [
      cleanStr(region),
      cleanStr(district),
      cleanStr(crop),
      year,
      `W${weekNumber}`,
      cleanStr(activityStage)
    ].join('_');
  }

  /**
   * Parse Excel file and extract weekly advisories
   */
  async parseExcel(filePath) {
    try {
      console.log('📊 Parsing Weekly Advisory Excel File:', filePath);

      // Read workbook
      const workbook = XLSX.readFile(filePath, {
        cellStyles: true,
        sheetStubs: true,
        raw: false
      });

      const advisories = [];

      // Process each sheet (each sheet = one activity stage)
      for (const sheetName of workbook.SheetNames) {
        console.log(`\n📄 Processing Sheet: "${sheetName}"`);

        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: '',
          raw: false
        });

        // Parse the sheet
        const advisory = this.parseSheet(sheetName, data, sheet);

        if (advisory) {
          advisories.push(advisory);
          console.log(`✅ Successfully parsed: ${advisory.activity_stage}`);
        } else {
          console.warn(`⚠️  Failed to parse sheet: ${sheetName}`);
        }
      }

      console.log(`\n🎉 Total Advisories Parsed: ${advisories.length}`);
      return {
        success: true,
        advisories,
        count: advisories.length
      };

    } catch (error) {
      console.error('❌ Error parsing weekly advisory Excel:', error);
      return {
        success: false,
        error: error.message,
        advisories: []
      };
    }
  }

  /**
   * Parse individual sheet
   */
  parseSheet(sheetName, data, sheet) {
    try {
      const advisory = {
        activity_stage: sheetName.trim()
      };

      // Find and extract header metadata
      const metadata = this.extractMetadata(data);
      Object.assign(advisory, metadata);

      // Find and extract weather forecast table
      const weatherData = this.extractWeatherForecastTable(data);
      Object.assign(advisory, weatherData);

      // Extract advisory sections
      const advisoryData = this.extractAdvisorySections(data);
      Object.assign(advisory, advisoryData);

      // Extract SMS text
      advisory.sms_text = this.extractSMSText(data);

      // Extract overall summary
      advisory.overall_summary = this.extractOverallSummary(data);

      // Generate advisory ID
      if (advisory.region && advisory.district && advisory.crop_type && advisory.year) {
        advisory.advisory_id = this.generateAdvisoryId(
          advisory.region,
          advisory.district,
          advisory.crop_type,
          advisory.year,
          advisory.week_number || 1,
          advisory.activity_stage
        );
      }

      return advisory;
    } catch (error) {
      console.error(`Error parsing sheet "${sheetName}":`, error);
      return null;
    }
  }

  /**
   * Extract metadata from header section
   */
  extractMetadata(data) {
    const metadata = {};
    const keywords = {
      zone: ['zone'],
      region: ['region'],
      district: ['district'],
      crop_type: ['commodity', 'crop'],
      month_year: ['month/year', 'month', 'period'],
      weeks_range: ['weeks', 'week'],
      start_date: ['start date', 'start_date', 'from'],
      end_date: ['end date', 'end_date', 'to']
    };

    // Scan first 15 rows for metadata
    for (let rowIndex = 0; rowIndex < Math.min(15, data.length); rowIndex++) {
      const row = data[rowIndex];
      if (!Array.isArray(row)) continue;

      for (let colIndex = 0; colIndex < row.length - 1; colIndex++) {
        const cell = String(row[colIndex] || '').toLowerCase().trim();
        const valueCell = row[colIndex + 1];

        // Check each keyword
        for (const [field, patterns] of Object.entries(keywords)) {
          if (patterns.some(pattern => cell.includes(pattern)) && valueCell) {
            metadata[field] = String(valueCell).trim();

            // Extract year and week number from metadata
            if (field === 'month_year') {
              const yearMatch = valueCell.match(/20\d{2}/);
              if (yearMatch) metadata.year = parseInt(yearMatch[0]);
            }

            if (field === 'weeks_range') {
              const weekMatch = valueCell.match(/(\d+)\s*-\s*(\d+)/);
              if (weekMatch) {
                metadata.week_number = parseInt(weekMatch[1]);
              }
            }

            if (field === 'start_date' || field === 'end_date') {
              // Parse date
              metadata[field] = this.parseDate(valueCell);
            }
          }
        }
      }
    }

    return metadata;
  }

  /**
   * Extract weather forecast table (9 parameters × 2 rows)
   */
  extractWeatherForecastTable(data) {
    const weatherData = {};
    const parameterMapping = {
      'rainfall': ['rainfall', 'rain'],
      'temperature': ['temperature', 'temp'],
      'humidity': ['humidity'],
      'soil moisture': ['soil moisture', 'soil_moisture'],
      'soil temperature': ['soil temperature', 'soil_temperature', 'soil temp'],
      'sunshine': ['sunshine', 'sunshine intensity'],
      'sunrise': ['sunrise'],
      'sunset': ['sunset'],
      'evapotranspiration': ['evapotranspiration', 'evapo', 'evaporation']
    };

    // Find "Detailed Forecast" or weather table header
    let forecastStartRow = -1;
    for (let i = 0; i < Math.min(25, data.length); i++) {
      const row = data[i];
      if (!Array.isArray(row)) continue;

      const rowText = row.join(' ').toLowerCase();
      if (rowText.includes('detailed forecast') || rowText.includes('forecast') && rowText.includes('implication')) {
        forecastStartRow = i;
        break;
      }
    }

    if (forecastStartRow === -1) return weatherData;

    // Extract parameter headers
    const headerRow = data[forecastStartRow + 1] || [];
    const forecastRow = data[forecastStartRow + 2] || [];
    const implicationRow = data[forecastStartRow + 3] || [];

    // Map each parameter
    headerRow.forEach((header, colIndex) => {
      if (!header) return;
      const headerLower = String(header).toLowerCase().trim();

      for (const [param, patterns] of Object.entries(parameterMapping)) {
        if (patterns.some(pattern => headerLower.includes(pattern))) {
          const paramKey = param.replace(' ', '_');
          weatherData[`${paramKey}_forecast`] = String(forecastRow[colIndex] || '').trim();
          weatherData[`${paramKey}_implication`] = String(implicationRow[colIndex] || '').trim();
          break;
        }
      }
    });

    return weatherData;
  }

  /**
   * Extract advisory sections for each weather parameter
   */
  extractAdvisorySections(data) {
    const advisoryData = {};

    // Find "Advisory" section
    let advisoryStartRow = -1;
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!Array.isArray(row)) continue;

      const firstCell = String(row[0] || '').toLowerCase().trim();
      if (firstCell.includes('advisory') && !firstCell.includes('overall')) {
        advisoryStartRow = i;
        break;
      }
    }

    if (advisoryStartRow === -1) return advisoryData;

    // Extract advisory text for each parameter
    // Look for headers like "Rainfall Advisory", "Temperature Advisory", etc.
    for (let i = advisoryStartRow; i < Math.min(advisoryStartRow + 50, data.length); i++) {
      const row = data[i];
      if (!Array.isArray(row)) continue;

      row.forEach((cell, colIndex) => {
        if (!cell) return;
        const cellText = String(cell).toLowerCase().trim();

        // Match pattern: "ParameterName Advisory"
        const advPattern = /(rainfall|temperature|humidity|soil\s*moisture|soil\s*temperature|sunshine|sunrise|sunset|evaporation)\s*advisory/i;
        const match = cell.match(advPattern);

        if (match) {
          const paramName = match[1].toLowerCase().replace(/\s+/g, '_');

          // Get advisory text from next row or adjacent cell
          const advisoryText = data[i + 1]?.[colIndex] || row[colIndex + 1] || '';
          advisoryData[`${paramName}_advisory`] = String(advisoryText).trim();
        }
      });
    }

    return advisoryData;
  }

  /**
   * Extract SMS text
   */
  extractSMSText(data) {
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!Array.isArray(row)) continue;

      const firstCell = String(row[0] || '').toLowerCase().trim();
      if (firstCell.includes('sms') || firstCell.includes('text')) {
        // SMS text is usually in the next row or adjacent cell
        const smsText = data[i + 1]?.[0] || row[1] || '';
        return String(smsText).trim();
      }
    }
    return '';
  }

  /**
   * Extract overall summary
   */
  extractOverallSummary(data) {
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!Array.isArray(row)) continue;

      const firstCell = String(row[0] || '').toLowerCase().trim();
      if (firstCell.includes('forecast and advisory') ||
          firstCell.includes('overall summary') ||
          firstCell.includes('summary weather outlook')) {
        // Summary text is usually in the next row or adjacent cell
        const summaryText = data[i + 1]?.[0] || row[1] || '';
        return String(summaryText).trim();
      }
    }
    return '';
  }

  /**
   * Parse date string to ISO format
   */
  parseDate(dateStr) {
    if (!dateStr) return null;

    try {
      // Try various date formats
      const str = String(dateStr).trim();

      // Format: DD/MM/YYYY
      const match1 = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (match1) {
        return `${match1[3]}-${match1[2].padStart(2, '0')}-${match1[1].padStart(2, '0')}`;
      }

      // Format: YYYY-MM-DD
      const match2 = str.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
      if (match2) {
        return `${match2[1]}-${match2[2].padStart(2, '0')}-${match2[3].padStart(2, '0')}`;
      }

      return null;
    } catch (error) {
      return null;
    }
  }
}

// Export singleton instance
export default new WeeklyAdvisoryParser();
