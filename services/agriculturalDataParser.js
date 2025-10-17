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
   * Enhanced with comprehensive color extraction and debugging
   */
  async parseFile(filePath, fileType, originalName) {
    try {
      // Initialize color debug counter
      this._colorDebugCount = 0;

      // Validate inputs
      if (!filePath || !fileType || !originalName) {
        throw new Error('Missing required parameters: filePath, fileType, or originalName');
      }

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      console.log(`\n${'='.repeat(80)}`);
      console.log(`📊 PARSING AGRICULTURAL DATA FILE: ${originalName}`);
      console.log(`${'='.repeat(80)}`);
      console.log(`📁 File Path: ${filePath}`);
      console.log(`📝 File Type: ${fileType}`);
      console.log(`🎨 Enhanced Color Extraction: ENABLED`);
      console.log(`${'='.repeat(80)}\n`);

      let data;
      let isMultiSheet = false;

      if (fileType === 'csv') {
        console.log('📄 Parsing CSV file...');
        data = await this.parseCSV(filePath);
      } else if (fileType === 'excel') {
        // Check if this might be a multi-sheet commodity advisory
        const potentialContentType = this.determineContentType(originalName, []);

        if (potentialContentType === 'commodity_advisory') {
          console.log('📑 Parsing Multi-Sheet Excel (Commodity Advisory)...');
          isMultiSheet = true;
          data = await this.parseMultiSheetExcel(filePath);
        } else {
          console.log('📗 Parsing Single-Sheet Excel...');
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

      // Calculate color statistics
      const colorStats = this.calculateColorStatistics(parsedData, contentType);

      console.log(`\n✅ Successfully parsed ${contentType} data with ${parsedData.length} records`);
      console.log(`\n${'='.repeat(80)}`);
      console.log('📊 COLOR EXTRACTION SUMMARY');
      console.log(`${'='.repeat(80)}`);
      console.log(`🎨 Total records with colors: ${colorStats.recordsWithColor}/${parsedData.length} (${colorStats.colorPercentage}%)`);
      console.log(`🌈 Unique colors found: ${colorStats.uniqueColors.length}`);
      if (colorStats.uniqueColors.length > 0) {
        console.log(`🎨 Color palette: ${colorStats.uniqueColors.slice(0, 10).join(', ')}${colorStats.uniqueColors.length > 10 ? '...' : ''}`);
      }
      console.log(`${'='.repeat(80)}\n`);

      return {
        contentType,
        data: parsedData,
        metadata: {
          originalName,
          recordCount: parsedData.length,
          parsedAt: new Date().toISOString(),
          dataQuality: this.validateDataQuality(parsedData, contentType),
          isMultiSheet: isMultiSheet,
          colorStats: colorStats
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
   * Parse Excel file WITH CELL STYLES AND COLORS
   * FIXED: Correct row index calculation to match actual Excel rows
   */
  async parseExcel(filePath) {
    try {
      // Enable cellStyles to extract colors and formatting
      const workbook = XLSX.readFile(filePath, {
        cellStyles: true,
        sheetStubs: true,
        raw: false
      });
      const sheetName = workbook.SheetNames[0]; // Use first sheet
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false });

      // Convert to objects with headers
      if (data.length < 2) {
        throw new Error('Excel file must have at least 2 rows (headers + data)');
      }

      const headers = data[0];
      const rows = data.slice(1);

      console.log(`📋 Excel Structure: ${data.length} total rows (1 header + ${rows.length} data rows)`);
      console.log(`📊 Headers (Row 0): ${headers.slice(0, 10).join(', ')}${headers.length > 10 ? '...' : ''}`);
      console.log(`🔍 Processing data rows 1-${rows.length} from Excel...`);

      // Store worksheet reference for color extraction
      this.currentWorksheet = worksheet;
      this.currentHeaders = headers;

      // Debug counter for cell extraction
      let cellDebugCount = 0;

      return rows.map((row, rowIndex) => {
        const obj = {};

        // Excel row number (0-based headers at row 0, data starts at row 1)
        const excelRowNum = rowIndex + 1;

        // Detect if this row contains weeding activity (for enhanced debugging)
        let isWeedingRow = false;
        let weedingActivityName = '';

        headers.forEach((header, colIndex) => {
          const cellValue = row[colIndex] || '';
          obj[header] = cellValue;

          // Check if this is a weeding activity
          const headerLower = header.toLowerCase();
          const valueLower = String(cellValue).toLowerCase();
          if ((headerLower.includes('activity') || headerLower.includes('stage')) &&
              (valueLower.includes('weed') || valueLower.includes('pest'))) {
            isWeedingRow = true;
            weedingActivityName = cellValue;
          }

          // Extract cell color if available
          // CRITICAL: excelRowNum is already correct (rowIndex + 1)
          // Row 0 of data array → Row 1 in Excel (first data row)
          const cellAddress = XLSX.utils.encode_cell({ r: excelRowNum, c: colIndex });
          const cell = worksheet[cellAddress];
          const cellColor = this.extractCellColor(cell);

          // Debug: Log first 10 cell extractions to verify alignment
          if (cellDebugCount < 10 && (cellValue || cellColor)) {
            const cellInfo = {
              address: cellAddress,
              dataRow: rowIndex,
              excelRow: excelRowNum,
              column: colIndex,
              header: header,
              value: cellValue ? `"${String(cellValue).substring(0, 20)}"` : 'empty',
              color: cellColor || 'no color',
              hasCell: !!cell,
              hasStyle: !!(cell?.s)
            };
            console.log(`🔬 Cell ${cellAddress} (data[${rowIndex}][${colIndex}]): ${cellInfo.value} → ${cellColor || 'no color'}`);
            cellDebugCount++;
          }

          // ENHANCED WEEDING DEBUG: Log ALL cells for weeding rows
          if (isWeedingRow && colIndex > 0) {
            console.log(`🌿 WEEDING ROW "${weedingActivityName}" Cell[${colIndex}] ${cellAddress}: val="${String(cellValue).substring(0, 15)}", color=${cellColor || 'NONE'}`);

            // Ultra-detailed cell structure logging for weeding rows
            if (cell) {
              console.log(`   📊 Cell structure: hasStyle=${!!cell.s}, hasFill=${!!(cell.s?.fill)}, bgColor=${JSON.stringify(cell.s?.fill?.bgColor)}, fgColor=${JSON.stringify(cell.s?.fill?.fgColor)}`);
            } else {
              console.log(`   ❌ Cell object not found for ${cellAddress}`);
            }
          }

          // Store color metadata as special properties
          if (cellColor) {
            obj[`${header}_color`] = cellColor;
            obj[`${header}_background`] = cellColor;
          }

          // FALLBACK: If weeding row has no color, apply red by activity name pattern
          if (isWeedingRow && !cellColor && colIndex > 0) {
            const activityColor = this.getWeedingColorFallback(weedingActivityName);
            if (activityColor && !obj[`${header}_color`]) {
              console.log(`🎨 FALLBACK COLOR for "${weedingActivityName}" cell[${colIndex}]: ${activityColor}`);
              obj[`${header}_color`] = activityColor;
              obj[`${header}_background`] = activityColor;
            }
          }
        });

        // FINAL WEEDING ROW SUMMARY
        if (isWeedingRow) {
          const colorKeys = Object.keys(obj).filter(k => k.endsWith('_color'));
          console.log(`🌿 WEEDING ROW SUMMARY: "${weedingActivityName}" - Found ${colorKeys.length} colored cells`);
          if (colorKeys.length === 0) {
            console.log(`⚠️ WARNING: Weeding row "${weedingActivityName}" has NO colors detected! Applying fallback...`);
            // Apply fallback color to all timeline columns
            const fallbackColor = this.getWeedingColorFallback(weedingActivityName);
            headers.forEach((header, idx) => {
              if (idx > 1 && !obj[`${header}_color`]) { // Skip first 2 columns (S/N, Activity)
                obj[`${header}_color`] = fallbackColor;
                obj[`${header}_background`] = fallbackColor;
              }
            });
          }
        }

        return obj;
      });
    } catch (error) {
      throw new Error(`Excel parsing error: ${error.message}`);
    }
  }

  /**
   * Extract color from Excel cell (supports RGB, ARGB, indexed, and theme colors)
   * Enhanced with multi-method fallback matching frontend calendarPreviewParser
   * PRIORITY: Aggressive red detection for weeding activities
   */
  extractCellColor(cell) {
    if (!cell || !cell.s) return null;

    const style = cell.s;
    let backgroundColor = null;
    let colorSource = null;

    // METHOD 0: AGGRESSIVE RED DETECTION (for weeding/pest control activities)
    const redColor = this.extractRedColorAggressively(cell);
    if (redColor) {
      console.log(`🔴 PRIORITY RED DETECTED: ${redColor}`);
      return redColor;
    }

    // METHOD 1: Check fill background color (bgColor)
    if (style.fill && style.fill.bgColor) {
      const bgColor = style.fill.bgColor;

      // RGB/ARGB color (most common)
      if (bgColor.rgb) {
        let rgb = bgColor.rgb;

        // Handle ARGB format (8 characters: AARRGGBB)
        if (rgb.length === 8) {
          // Remove alpha channel (first 2 characters)
          rgb = rgb.substring(2);
          colorSource = 'bgColor.rgb(ARGB)';
        } else {
          colorSource = 'bgColor.rgb';
        }

        // Ensure proper hex format
        backgroundColor = rgb.startsWith('#') ? rgb.toUpperCase() : `#${rgb.toUpperCase()}`;
      }
      // Indexed color (Excel color palette)
      else if (bgColor.indexed !== undefined) {
        backgroundColor = this.getIndexedColor(bgColor.indexed);
        colorSource = `bgColor.indexed(${bgColor.indexed})`;
      }
      // Theme color
      else if (bgColor.theme !== undefined) {
        backgroundColor = this.getThemeColor(bgColor.theme, bgColor.tint);
        colorSource = `bgColor.theme(${bgColor.theme})`;
      }
    }

    // METHOD 2: Check pattern foreground color (fgColor) as fallback
    if (!backgroundColor && style.fill && style.fill.fgColor) {
      const fgColor = style.fill.fgColor;

      if (fgColor.rgb) {
        let rgb = fgColor.rgb;

        // Handle ARGB format
        if (rgb.length === 8) {
          rgb = rgb.substring(2);
          colorSource = 'fgColor.rgb(ARGB)';
        } else {
          colorSource = 'fgColor.rgb';
        }

        backgroundColor = rgb.startsWith('#') ? rgb.toUpperCase() : `#${rgb.toUpperCase()}`;
      }
      else if (fgColor.indexed !== undefined) {
        backgroundColor = this.getIndexedColor(fgColor.indexed);
        colorSource = `fgColor.indexed(${fgColor.indexed})`;
      }
      else if (fgColor.theme !== undefined) {
        backgroundColor = this.getThemeColor(fgColor.theme, fgColor.tint);
        colorSource = `fgColor.theme(${fgColor.theme})`;
      }
    }

    // Debug logging for first few color extractions
    if (backgroundColor && this._colorDebugCount < 5) {
      console.log(`🎨 Color extracted: ${backgroundColor} from ${colorSource}`);
      this._colorDebugCount = (this._colorDebugCount || 0) + 1;
    }

    return backgroundColor;
  }

  /**
   * Get weeding activity color based on activity name pattern (fallback)
   */
  getWeedingColorFallback(activityName) {
    if (!activityName) return null;

    const name = activityName.toLowerCase();

    // Map weeding/pest activities to red colors
    if (name.includes('weed') || name.includes('weeding')) {
      if (name.includes('1st') || name.includes('first')) return '#FF0000'; // Pure red
      if (name.includes('2nd') || name.includes('second')) return '#DC143C'; // Crimson
      if (name.includes('3rd') || name.includes('third')) return '#B22222'; // Fire brick
      return '#FF0000'; // Default red for weeding
    }

    if (name.includes('pest') || name.includes('disease')) {
      return '#FF4500'; // Orange-red for pest control
    }

    return null;
  }

  /**
   * AGGRESSIVE RED COLOR DETECTION for agricultural calendars
   * Excel stores red colors in multiple ways - this method checks ALL locations
   * Priority method to detect red colors before standard extraction
   */
  extractRedColorAggressively(cell) {
    if (!cell || !cell.s) return null;

    // Check all possible red color storage locations
    const redPatterns = [
      { value: cell.s?.fill?.bgColor?.rgb, location: 's.fill.bgColor.rgb' },
      { value: cell.s?.fill?.fgColor?.rgb, location: 's.fill.fgColor.rgb' },
      { value: cell.s?.fill?.bgColor?.indexed, location: 's.fill.bgColor.indexed' },
      { value: cell.s?.fill?.fgColor?.indexed, location: 's.fill.fgColor.indexed' },
      { value: cell.s?.bgColor?.rgb, location: 's.bgColor.rgb' },
      { value: cell.s?.fgColor?.rgb, location: 's.fgColor.rgb' },
      { value: cell.s?.bgColor?.indexed, location: 's.bgColor.indexed' },
      { value: cell.s?.fgColor?.indexed, location: 's.fgColor.indexed' },
      // NEW: Check pattern fill properties
      { value: cell.s?.fill?.patternType, location: 's.fill.patternType' }
    ];

    for (const { value, location } of redPatterns) {
      if (value === undefined || value === null) continue;

      // Check for RGB red (FF0000 or FFFF0000 with alpha)
      if (typeof value === 'string') {
        const cleanRgb = value.replace(/^#/, '').toUpperCase();

        // Match exact red: FF0000 or FFFF0000 (with alpha)
        if (cleanRgb === 'FF0000' || cleanRgb === 'FFFF0000' || cleanRgb.endsWith('FF0000')) {
          console.log(`🔴 AGGRESSIVE RED: Found RGB red at ${location} = ${value}`);
          return '#FF0000';
        }

        // Match red with alpha variations (AAFF0000 where AA is alpha)
        if (cleanRgb.length === 8 && cleanRgb.substring(2) === 'FF0000') {
          console.log(`🔴 AGGRESSIVE RED: Found ARGB red at ${location} = ${value}`);
          return '#FF0000';
        }

        // Check for red-like colors (dark red, crimson, etc.)
        const redVariations = ['FF0000', 'DC143C', 'B22222', 'CD5C5C', 'F08080', '800000', 'A52A2A', 'FF4500'];
        if (redVariations.some(redVar => cleanRgb.includes(redVar) || cleanRgb.substring(2) === redVar)) {
          console.log(`🔴 AGGRESSIVE RED: Found red variation at ${location} = ${value}`);
          return `#${cleanRgb.length === 8 ? cleanRgb.substring(2) : cleanRgb}`;
        }
      }

      // Check for indexed red (standard Excel red indices: 2, 10, 60, 68)
      if (typeof value === 'number') {
        const redIndices = [2, 10, 60, 68]; // Common red color indices in Excel
        if (redIndices.includes(value)) {
          console.log(`🔴 AGGRESSIVE RED: Found indexed red at ${location} = ${value}`);
          return '#FF0000';
        }
      }
    }

    return null;
  }

  /**
   * Get indexed color from Excel's color palette (comprehensive 0-65 mapping)
   * Enhanced to match frontend calendarPreviewParser
   */
  getIndexedColor(index) {
    const indexedColors = {
      // Basic colors (0-9)
      0: '#000000',   // Black
      1: '#FFFFFF',   // White
      2: '#FF0000',   // Red
      3: '#00FF00',   // Green
      4: '#0000FF',   // Blue
      5: '#FFFF00',   // Yellow
      6: '#FF00FF',   // Magenta
      7: '#00FFFF',   // Cyan
      8: '#000000',   // Black (duplicate)
      9: '#FFFFFF',   // White (duplicate)

      // Standard colors (10-39)
      10: '#800000',  // Dark Red
      11: '#008000',  // Dark Green
      12: '#000080',  // Dark Blue
      13: '#808000',  // Olive
      14: '#800080',  // Purple
      15: '#008080',  // Teal
      16: '#C0C0C0',  // Silver
      17: '#808080',  // Gray
      18: '#9999FF',  // Light Blue
      19: '#993366',  // Dark Pink
      20: '#FFFFCC',  // Light Yellow
      21: '#CCFFFF',  // Light Cyan
      22: '#660066',  // Dark Purple
      23: '#FF8080',  // Light Red
      24: '#0066CC',  // Medium Blue
      25: '#CCCCFF',  // Periwinkle
      26: '#660066',  // Dark Purple (duplicate)
      27: '#FF8080',  // Light Red (duplicate)
      28: '#0066CC',  // Medium Blue (duplicate)
      29: '#CCCCFF',  // Periwinkle (duplicate)
      30: '#FF0000',  // Red (duplicate)
      31: '#00FFFF',  // Cyan (duplicate)
      32: '#0000FF',  // Blue (duplicate)
      33: '#FF00FF',  // Magenta (duplicate)
      34: '#FFFF00',  // Yellow (duplicate)
      35: '#00FFFF',  // Cyan (duplicate)
      36: '#800080',  // Purple (duplicate)
      37: '#800000',  // Dark Red (duplicate)
      38: '#008080',  // Teal (duplicate)
      39: '#0000FF',  // Blue (duplicate)

      // Extended palette (40-64)
      40: '#00CCFF',  // Sky Blue
      41: '#CCFFFF',  // Pale Cyan
      42: '#CCFFCC',  // Pale Green
      43: '#FFFF99',  // Pale Yellow
      44: '#99CCFF',  // Light Blue
      45: '#FF99CC',  // Pink
      46: '#CC99FF',  // Lavender
      47: '#FFCC99',  // Peach
      48: '#3366FF',  // Royal Blue
      49: '#33CCCC',  // Turquoise
      50: '#99CC00',  // Lime
      51: '#FFCC00',  // Gold
      52: '#FF9900',  // Orange
      53: '#FF6600',  // Dark Orange
      54: '#666699',  // Slate Blue
      55: '#969696',  // Medium Gray
      56: '#003366',  // Navy
      57: '#339966',  // Sea Green
      58: '#003300',  // Dark Green
      59: '#333300',  // Dark Olive
      60: '#993300',  // Brown
      61: '#993366',  // Maroon
      62: '#333399',  // Indigo
      63: '#333333',  // Charcoal
      64: '#000000',  // Black (duplicate)

      // Custom colors for agricultural calendars (matching preview parser)
      65: '#00B0F0',  // Light Blue (Site Selection)
      66: '#BF9000',  // Dark Gold (Land Preparation)
      67: '#FF6600',  // Custom Orange
      68: '#008000',  // Custom Green
      69: '#800080'   // Custom Purple
    };

    return indexedColors[index] || '#CCCCCC'; // Default to light gray
  }

  /**
   * Get theme color with tint support
   */
  getThemeColor(theme, tint = 0) {
    const themeColors = {
      0: '#FFFFFF',  // White
      1: '#000000',  // Black
      2: '#E7E6E6',  // Light Gray
      3: '#44546A',  // Dark Blue Gray
      4: '#5B9BD5',  // Blue
      5: '#70AD47',  // Green
      6: '#FFC000',  // Orange
      7: '#F79646',  // Light Orange
      8: '#C5504B',  // Red
      9: '#9F4F96',  // Purple
      10: '#4472C4', // Medium Blue
      11: '#ED7D31'  // Orange Red
    };

    let baseColor = themeColors[theme] || '#CCCCCC';

    // Apply tint if provided (tint ranges from -1 to 1)
    if (tint !== 0 && baseColor !== '#CCCCCC') {
      baseColor = this.applyTint(baseColor, tint);
    }

    return baseColor;
  }

  /**
   * Apply tint to a hex color
   */
  applyTint(hexColor, tint) {
    // Remove # if present
    const hex = hexColor.replace('#', '');

    // Parse RGB values
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    if (tint < 0) {
      // Darken
      r = Math.round(r * (1 + tint));
      g = Math.round(g * (1 + tint));
      b = Math.round(b * (1 + tint));
    } else {
      // Lighten
      r = Math.round(r + (255 - r) * tint);
      g = Math.round(g + (255 - g) * tint);
      b = Math.round(b + (255 - b) * tint);
    }

    // Ensure values are in valid range
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));

    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
  }

  /**
   * Comprehensive cell background color extractor with multiple fallback methods
   * Matching the sophisticated approach from frontend calendarPreviewParser
   */
  getCellBackgroundColor(cell) {
    if (!cell) return null;

    let backgroundColor = null;

    // Method 1: Use the enhanced extractCellColor method
    try {
      backgroundColor = this.extractCellColor(cell);
      if (backgroundColor) return backgroundColor;
    } catch (error) {
      console.log(`⚠️ Method 1 (extractCellColor) failed: ${error.message}`);
    }

    // Method 2: Direct RGB access (for cells where style might be structured differently)
    if (!backgroundColor && cell.s?.fill?.bgColor?.rgb) {
      let rgb = cell.s.fill.bgColor.rgb;
      // Handle ARGB format (8 characters)
      if (rgb.length === 8) {
        rgb = rgb.substring(2);
      }
      backgroundColor = rgb.startsWith('#') ? rgb.toUpperCase() : `#${rgb.toUpperCase()}`;
      if (backgroundColor) return backgroundColor;
    }

    // Method 3: Indexed color lookup with comprehensive palette
    if (!backgroundColor && cell.s?.fill?.bgColor?.indexed !== undefined) {
      backgroundColor = this.getIndexedColor(cell.s.fill.bgColor.indexed);
      if (backgroundColor) return backgroundColor;
    }

    // Method 4: Theme color with tint
    if (!backgroundColor && cell.s?.fill?.bgColor?.theme !== undefined) {
      const tint = cell.s.fill.bgColor.tint || 0;
      backgroundColor = this.getThemeColor(cell.s.fill.bgColor.theme, tint);
      if (backgroundColor) return backgroundColor;
    }

    // Method 5: Check foreground color as last resort
    if (!backgroundColor && cell.s?.fill?.fgColor?.rgb) {
      let rgb = cell.s.fill.fgColor.rgb;
      if (rgb.length === 8) {
        rgb = rgb.substring(2);
      }
      backgroundColor = rgb.startsWith('#') ? rgb.toUpperCase() : `#${rgb.toUpperCase()}`;
      if (backgroundColor) return backgroundColor;
    }

    return backgroundColor;
  }

  /**
   * Parse Multi-Sheet Excel file for commodity advisories WITH COLOR SUPPORT
   * FIXED: Correct row index calculation to match actual Excel rows
   */
  async parseMultiSheetExcel(filePath) {
    try {
      // Enable cellStyles for color extraction
      const workbook = XLSX.readFile(filePath, {
        cellStyles: true,
        sheetStubs: true,
        raw: false
      });
      const allSheetData = {};

      console.log(`📑 Processing ${workbook.SheetNames.length} sheets: ${workbook.SheetNames.join(', ')}`);

      workbook.SheetNames.forEach((sheetName, sheetIndex) => {
        const worksheet = workbook.Sheets[sheetName];

        // Get raw data with headers
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false });

        if (rawData.length < 2) {
          console.log(`⏭️  Skipping sheet "${sheetName}" - insufficient rows (${rawData.length})`);
          return;
        }

        const headers = rawData[0];
        const rows = rawData.slice(1);

        console.log(`📄 Sheet "${sheetName}": ${rawData.length} total rows (1 header + ${rows.length} data rows)`);

        // Debug counter for first sheet only
        let cellDebugCount = 0;

        // Convert to objects with color metadata
        const jsonData = rows.map((row, rowIndex) => {
          const obj = {};

          // Excel row number (headers at row 0, data starts at row 1)
          const excelRowNum = rowIndex + 1;

          headers.forEach((header, colIndex) => {
            const cellValue = row[colIndex] || '';
            obj[header] = cellValue;

            // Extract cell color
            // CRITICAL: excelRowNum is correct (rowIndex + 1 because headers are at row 0)
            const cellAddress = XLSX.utils.encode_cell({ r: excelRowNum, c: colIndex });
            const cell = worksheet[cellAddress];
            const cellColor = this.extractCellColor(cell);

            // Debug: Log first 5 cells from first sheet only
            if (sheetIndex === 0 && cellDebugCount < 5 && (cellValue || cellColor)) {
              console.log(`🔬 Sheet "${sheetName}" Cell ${cellAddress}: "${String(cellValue).substring(0, 20)}" → ${cellColor || 'no color'}`);
              cellDebugCount++;
            }

            if (cellColor) {
              obj[`${header}_color`] = cellColor;
              obj[`${header}_background`] = cellColor;
            }
          });
          return obj;
        });

        // Filter out empty rows
        const filteredData = jsonData.filter(row => {
          return Object.values(row).some(value => value && value.toString().trim() !== '');
        });

        if (filteredData.length > 0) {
          allSheetData[sheetName] = filteredData;
          console.log(`✅ Sheet "${sheetName}": ${filteredData.length} valid records extracted`);
        } else {
          console.log(`⏭️  Sheet "${sheetName}": No valid data after filtering`);
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
   * Enhanced to extract colors from ALL columns using comprehensive color detection
   */
  parseCropCalendar(data) {
    console.log('🌾 Parsing Crop Calendar with enhanced color extraction...');

    return data.map((row, index) => {
      try {
        // Extract colors from Excel cells using multiple detection methods
        // Check both old format (_color suffix) and new enhanced detection
        const cropColor = row['Crop_color'] || row['Crop_background'];
        const plantingStartColor = row['PlantingStart_color'] || row['Planting Start_color'] || row['PlantingStart_background'];
        const plantingEndColor = row['PlantingEnd_color'] || row['Planting End_color'] || row['PlantingEnd_background'];
        const harvestStartColor = row['HarvestStart_color'] || row['Harvest Start_color'] || row['HarvestStart_background'];
        const harvestEndColor = row['HarvestEnd_color'] || row['Harvest End_color'] || row['HarvestEnd_background'];

        // Determine the dominant color for the entire crop entry
        const dominantColor = cropColor || plantingStartColor || harvestStartColor;

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

          // Store extracted colors (individual column colors)
          cropColor: cropColor,
          plantingStartColor: plantingStartColor,
          plantingEndColor: plantingEndColor,
          harvestStartColor: harvestStartColor,
          harvestEndColor: harvestEndColor,

          // Store grouped colors for easier access
          plantingColor: plantingStartColor || plantingEndColor,
          harvestColor: harvestStartColor || harvestEndColor,

          // Store dominant/primary color for calendar display
          backgroundColor: dominantColor,
          color: dominantColor,

          createdAt: new Date().toISOString()
        };

        // Debug: Log color extraction for first few records
        if (index < 3 && dominantColor) {
          console.log(`  Row ${index + 1}: ${record.crop} - Colors: crop=${cropColor}, planting=${plantingStartColor}, harvest=${harvestStartColor}`);
        }

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
   * Enhanced with timeline color detection from month/week columns
   */
  parseProductionCalendar(data) {
    console.log('🏭 Parsing Production Calendar with enhanced color extraction...');

    return data.map((row, index) => {
      try {
        // Extract colors from Excel cells using comprehensive detection
        const activityColor = row['Activity_color'] || row['Activity_background'];
        const monthColor = row['Month_color'] || row['Month_background'];
        const weekColor = row['Week_color'] || row['Week_background'];

        // NEW: Extract timeline colors from month columns (JAN, FEB, MAR, etc.)
        const monthColumns = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const monthColumnColors = {};
        let firstMonthColor = null;

        monthColumns.forEach(monthName => {
          const columnColor = row[`${monthName}_color`] || row[`${monthName}_background`];
          if (columnColor) {
            monthColumnColors[monthName] = columnColor;
            if (!firstMonthColor) firstMonthColor = columnColor;
          }
        });

        // NEW: Extract timeline colors from week columns (Week 1, Week 2, etc.)
        const weekColumnColors = {};
        let firstWeekColor = null;

        for (let w = 1; w <= 52; w++) {
          const weekNames = [`Week ${w}`, `Week${w}`, `WK${w}`, `W${w}`];
          for (const weekName of weekNames) {
            const columnColor = row[`${weekName}_color`] || row[`${weekName}_background`];
            if (columnColor) {
              weekColumnColors[w] = columnColor;
              if (!firstWeekColor) firstWeekColor = columnColor;
              break;
            }
          }
        }

        // Determine the best color to use (priority: activity > first timeline color > month/week)
        const dominantColor = activityColor || firstMonthColor || firstWeekColor || monthColor || weekColor;

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

          // Store extracted colors
          activityColor: activityColor,
          monthColor: monthColor,
          weekColor: weekColor,

          // Store timeline color mappings for detailed calendar rendering
          monthColumnColors: monthColumnColors,
          weekColumnColors: weekColumnColors,

          // Store dominant/primary color
          backgroundColor: dominantColor,
          color: dominantColor,

          createdAt: new Date().toISOString()
        };

        // Debug: Log color extraction for first few records
        if (index < 3 && dominantColor) {
          const monthColorCount = Object.keys(monthColumnColors).length;
          const weekColorCount = Object.keys(weekColumnColors).length;
          console.log(`  Row ${index + 1}: ${record.activity} - Colors: activity=${activityColor}, months=${monthColorCount}, weeks=${weekColorCount}`);
        }

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
   * Enhanced with activity-specific color extraction and week timeline colors
   */
  parsePoultryCalendar(data) {
    console.log('🐔 Parsing Poultry Calendar with enhanced color extraction...');

    return data.map((row, index) => {
      try {
        // Extract colors from Excel cells using comprehensive detection
        const activityColor = row['Activity_color'] || row['Activity_background'];
        const startWeekColor = row['StartWeek_color'] || row['Start Week_color'] || row['StartWeek_background'];
        const endWeekColor = row['EndWeek_color'] || row['End Week_color'] || row['EndWeek_background'];
        const typeColor = row['PoultryType_color'] || row['Poultry Type_color'] || row['Type_color'];

        // NEW: Extract timeline colors from week columns (Week 1-52)
        const weekColumnColors = {};
        let firstWeekColor = null;

        for (let w = 1; w <= 52; w++) {
          const weekNames = [`Week ${w}`, `Week${w}`, `WK${w}`, `W${w}`, `Week_${w}`];
          for (const weekName of weekNames) {
            const columnColor = row[`${weekName}_color`] || row[`${weekName}_background`];
            if (columnColor) {
              weekColumnColors[w] = columnColor;
              if (!firstWeekColor) firstWeekColor = columnColor;
              break;
            }
          }
        }

        // Determine best color (priority: activity > week timeline > type > default)
        const extractedColor = activityColor || firstWeekColor || startWeekColor || endWeekColor || typeColor;

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

          // Store extracted colors
          activityColor: activityColor,
          startWeekColor: startWeekColor,
          endWeekColor: endWeekColor,
          typeColor: typeColor,

          // Store timeline color mappings
          weekColumnColors: weekColumnColors,

          // Use extracted Excel color if available, otherwise use provided color or default
          color: extractedColor || this.cleanString(row.Color || row.color || 'bg-blue-500'),
          backgroundColor: extractedColor, // Store raw hex color

          priority: this.cleanString(row.Priority || row.priority || 'Medium'),
          duration: this.cleanString(row.Duration || row.duration || ''),
          notes: this.cleanString(row.Notes || row.notes || row.Remarks || row.remarks || ''),
          createdAt: new Date().toISOString()
        };

        // Debug: Log color extraction for first few records
        if (index < 3 && extractedColor) {
          const weekColorCount = Object.keys(weekColumnColors).length;
          console.log(`  Row ${index + 1}: ${record.activity} - Colors: activity=${activityColor}, weeks=${weekColorCount}, final=${extractedColor}`);
        }

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
   * Calculate color extraction statistics
   */
  calculateColorStatistics(data, contentType) {
    let recordsWithColor = 0;
    const uniqueColorsSet = new Set();

    data.forEach(record => {
      let hasColor = false;

      // Check for colors based on calendar type
      const colorFields = [
        'backgroundColor', 'color', 'activityColor', 'cropColor', 'plantingColor',
        'harvestColor', 'monthColor', 'weekColor', 'typeColor',
        'plantingStartColor', 'harvestStartColor'
      ];

      colorFields.forEach(field => {
        if (record[field] && record[field] !== '#FFFFFF') {
          hasColor = true;
          uniqueColorsSet.add(record[field]);
        }
      });

      // Check monthColumnColors and weekColumnColors objects
      if (record.monthColumnColors) {
        Object.values(record.monthColumnColors).forEach(color => {
          if (color && color !== '#FFFFFF') {
            hasColor = true;
            uniqueColorsSet.add(color);
          }
        });
      }

      if (record.weekColumnColors) {
        Object.values(record.weekColumnColors).forEach(color => {
          if (color && color !== '#FFFFFF') {
            hasColor = true;
            uniqueColorsSet.add(color);
          }
        });
      }

      if (hasColor) recordsWithColor++;
    });

    const uniqueColors = Array.from(uniqueColorsSet).sort();
    const colorPercentage = data.length > 0
      ? Math.round((recordsWithColor / data.length) * 100)
      : 0;

    return {
      recordsWithColor,
      totalRecords: data.length,
      colorPercentage,
      uniqueColors,
      uniqueColorCount: uniqueColors.length
    };
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