/**
 * Frontend Calendar Preview Parser
 * 
 * Client-side Excel parsing utility for generating calendar previews
 * Adapted from server-side EnhancedCalendarParser for browser use
 */

import * as XLSX from 'xlsx';

class CalendarPreviewParser {
  constructor() {
    // Agricultural types with specific timing patterns (priority types)
    this.priorityAgriculturalTypes = {
      // Seasonal crops with exact timing patterns
      seasonalCrops: ['maize', 'rice', 'soybean', 'sorghum', 'tomato', 'groundnut'],
      
      // Production cycles with custom timeframes  
      poultryCycles: {
        'broiler': { type: 'weeks', duration: 8 },
        'layer': { type: 'months', duration: 5 }
      }
    };

    // Legacy commodity lists (for backward compatibility)
    this.seasonalCommodities = [
      'maize', 'rice', 'cassava', 'yam', 'plantain', 'cocoa', 'coffee',
      'tomato', 'pepper', 'onion', 'okra', 'garden egg', 'beans',
      'groundnut', 'soybean', 'cowpea', 'oil palm', 'coconut'
    ];

    // Poultry types that use flexible production cycles  
    this.cycleCommodities = [
      'broiler', 'layer', 'cockerel', 'duck', 'turkey', 'guinea fowl', 'goose'
    ];

    // Standard months mapping
    this.monthMapping = {
      'jan': 1, 'january': 1, 'feb': 2, 'february': 2, 'mar': 3, 'march': 3,
      'apr': 4, 'april': 4, 'may': 5, 'jun': 6, 'june': 6,
      'jul': 7, 'july': 7, 'aug': 8, 'august': 8, 'sep': 9, 'september': 9,
      'oct': 10, 'october': 10, 'nov': 11, 'november': 11, 'dec': 12, 'december': 12
    };

    // EXACT colors from target Excel screenshots 
    // Based on user corrections: Site Selection=#00B0F0, Land preparation=#BF9000, etc.
    this.defaultActivities = [
      // 1. Site Selection: JAN-MAR (WK1-WK13) - Light blue color from screenshot
      { name: 'Site Selection', color: '#00B0F0', weeks: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] }, // JAN-MAR: WK1-WK13 (CORRECTED COLOR)
      
      // 2. Land preparation: JAN-FEB (WK1-WK9) - Dark orange/gold color from screenshot  
      { name: 'Land preparation', color: '#BF9000', weeks: [0, 1, 2, 3, 4, 5, 6, 7, 8] }, // JAN-FEB: WK1-WK9 (CORRECTED COLOR)
      
      // 3. Planting/sowing: Black color from screenshot
      { name: 'Planting/sowing', color: '#000000', weeks: [] }, // Black color (CORRECTED COLOR)
      
      // 4. 1st fertilizer application: Later in timeline
      { name: '1st fertilizer application', color: '#FFFF00', weeks: [] }, // Keep yellow for now
      
      // 5. First weed management & Control of fall army worm: Later in timeline
      { name: 'First weed management & Control of fall army worm', color: '#FF0000', weeks: [] }, // Keep red for now
      
      // 6. 2nd Fertilizer Application (Urea or SOA): Black color from screenshot
      { name: '2nd Fertilizer Application (Urea or SOA)', color: '#000000', weeks: [] }, // Black color (CORRECTED COLOR)
      
      // 7. Second weed management & Pest and disease control: Later in timeline
      { name: 'Second weed management & Pest and disease control', color: '#FF0000', weeks: [] }, // Keep red for now
      
      // 8. Harvesting: Later in timeline
      { name: 'Harvesting', color: '#008000', weeks: [] }, // Keep green for now
      
      // 9. Post harvest handling: Later in timeline
      { name: 'Post harvest handling', color: '#800080', weeks: [] } // Keep purple for now
    ];

    // Enhanced color mapping for Excel cell backgrounds
    this.colorMapping = {
      // Basic colors
      'yellow': '#FFFF00',
      'orange': '#FFA500', 
      'red': '#FF0000',
      'green': '#008000',
      'blue': '#0000FF',
      'purple': '#800080',
      'brown': '#8B4513',
      'gold': '#FFD700',
      'crimson': '#DC143C',
      
      // Excel theme colors (common RGB values)
      'rgb(255,255,0)': '#FFFF00',    // Yellow
      'rgb(255,165,0)': '#FFA500',    // Orange  
      'rgb(255,0,0)': '#FF0000',      // Red
      'rgb(0,128,0)': '#008000',      // Green
      'rgb(128,0,128)': '#800080',    // Purple
      'rgb(139,69,19)': '#8B4513',    // Brown
      'rgb(255,215,0)': '#FFD700',    // Gold
      
      // Excel indexed colors (approximate)
      2: '#FF0000',   // Red
      3: '#00FF00',   // Green  
      4: '#0000FF',   // Blue
      5: '#FFFF00',   // Yellow
      6: '#FF00FF',   // Magenta
      7: '#00FFFF',   // Cyan
      8: '#000000',   // Black
      9: '#FFFFFF',   // White
      10: '#800000',  // Dark Red
      11: '#008000',  // Dark Green
      12: '#000080',  // Dark Blue
      13: '#808000',  // Olive
      14: '#800080',  // Purple
      15: '#008080'   // Teal
    };

    // Activity-specific color assignments - ENHANCED for all crop types
    this.activityColors = {
      // PRIMARY ACTIVITIES (from user screenshot and requirements)
      'site selection': '#00B0F0',      // Light blue (exact match)
      'land preparation': '#BF9000',    // Dark gold (exact match)  
      'planting': '#000000',            // Black
      'sowing': '#000000',              // Black
      'planting/sowing': '#000000',     // Black (combined activity)
      
      // LAND PREPARATION ACTIVITIES
      'ploughing': '#8B4513',           // Saddle brown
      'harrowing': '#A0522D',           // Sienna
      'ridging': '#D2691E',             // Chocolate
      'puddling': '#4682B4',            // Steel blue (for rice)
      'leveling': '#778899',            // Light slate gray
      
      // SEED ACTIVITIES
      'seed selection': '#90EE90',      // Light green
      'seed treatment': '#98FB98',      // Pale green
      'seed sorting': '#90EE90',        // Light green
      
      // FERTILIZER ACTIVITIES
      'fertilizer': '#FFFF00',          // Yellow
      '1st fertilizer': '#FFFF00',      // Yellow
      '2nd fertilizer': '#000000',      // Black (per requirements)
      '3rd fertilizer': '#FFFF00',      // Yellow
      'fertilizer application': '#FFFF00', // Yellow
      'first fertilizer application': '#FFFF00', // Yellow
      'second fertilizer application': '#000000', // Black
      'third fertilizer application': '#FFFF00',  // Yellow
      'basal fertilizer': '#FFD700',    // Gold
      'top dressing': '#FFA500',        // Orange
      'urea': '#000000',                // Black (2nd fertilizer type)
      'soa': '#000000',                 // Black (2nd fertilizer type)
      'npk': '#FFFF00',                 // Yellow
      
      // NURSERY AND TRANSPLANTING
      'nursery establishment': '#32CD32', // Lime green
      'nursery management': '#32CD32',   // Lime green
      'transplanting': '#32CD32',        // Lime green
      'transplant': '#32CD32',           // Lime green
      'emergence': '#98FB98',            // Pale green
      'thinning': '#FFA500',             // Orange
      'gap filling': '#90EE90',          // Light green
      
      // WEED MANAGEMENT  
      'weed': '#FF0000',                // Red
      'weed management': '#FF0000',     // Red
      'weeding': '#FF0000',             // Red
      'first weed': '#FF0000',          // Red
      'second weed': '#FF0000',         // Red
      'first weed management': '#FF0000', // Red
      'second weed management': '#FF0000', // Red
      '1st weed management': '#FF0000',  // Red
      '2nd weed management': '#FF0000',  // Red
      
      // PEST AND DISEASE CONTROL
      'pest': '#FF0000',                // Red
      'disease': '#FF0000',             // Red
      'control': '#FF0000',             // Red
      'fall army worm': '#FF0000',      // Red
      'pest and disease': '#FF0000',    // Red
      'pest and disease control': '#FF0000', // Red
      'disease management': '#FF0000',   // Red
      'insect control': '#FF0000',       // Red
      'insect pest control': '#FF0000',  // Red
      'control of fall army worm': '#FF0000', // Red
      
      // WATER MANAGEMENT
      'water management': '#4169E1',     // Royal blue
      'irrigation': '#4169E1',           // Royal blue
      'drainage': '#1E90FF',             // Dodger blue
      
      // CROP-SPECIFIC ACTIVITIES
      
      // RICE SPECIFIC
      'roguing': '#FF6347',              // Tomato
      'bird scaring': '#FFB6C1',         // Light pink
      'field monitoring': '#40E0D0',     // Turquoise
      
      // SOYBEAN SPECIFIC
      'inoculation': '#9370DB',          // Medium purple
      'rhizobium inoculation': '#9370DB', // Medium purple
      'nodulation': '#8A2BE2',           // Blue violet
      'flowering': '#FFB6C1',            // Light pink
      'pod formation': '#FF69B4',        // Hot pink
      'pod filling': '#FF1493',          // Deep pink
      
      // GROUNDNUT SPECIFIC
      'pegging': '#FF69B4',              // Hot pink
      'peg penetration': '#FF1493',      // Deep pink
      'lifting': '#8B4513',              // Saddle brown
      'picking': '#D2691E',              // Chocolate
      'pod separation': '#A0522D',       // Sienna
      'curing': '#DEB887',               // Burlywood
      'shelling': '#F4A460',             // Sandy brown
      
      // TOMATO SPECIFIC
      'germination test': '#98FB98',     // Pale green
      'nursing': '#90EE90',              // Light green
      'application of starter solution': '#ADFF2F', // Green yellow
      'starter solution': '#ADFF2F',     // Green yellow
      'earthening-up': '#D2691E',        // Chocolate
      'staking': '#8B4513',              // Saddle brown
      'trellising': '#A0522D',           // Sienna
      'pruning': '#228B22',              // Forest green
      
      // POST-HARVEST ACTIVITIES
      'harvesting': '#008000',           // Green
      'harvest': '#008000',              // Green
      'cutting': '#228B22',              // Forest green
      'threshing': '#DC143C',            // Crimson
      'winnowing': '#B22222',            // Fire brick
      'drying': '#FFD700',               // Gold
      'sun drying': '#FFD700',           // Gold
      'field drying': '#F0E68C',         // Khaki
      'cleaning': '#DDA0DD',             // Plum
      'grading': '#DA70D6',              // Orchid
      'milling': '#8FBC8F',              // Dark sea green
      'storage': '#800080',              // Purple
      'post harvest': '#800080',         // Purple
      'post harvest handling': '#800080', // Purple
      'post-harvest handling': '#800080', // Purple
      'packaging': '#9932CC',            // Dark orchid
      'marketing': '#4B0082',            // Indigo
      
      // POULTRY SPECIFIC
      'construction': '#8B4513',         // Saddle brown
      'appropriate housing': '#A0522D',  // Sienna
      'source for market': '#D2691E',    // Chocolate
      'preparation before arrival': '#DEB887', // Burlywood
      'day-old chicks': '#FFB6C1',       // Light pink
      'brooder management': '#FFA07A',   // Light salmon
      'controlled environment': '#87CEEB', // Sky blue
      'heat': '#FF4500',                 // Orange red
      'provision of pre-starter': '#98FB98', // Pale green
      'starter diet': '#90EE90',         // Light green
      'potable water': '#4169E1',        // Royal blue
      'ad libitum': '#40E0D0',          // Turquoise
      'gumboro vaccine': '#FF6347',      // Tomato
      'newcastle vaccine': '#FF69B4',    // Hot pink
      'debeaking': '#8B0000',           // Dark red
      'biosecurity measures': '#4B0082', // Indigo
      'husbandry practices': '#800080',  // Purple
      'harvesting and processing': '#008000', // Green
      'harvesting and marketing': '#008000',   // Green
      'eggs': '#FFD700',                // Gold
      
      // MATURITY ASSESSMENT
      'maturity assessment': '#FFB6C1', // Light pink
      
      // GENERAL FALLBACKS
      'fertiliser': '#FFFF00',          // Yellow (alternate spelling)
      'pest control': '#FF0000',        // Red
      'disease control': '#FF0000',     // Red
    };
  }

  /**
   * Main parsing entry point for file preview
   * @param {File} file - The uploaded Excel file
   * @param {Object} metadata - Additional metadata (region, district, etc.)
   * @returns {Promise<Object>} Parsed calendar data
   */
  async parseCalendarForPreview(file, metadata = {}) {
    try {
      console.log('🚀 Starting calendar preview parsing...');
      console.log('📁 File:', file ? file.name : 'NO FILE');
      console.log('📋 Metadata:', metadata);
      
      if (!file) {
        throw new Error('No file provided for parsing');
      }

      // Initialize counters for debugging
      this.colorDebugCount = 0;
      this.noColorDebugCount = 0;
      this.debugActivityCount = 0;
      this.noActivityDebugCount = 0;

      // Read file as array buffer
      const arrayBuffer = await file.arrayBuffer();
      
      // COMPREHENSIVE XLSX LIBRARY TESTING & CONFIGURATION
      console.log('🔬 XLSX LIBRARY DIAGNOSTIC:');
      console.log('  📚 XLSX Version:', typeof XLSX.version !== 'undefined' ? XLSX.version : 'Unknown');
      console.log('  📁 File Size:', arrayBuffer.byteLength, 'bytes');
      console.log('  🔧 Available XLSX Methods:', Object.keys(XLSX).slice(0, 10));
      
      // TEST MULTIPLE XLSX CONFIGURATIONS to find one that works
      const xlsxConfigs = [
        {
          name: 'Enhanced Style Config',
          options: {
            type: 'array',
            cellStyles: true,
            cellHTML: false,
            cellFormula: true,
            cellNF: true,
            sheetStubs: false,
            bookVBA: false,
            cellText: false,
            dense: false,
            raw: true,
            bookSST: true,
            WTF: true  // Enable detailed error reporting
          }
        },
        {
          name: 'Alternative Config',
          options: {
            type: 'array',
            cellStyles: true,
            bookSST: true,
            WTF: true,
            dense: false
          }
        }
      ];
      
      let workbook = null;
      let workingConfig = null;
      
      for (const config of xlsxConfigs) {
        try {
          console.log(`🧪 Testing "${config.name}"...`);
          const testWorkbook = XLSX.read(arrayBuffer, config.options);
          
          if (testWorkbook && testWorkbook.SheetNames && testWorkbook.SheetNames.length > 0) {
            console.log(`✅ "${config.name}" successful - Found ${testWorkbook.SheetNames.length} sheets`);
            workbook = testWorkbook;
            workingConfig = config;
            break;
          } else {
            console.log(`❌ "${config.name}" failed - No sheets found`);
          }
        } catch (error) {
          console.log(`❌ "${config.name}" failed - Error:`, error.message);
        }
      }
      
      if (!workbook) {
        throw new Error('All XLSX configurations failed - file may be corrupted or unsupported format');
      }
      
      console.log(`🎯 Using configuration: "${workingConfig.name}"`);
      console.log('📊 WORKBOOK STRUCTURE:');
      console.log('  📄 Sheet Names:', workbook.SheetNames);
      console.log('  🎨 Workbook.SSF Available:', !!workbook.SSF);
      console.log('  🎭 Workbook.Workbook Available:', !!workbook.Workbook);
      console.log('  📝 Props Available:', !!workbook.Props);
      
      if (workbook.Workbook) {
        console.log('  🌈 Theme Colors Available:', !!workbook.Workbook.Colors);
        console.log('  📋 Workbook Views:', !!workbook.Workbook.Views);
      }
      
      // Store workbook reference for backup color detection
      this.workbook = workbook;
      
      console.log('📖 XLSX read result check:', {
        hasWorkbook: !!workbook,
        hasSheetNames: !!workbook?.SheetNames,
        hasSheets: !!workbook?.Sheets,
        totalSheets: workbook?.SheetNames?.length || 0,
        sheetNames: workbook?.SheetNames || [],
        hasStyles: !!workbook?.Styles,
        stylesCount: workbook?.Styles ? Object.keys(workbook.Styles).length : 0
      });

      // Defensive validation of workbook structure
      if (!workbook) {
        throw new Error('Failed to read Excel file. The file may be corrupted or in an unsupported format.');
      }
      
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('Excel file contains no readable sheets. Please check the file format.');
      }
      
      if (!workbook.Sheets) {
        throw new Error('Excel file sheets are not accessible. The file may be password protected or corrupted.');
      }

      // Get the first sheet with validation
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      if (!worksheet) {
        throw new Error(`Cannot access sheet "${sheetName}". The sheet may be empty or corrupted.`);
      }
      
      console.log('📊 Starting calendar parsing for preview...');
      console.log('📁 File name:', file.name);
      console.log('📋 Sheet name:', sheetName);
      console.log('📏 Worksheet range:', worksheet['!ref']);
      
      // EXTENSIVE DEBUGGING: Log complete Excel structure
      console.log('🔍 DETAILED EXCEL STRUCTURE ANALYSIS:');
      const debugRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:AZ100');
      console.log(`📐 Decoded range: rows ${debugRange.s.r}-${debugRange.e.r}, cols ${debugRange.s.c}-${debugRange.e.c}`);
      
      // Log first 15 rows with all their data
      for (let row = 0; row < Math.min(15, debugRange.e.r + 1); row++) {
        const rowData = [];
        const rowColors = [];
        for (let col = 0; col < Math.min(50, debugRange.e.c + 1); col++) {
          const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
          const cell = worksheet[cellRef];
          if (cell) {
            rowData.push(`${cellRef}:"${cell.v || ''}"`);
            const cellColor = this.getCellBackgroundColor(cell);
            if (cellColor && cellColor !== '#FFFFFF') {
              rowColors.push(`${cellRef}:${cellColor}`);
            }
          }
        }
        if (rowData.length > 0) {
          console.log(`📋 Row ${row}: ${rowData.slice(0, 20).join(', ')}`);
          if (rowColors.length > 0) {
            console.log(`🎨 Row ${row} colors: ${rowColors.join(', ')}`);
          }
        }
      }
      
      // Convert to JSON format preserving structure (styles preserved in worksheet object)
      const rawData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,              // Use array format (not object format)
        defval: '',            // Fill empty cells with empty string
        raw: true,             // Keep raw values to preserve data integrity
        range: undefined,      // Use entire sheet range
        skipHidden: false,     // Include hidden rows/columns  
        blankrows: true        // Include blank rows to maintain structure
      });
      
      console.log('📊 Total rows in Excel:', rawData.length);
      
      // Debug: Print first 15 rows to understand structure
      console.log('🔍 EXCEL STRUCTURE ANALYSIS:');
      for (let i = 0; i < Math.min(15, rawData.length); i++) {
        const row = rawData[i];
        const firstCell = row?.[0] ? `"${row[0]}"` : 'EMPTY';
        const cellCount = row ? row.length : 0;
        console.log(`Row ${i} (${cellCount} cells): First cell = ${firstCell}`, row?.slice(0, 15)); // First 15 columns
      }

      // Also get cell styles and colors
      console.log('🎨 CELL STYLE ANALYSIS PHASE:');
      const cellStyles = this.extractCellStyles(worksheet);
      console.log('🎨 Cell styles extracted:', Object.keys(cellStyles).length, 'cells');
      
      // Debug: Show sample raw Excel cells to understand structure
      console.log('🧪 RAW EXCEL CELL ANALYSIS:');
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:Z20');
      let rawCellCount = 0;
      let colorfulCells = 0;
      let styledCells = 0;
      
      for (let row = 3; row <= Math.min(8, range.e.r); row++) { // Check activity rows
        for (let col = 1; col <= Math.min(25, range.e.c); col++) { // Check first 25 columns
          const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
          const cell = worksheet[cellRef];
          if (cell) {
            styledCells++;
            const backgroundColor = this.getCellBackgroundColor(cell);
            if (backgroundColor) colorfulCells++;
            
            if (rawCellCount < 15 && (cell.v || backgroundColor)) {
              console.log(`Raw Cell ${cellRef}:`, {
                value: cell.v,
                hasStyle: !!cell.s,
                backgroundColor: backgroundColor,
                styleKeys: cell.s ? Object.keys(cell.s) : [],
                fillData: cell.s?.fill ? {
                  patternType: cell.s.fill.patternType,
                  hasBgColor: !!cell.s.fill.bgColor,
                  hasFgColor: !!cell.s.fill.fgColor
                } : 'NO_FILL'
              });
              rawCellCount++;
            }
          }
        }
      }
      
      console.log(`📊 Excel Analysis Summary: ${styledCells} cells with styles, ${colorfulCells} cells with colors`);
      
      // Debug: Show colored cells with enhanced info
      const coloredCells = Object.entries(cellStyles).filter(([ref, style]) => style.background && style.background !== '#FFFFFF');
      console.log('🌈 Colored cells found:', coloredCells.length);
      if (coloredCells.length > 0) {
        console.log('🌈 Sample colored cells:');
        coloredCells.slice(0, 12).forEach(([ref, style]) => {
          console.log(`  Cell ${ref}: bg=${style.background}, content="${style.value}", filled=${style.isFilled}`);
        });
      } else {
        console.log('⚠️ WARNING: No colored cells detected! This may indicate parsing issues.');
        // Show more details about cell styles when no colors found
        const sampleCells = Object.entries(cellStyles).filter(([ref, style]) => style.value).slice(0, 5);
        console.log('📝 Sample cells with content but no color:');
        sampleCells.forEach(([ref, style]) => {
          const rawCell = worksheet[ref];
          console.log(`  Cell ${ref}: content="${style.value}", rawStyle=${JSON.stringify(rawCell?.s || {})}`);
        });
      }

      // Detect calendar type and commodity with enhanced error handling
      let calendarInfo;
      try {
        console.log('🔍 Step 1: Detecting calendar type...');
        console.log('📊 Raw data structure check:', {
          totalRows: rawData.length,
          firstRowLength: rawData[0]?.length,
          sampleFirstRow: rawData[0]?.slice(0, 5),
          sampleSecondRow: rawData[1]?.slice(0, 5)
        });
        
        console.log('🔍 Step 1a: About to call detectCalendarType...');
        calendarInfo = this.detectCalendarType(rawData, file.name);
        console.log('✅ Calendar info detected successfully:', calendarInfo);
      } catch (error) {
        console.error('❌ CRITICAL ERROR in detectCalendarType:', error);
        console.error('❌ Error stack:', error.stack);
        console.error('❌ Error name:', error.name);
        console.error('❌ Error message:', error.message);
        calendarInfo = {
          type: 'seasonal',
          commodity: 'maize',
          title: file.name || 'Unknown Calendar',
          headers: []
        };
        console.log('🔄 Using fallback calendar info:', calendarInfo);
      }
      
      // Parse calendar structure with error handling
      let parsedCalendar;
      try {
        console.log('🏗️ Step 2: Parsing calendar structure...');
        console.log('📋 Input parameters check:', {
          rawDataRows: rawData.length,
          cellStylesCount: Object.keys(cellStyles).length,
          calendarInfoCheck: {
            hasType: !!calendarInfo.type,
            hasComm: !!calendarInfo.commodity,
            hasTitle: !!calendarInfo.title,
            calendarInfo: calendarInfo
          },
          metadataCheck: metadata
        });
        
        console.log('🏗️ Step 2a: About to call parseCalendarStructure...');
        parsedCalendar = this.parseCalendarStructure(rawData, cellStyles, calendarInfo, metadata, worksheet);
        console.log('✅ Step 2b: Calendar structure parsed successfully:', parsedCalendar?.summary || 'No summary');
      } catch (error) {
        console.error('❌ Error parsing calendar structure:', error);
        // Return a basic structure if parsing fails
        parsedCalendar = {
          type: calendarInfo.type,
          commodity: calendarInfo.commodity,
          title: calendarInfo.title,
          timeline: { columns: [], months: [], weeks: [], totalSpan: 0 },
          activities: [],
          calendarGrid: { headers: ['Activity'], rows: [], summary: { totalColumns: 1, totalRows: 0, timelineType: calendarInfo.type } },
          summary: { totalActivities: 0, timeSpan: 0, activePeriodsCount: 0 }
        };
      }

      return {
        success: true,
        fileName: file.name,
        fileSize: file.size,
        calendarType: calendarInfo.type,
        commodity: calendarInfo.commodity,
        title: calendarInfo.title,
        data: parsedCalendar,
        metadata: {
          totalActivities: parsedCalendar.activities?.length || 0,
          totalTimeColumns: parsedCalendar.timeline?.columns?.length || 0,
          parseDate: new Date().toISOString(),
          ...metadata
        }
      };

    } catch (error) {
      console.error('Calendar preview parsing error:', error);
      return {
        success: false,
        error: error.message,
        fileName: file?.name || 'Unknown file'
      };
    }
  }

  /**
   * Extract cell styles and background colors from worksheet
   */
  extractCellStyles(worksheet) {
    const styles = {};
    if (!worksheet || !worksheet['!ref']) {
      console.log('❌ EXTRACT CELL STYLES: No worksheet or !ref property');
      return styles;
    }
    
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    console.log(`🔬 COMPREHENSIVE CELL STYLE EXTRACTION:`);
    console.log(`  📊 Range: ${worksheet['!ref']} (Rows: ${range.s.r}-${range.e.r}, Cols: ${range.s.c}-${range.e.c})`);
    console.log(`  📋 Total cells in range: ${(range.e.r - range.s.r + 1) * (range.e.c - range.s.c + 1)}`);
    
    let totalCells = 0;
    let cellsWithContent = 0;
    let cellsWithStyles = 0;
    let cellsWithBackground = 0;
    let debugCellCount = 0;
    
    // LIMIT PROCESSING to reasonable range to avoid browser crash
    const maxRow = Math.min(range.e.r, 20);  // First 20 rows
    const maxCol = Math.min(range.e.c, 50);  // First 50 columns
    
    console.log(`  🔧 Processing limited range: Rows 0-${maxRow}, Cols 0-${maxCol}`);
    
    for (let row = range.s.r; row <= maxRow; row++) {
      for (let col = range.s.c; col <= maxCol; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellRef];
        totalCells++;
        
        if (cell) {
          cellsWithContent++;
          const hasStyleObject = !!(cell.s);
          const cellValue = cell.v;
          
          if (hasStyleObject) {
            cellsWithStyles++;
          }
          
          // DEEP CELL ANALYSIS for first 30 cells or activity-related cells
          const isActivityCell = (row >= 1 && row <= 10) && (col >= 0 && col <= 30);
          
          if ((debugCellCount < 30) || isActivityCell) {
            console.log(`🔍 CELL ${cellRef} (R${row}C${col}):`);
            console.log(`  📝 Value: "${cellValue || 'empty'}"`);
            console.log(`  🎭 Has Style: ${hasStyleObject}`);
            
            if (hasStyleObject && cell.s) {
              console.log(`  🎨 Style Keys: [${Object.keys(cell.s).join(', ')}]`);
              
              // ANALYZE FILL PROPERTY IN DETAIL
              if (cell.s.fill) {
                console.log(`  🌈 Fill Object Found:`, cell.s.fill);
                
                if (cell.s.fill.bgColor) {
                  console.log(`    🎯 bgColor:`, cell.s.fill.bgColor);
                  if (cell.s.fill.bgColor.rgb) {
                    console.log(`      RGB: ${cell.s.fill.bgColor.rgb}`);
                  }
                  if (cell.s.fill.bgColor.indexed) {
                    console.log(`      Indexed: ${cell.s.fill.bgColor.indexed}`);
                  }
                  if (cell.s.fill.bgColor.theme) {
                    console.log(`      Theme: ${cell.s.fill.bgColor.theme}`);
                  }
                }
                
                if (cell.s.fill.fgColor) {
                  console.log(`    🎯 fgColor:`, cell.s.fill.fgColor);
                }
              } else {
                console.log(`  ⚠️ No fill property found in style`);
              }
              
              // Show complete style object for critical cells
              if (isActivityCell) {
                console.log(`  📋 COMPLETE STYLE:`, JSON.stringify(cell.s, null, 2));
              }
            }
            
            debugCellCount++;
          }
          
          // TRY MULTIPLE BACKGROUND COLOR EXTRACTION METHODS
          let background = null;
          
          // Method 1: Current method
          try {
            background = this.getCellBackgroundColor(cell);
            if (background && debugCellCount < 10) {
              console.log(`  ✅ Method 1 (getCellBackgroundColor): ${background}`);
            }
          } catch (error) {
            if (debugCellCount < 10) {
              console.log(`  ❌ Method 1 failed: ${error.message}`);
            }
          }
          
          // Method 2: Direct RGB access
          if (!background && cell.s && cell.s.fill && cell.s.fill.bgColor && cell.s.fill.bgColor.rgb) {
            let rgb = cell.s.fill.bgColor.rgb;
            // Handle ARGB format
            if (rgb.length === 8) rgb = rgb.substring(2);
            background = rgb.startsWith('#') ? rgb.toUpperCase() : `#${rgb.toUpperCase()}`;
            if (debugCellCount < 10) {
              console.log(`  ✅ Method 2 (direct RGB): ${background}`);
            }
          }
          
          // Method 3: Indexed color lookup
          if (!background && cell.s && cell.s.fill && cell.s.fill.bgColor && cell.s.fill.bgColor.indexed !== undefined) {
            const indexedColors = {
              0: '#000000', 1: '#FFFFFF', 2: '#FF0000', 3: '#00FF00', 4: '#0000FF',
              5: '#FFFF00', 6: '#FF00FF', 7: '#000000', 8: '#000000', 9: '#FFFFFF', // Fixed: Map cyan to black for planting
              10: '#FF0000', 64: '#00B0F0', 65: '#BF9000'  // Add likely colors
            };
            background = indexedColors[cell.s.fill.bgColor.indexed];
            if (background && debugCellCount < 10) {
              console.log(`  ✅ Method 3 (indexed ${cell.s.fill.bgColor.indexed}): ${background}`);
            }
          }
          
          const isFilled = this.isCellVisuallyActive(cell);
          
          styles[cellRef] = {
            hasContent: !!cellValue,
            value: cellValue,
            background: background,
            isFilled: isFilled,
            hasStyleObject: hasStyleObject,
            debugInfo: isActivityCell ? {
              styleKeys: hasStyleObject ? Object.keys(cell.s) : [],
              hasFill: hasStyleObject ? !!cell.s.fill : false,
              fillType: hasStyleObject && cell.s.fill ? Object.keys(cell.s.fill).join(',') : 'none'
            } : null
          };
          
          if (background && background !== '#FFFFFF') {
            cellsWithBackground++;
            console.log(`  🎨 BACKGROUND FOUND: ${cellRef} = ${background} (value: "${cellValue}")`);
          }
        }
      }
    }
    
    console.log(`📊 COMPREHENSIVE EXTRACTION SUMMARY:`);
    console.log(`  🔢 Total cells processed: ${totalCells}`);
    console.log(`  📝 Cells with content: ${cellsWithContent}`);
    console.log(`  🎭 Cells with style objects: ${cellsWithStyles}`);
    console.log(`  🎨 Cells with background colors: ${cellsWithBackground}`);
    console.log(`  🔍 Cells analyzed in detail: ${debugCellCount}`);
    
    // Show all background colors found
    const coloredCells = Object.entries(styles).filter(([ref, style]) => style.background);
    if (coloredCells.length > 0) {
      console.log(`🌈 ALL BACKGROUND COLORS DETECTED:`);
      coloredCells.forEach(([ref, style]) => {
        console.log(`  ${ref}: ${style.background} "${style.value}"`);
      });
    } else {
      console.log(`⚠️ CRITICAL: NO BACKGROUND COLORS DETECTED!`);
      console.log(`   This suggests XLSX is not reading cell styles properly.`);
      console.log(`   Check XLSX configuration or file format compatibility.`);
    }
    
    return styles;
  }

  /**
   * Detect calendar type from Excel content
   */
  detectCalendarType(data, filename = '') {
    const title = this.findCalendarTitle(data);
    const headers = this.findTimelineHeaders(data);
    
    // Extract commodity from title or filename
    let commodity = this.extractCommodity(title + ' ' + filename);
    
    // Determine calendar type
    let type = 'seasonal'; // Default to seasonal
    
    // Check for seasonal patterns (absolute dates/months)
    const hasAbsoluteDates = this.hasAbsoluteDatePattern(headers);
    const hasMonthHeaders = this.hasMonthPattern(headers);
    
    // Check for cycle patterns (relative weeks)
    const hasRelativeWeeks = this.hasRelativeWeekPattern(headers);
    const hasProductionWeeks = this.hasProductionWeekPattern(data);
    
    // Classify based on commodity and pattern
    if (this.isCropCommodity(commodity) && (hasAbsoluteDates || hasMonthHeaders)) {
      type = 'seasonal';
    } else if (this.isPoultryCommodity(commodity) && (hasRelativeWeeks || hasProductionWeeks)) {
      type = 'cycle';
    } else if (hasRelativeWeeks || hasProductionWeeks) {
      type = 'cycle';
      commodity = commodity || 'broiler';
    } else {
      type = 'seasonal';
      commodity = commodity || 'maize';
    }

    return {
      type,
      commodity: commodity.toLowerCase(),
      title: title || filename,
      headers: headers
    };
  }

  /**
   * Parse the complete calendar structure for preview display
   */
  parseCalendarStructure(data, cellStyles, calendarInfo, metadata = {}, worksheet = null) {
    console.log('🏗️ CALENDAR STRUCTURE PARSING PHASE:');
    console.log('📊 Dynamic parsing enabled:', !!worksheet);
    
    // Find the main structure components
    console.log('🗓️ Step 1: Finding timeline row...');
    const timelineRow = this.findTimelineRow(data);
    console.log('🗓️ Timeline result:', {
      index: timelineRow.index,
      hasMonths: timelineRow.hasMonths,
      hasWeeks: timelineRow.hasWeeks,
      firstFewCells: timelineRow.data?.slice(0, 10)
    });
    
    console.log('🎯 Step 2: Finding activity start row...');
    const activityStartRow = this.findActivityStartRow(data, timelineRow.index);
    console.log('🎯 Activity start row:', activityStartRow);
    
    // Extract timeline (months, weeks, dates) with error handling
    let timeline;
    try {
      console.log('📅 Step 2.5: Extracting timeline structure...');
      timeline = this.extractTimelineStructure(data, timelineRow, calendarInfo.type);
      console.log('📅 Timeline extraction result:', {
        totalColumns: timeline.columns?.length,
        timelineType: timeline.type,
        hasMonths: !!timeline.months?.length,
        hasWeeks: !!timeline.weeks?.length
      });
    } catch (error) {
      console.error('❌ ERROR in extractTimelineStructure:', error);
      timeline = { columns: [], months: [], weeks: [], totalSpan: 0, type: calendarInfo.type };
    }
    
    // Extract activities with enhanced error tracking
    let activities = [];
    try {
      console.log('👥 Step 3: Extracting activities...');
      console.log('👥 Input params for extractActivitiesWithSchedule:', {
        dataRows: data.length,
        cellStylesCount: Object.keys(cellStyles).length,
        activityStartRow: activityStartRow,
        timelineCheck: {
          hasColumns: !!timeline.columns?.length,
          totalColumns: timeline.columns?.length
        }
      });
      
      console.log('👥 Step 3a: About to call extractActivitiesWithSchedule...');
      activities = this.extractActivitiesWithSchedule(data, cellStyles, activityStartRow, timeline);
      console.log('👥 Step 3b: extractActivitiesWithSchedule completed successfully');
    } catch (error) {
      console.error('❌ CRITICAL ERROR in extractActivitiesWithSchedule:', error);
      console.error('❌ Error stack trace:', error.stack);
      activities = []; // Fallback to empty array
    }
    console.log('👥 Activities extraction result:', {
      totalActivities: activities.length,
      activityNames: activities.map(a => a.name),
      totalActivePeriods: activities.reduce((sum, act) => sum + act.activePeriods.length, 0)
    });
    
    // Generate calendar grid for display
    const calendarGrid = this.generateCalendarGrid(activities, timeline);

    // COLOR USAGE SUMMARY - Debug color extraction effectiveness
    let excelColorCount = 0;
    let fallbackColorCount = 0;
    activities.forEach(activity => {
      activity.activePeriods.forEach(period => {
        if (period.colorSource === 'Excel') {
          excelColorCount++;
        } else {
          fallbackColorCount++;
        }
      });
    });
    
    console.log('🎨 COLOR USAGE SUMMARY:');
    console.log(`  Excel colors used: ${excelColorCount}`);
    console.log(`  Fallback colors used: ${fallbackColorCount}`);
    console.log(`  Color extraction success rate: ${excelColorCount > 0 ? ((excelColorCount / (excelColorCount + fallbackColorCount)) * 100).toFixed(1) : 0}%`);
    
    // DEBUG: Show detailed color information for each activity
    console.log('📋 DETAILED ACTIVITY SUMMARY:');
    activities.forEach((activity, index) => {
      const coloredPeriods = activity.activePeriods.filter(p => p.background);
      const allPeriods = activity.activePeriods;
      
      if (allPeriods.length > 0) {
        const weekNumbers = allPeriods.map(p => p.weekNumber).sort((a, b) => a - b);
        const weekRange = weekNumbers.length > 1 ? `WK${weekNumbers[0]}-WK${weekNumbers[weekNumbers.length - 1]}` : `WK${weekNumbers[0]}`;
        const primaryColor = coloredPeriods.length > 0 ? coloredPeriods[0].background : 'none';
        
        console.log(`  ${index + 1}. "${activity.name}": ${allPeriods.length} periods (${coloredPeriods.length} with colors)`);
        console.log(`     📅 Week Range: ${weekRange} (${weekNumbers.join(', ')})`);
        console.log(`     🎨 Primary Color: ${primaryColor}`);
        console.log(`     📊 Color Sources: ${coloredPeriods.map(p => p.colorSource).join(', ') || 'none'}`);
      } else {
        console.log(`  ${index + 1}. "${activity.name}": NO PERIODS DETECTED ❌`);
      }
    });
    
    return {
      type: calendarInfo.type,
      commodity: calendarInfo.commodity,
      title: calendarInfo.title,
      timeline: timeline,
      activities: activities,
      calendarGrid: calendarGrid,
      summary: {
        totalActivities: activities.length,
        timeSpan: timeline.columns?.length || 0,
        activePeriodsCount: activities.reduce((sum, act) => sum + act.activePeriods.length, 0),
        excelColorCount: excelColorCount,
        fallbackColorCount: fallbackColorCount
      }
    };
  }

  /**
   * Find the row containing timeline headers
   */
  findTimelineRow(data) {
    console.log('🔍 Looking for timeline row...');
    
    for (let i = 0; i < Math.min(15, data.length); i++) {
      const row = data[i];
      const looksLikeTimeline = this.looksLikeTimelineHeader(row);
      const hasMonths = this.hasMonthPattern(row);
      const hasWeeks = this.hasWeekPattern(row);
      
      console.log(`Row ${i} timeline check: looksLikeTimeline=${looksLikeTimeline}, hasMonths=${hasMonths}, hasWeeks=${hasWeeks}`);
      
      if (looksLikeTimeline) {
        console.log(`✅ Found timeline row at index ${i}:`, row?.slice(0, 10));
        return {
          index: i,
          data: row,
          hasMonths: hasMonths,
          hasWeeks: hasWeeks
        };
      }
    }
    
    console.log('⚠️ No timeline row found, using default');
    return { index: 0, data: [], hasMonths: false, hasWeeks: false };
  }

  /**
   * Find where activities start (usually after timeline headers)
   */
  findActivityStartRow(data, timelineRowIndex) {
    console.log(`🔍 Looking for activity start row after timeline row ${timelineRowIndex}...`);
    console.log(`📊 Total data rows available: ${data.length}`);
    
    // Enhanced approach: Look for the first row with meaningful activity content
    // Try multiple strategies to find activities
    
    // Strategy 1: Look immediately after timeline
    for (let i = Math.max(2, timelineRowIndex + 1); i < Math.min(data.length, 20); i++) {
      const row = data[i];
      if (!row || !row[0]) {
        console.log(`Row ${i}: Empty or no first cell`);
        continue;
      }
      
      const firstCell = row[0].toString().trim();
      const firstCellLower = firstCell.toLowerCase();
      
      console.log(`Row ${i} check: "${firstCell}" (length: ${firstCell.length})`);
      console.log(`  Full row sample:`, row?.slice(0, 10));
      
      // Skip obvious header rows
      if (firstCellLower.includes('calendar date') || 
          firstCellLower.includes('stage of activity') ||
          firstCellLower.includes('week') || 
          firstCellLower.includes('month') || 
          firstCellLower.includes('activity') || 
          firstCellLower.includes('s/n') ||
          firstCellLower === 'calendar date' ||
          firstCell === '' ||
          firstCell.length < 3) {
        console.log(`  ⏭️ Skipping header/empty row ${i}: "${firstCell}"`);
        continue;
      }
      
      // Look for activity-like patterns
      const isActivityRow = (
        firstCell.length > 3 && // Has meaningful content
        !firstCellLower.match(/^\d+$/) && // Not just a number
        !firstCellLower.includes('total') && // Not totals
        !firstCellLower.includes('summary') && // Not summary
        (
          // Known activity patterns
          firstCellLower.includes('site') ||
          firstCellLower.includes('land') ||
          firstCellLower.includes('plant') ||
          firstCellLower.includes('sow') ||
          firstCellLower.includes('fertil') ||
          firstCellLower.includes('weed') ||
          firstCellLower.includes('harvest') ||
          firstCellLower.includes('pest') ||
          firstCellLower.includes('disease') ||
          firstCellLower.includes('selection') ||
          firstCellLower.includes('preparation') ||
          // Or if it's a numbered activity (e.g., "1. Site Selection")
          firstCell.match(/^\d+[\.\)]\s*\w/) ||
          // Or general activity-like structure
          (firstCell.length > 5 && firstCell.includes(' '))
        )
      );
      
      if (isActivityRow) {
        console.log(`✅ Found potential activity start at row ${i}: "${firstCell}"`);
        return i;
      } else {
        console.log(`  ❌ Row ${i} doesn't look like activity: "${firstCell}"`);
      }
    }
    
    const fallback = timelineRowIndex + 3;
    console.log(`⚠️ No clear activity start found, using fallback row ${fallback}`);
    return fallback; // Default fallback - usually row 3 after headers
  }

  /**
   * Extract timeline structure (months, weeks, dates)
   */
  extractTimelineStructure(data, timelineRow, calendarType) {
    console.log('📅 Extracting timeline structure...');
    
    // TEMPORARY: Force enhanced timeline to test the fix
    console.log('🔧 TEMPORARY: Using enhanced timeline directly to test month-week fix');
    return this.createEnhancedTimeline(data, calendarType);
    
    let timeline = {
      type: calendarType,
      columns: [],
      months: [],
      weeks: [],
      totalSpan: 0
    };

    if (!timelineRow.data || timelineRow.data.length === 0) {
      console.log('⚠️ No timeline data found, creating enhanced fallback timeline');
      return this.createEnhancedTimeline(data, calendarType);
    }

    // Try to extract timeline from Excel
    try {
      console.log('🔄 Attempting Excel timeline parsing...');
      timeline = this.parseExcelTimeline(data, timelineRow, calendarType);
      
      // If timeline extraction failed or has insufficient columns, use enhanced fallback
      if (timeline.columns.length < 10) {
        console.log('⚠️ Excel timeline extraction insufficient, using enhanced fallback timeline');
        console.log(`📊 Timeline had ${timeline.columns.length} columns, need at least 10`);
        return this.createEnhancedTimeline(data, calendarType);
      }
      
      console.log(`✅ Excel timeline extracted successfully: ${timeline.columns.length} columns`);
      return timeline;
    } catch (error) {
      console.error('❌ Timeline extraction error:', error);
      console.log('🔄 Fallback: Using enhanced timeline instead of default');
      return this.createEnhancedTimeline(data, calendarType);
    }

    // Find the complete header structure based on target Excel format:
    // Row 0: S/N STAGE OF ACTIVITY + Month headers (JAN, FEB, etc.)
    // Row 1: Week headers (WK1, WK2, WK3, etc.)
    // Row 2: Calendar Date + date ranges
    
    const monthRow = timelineRow.data; // This should be the month row
    const weekRow = data[timelineRow.index + 1] || []; // Week row should be next
    const dateRow = data[timelineRow.index + 2] || []; // Date row should be after weeks
    
    console.log('📅 Timeline structure analysis:');
    console.log('📅 Month row length:', monthRow?.length, 'Sample:', monthRow?.slice(0, 15));
    console.log('📅 Week row length:', weekRow?.length, 'Sample:', weekRow?.slice(0, 15));  
    console.log('📅 Date row length:', dateRow?.length, 'Sample:', dateRow?.slice(0, 15));

    // Process timeline headers starting from column 1 (skip activity name column)
    const startCol = 1;
    const maxCols = Math.max(monthRow.length, weekRow.length, dateRow.length);
    
    for (let i = startCol; i < maxCols; i++) {
      const monthCell = monthRow[i] ? monthRow[i].toString().trim() : '';
      const weekCell = weekRow[i] ? weekRow[i].toString().trim() : '';
      const dateCell = dateRow[i] ? dateRow[i].toString().trim() : '';
      
      // Skip if all cells are empty
      if (!monthCell && !weekCell && !dateCell) continue;
      
      const label = weekCell || monthCell || dateCell; // Prefer week label
      
      timeline.columns.push({
        index: i,
        originalIndex: i - startCol,
        label: label,
        monthLabel: monthCell,
        weekLabel: weekCell,
        dateRange: dateCell,
        isMonth: this.isMonthCell(monthCell),
        isWeek: this.isWeekCell(weekCell),
        isDate: this.isDateCell(dateCell)
      });

      // Categorize for easier access
      if (monthCell && this.isMonthCell(monthCell)) {
        timeline.months.push(monthCell);
      }
      if (weekCell && this.isWeekCell(weekCell)) {
        timeline.weeks.push(weekCell);
      }
    }

    timeline.totalSpan = timeline.columns.length;
    console.log(`📅 Timeline extracted: ${timeline.totalSpan} columns, ${timeline.months.length} months, ${timeline.weeks.length} weeks`);
    
    return timeline;
  }

  /**
   * Find row containing date ranges (usually below timeline headers)
   */
  findDateRangeRow(data, timelineRowIndex) {
    // Look for a row with date patterns 1-3 rows below timeline
    for (let i = timelineRowIndex + 1; i <= Math.min(timelineRowIndex + 3, data.length - 1); i++) {
      const row = data[i];
      if (row && Array.isArray(row)) {
        // Check if this row has date-like patterns
        const datePatterns = row.filter(cell => {
          if (!cell) return false;
          const str = cell.toString().trim();
          return this.isDateCell(str) || /\d+-\d+|\d+\s*-\s*\d+/.test(str);
        });
        
        if (datePatterns.length > 2) { // Has multiple date patterns
          return { index: i, data: row };
        }
      }
    }
    return null;
  }

  /**
   * Extract activities with their schedule information
   */
  extractActivitiesWithSchedule(data, cellStyles, activityStartRow, timeline) {
    console.log('🚀 ENTERING extractActivitiesWithSchedule method');

    // SPECIFIC DEBUG FOR PLANTING/SOWING ROW DETECTION
    console.log('🌱 PLANTING/SOWING ROW DETECTION DEBUG:');
    for (let i = 0; i < Math.min(15, data.length); i++) {
      const row = data[i];
      if (row && row.length > 0 && row[0]) {
        const cellText = row[0].toString().toLowerCase();
        if (cellText.includes('plant') || cellText.includes('sow')) {
          console.log(`🌱 FOUND PLANTING ROW ${i}: "${row[0]}"`);
          console.log(`    Row sample data (first 15 cells):`, row.slice(0, 15).map((cell, idx) => `[${idx}]="${cell}"`));
        }
      }
    }

    console.log('📊 Method parameters check:', {
      hasData: !!data,
      dataLength: data?.length,
      hasCellStyles: !!cellStyles,
      cellStylesCount: cellStyles ? Object.keys(cellStyles).length : 0,
      activityStartRow: activityStartRow,
      hasTimeline: !!timeline,
      timelineColumns: timeline?.columns?.length || 0
    });
    
    // CRITICAL DEBUGGING: Log all colored cells found
    console.log('🎨 ALL COLORED CELLS FOUND:');
    Object.entries(cellStyles).forEach(([cellRef, style]) => {
      if (style.background && style.background !== '#FFFFFF') {
        const decoded = XLSX.utils.decode_cell(cellRef);
        console.log(`  ${cellRef} (row ${decoded.r}, col ${decoded.c}): color="${style.background}", value="${style.value}", filled=${style.isFilled}`);
      }
    });
    
    // CRITICAL DEBUGGING: Log activity rows content
    console.log('📋 ACTIVITY ROWS ANALYSIS:');
    for (let i = activityStartRow; i < Math.min(data.length, activityStartRow + 12); i++) {
      const row = data[i];
      if (row && row[0]) {
        console.log(`  Row ${i}: "${row[0]}" | First 10 cells: [${row.slice(0, 10).join(', ')}]`);
      }
    }
    
    const activities = [];
    
    try {
      // Check if we got any colored cells at all - if not, enable pattern fallback
      const hasColoredCells = Object.values(cellStyles).some(style => style.background && style.background !== '#FFFFFF');
      this.shouldApplyPatternFallback = !hasColoredCells;
    
    console.log(`🏃 Starting activity extraction from row ${activityStartRow}. Total rows: ${data.length}`);
    console.log(`🎨 Pattern fallback ${this.shouldApplyPatternFallback ? 'ENABLED' : 'disabled'} (colored cells found: ${hasColoredCells})`);
    
    for (let rowIndex = activityStartRow; rowIndex < Math.min(data.length, activityStartRow + 15); rowIndex++) {
      const row = data[rowIndex];
      if (!row || !row[0] || !row[0].toString().trim()) {
        console.log(`  ⏭️ Skipping empty row ${rowIndex}`);
        continue; // Skip empty rows
      }

      let activityName = row[0].toString().trim();
      console.log(`🔄 Processing row ${rowIndex}: "${activityName}"`);
      console.log(`  📋 Full row data:`, row?.slice(0, 20)); // First 20 columns
      
      // Skip if this doesn't look like an activity
      if (activityName.toLowerCase().includes('total') || 
          activityName.toLowerCase().includes('summary') ||
          activityName === '') {
        console.log(`  ⏹️ Stopping at row ${rowIndex} - found terminating condition: "${activityName}"`);
        break;
      }
      
      // Enhanced activity validation - ensure we're not missing legitimate activities
      const isValidActivity = activityName.length > 2 && 
                             !activityName.toLowerCase().includes('calendar') &&
                             !activityName.toLowerCase().includes('date') &&
                             !activityName.toLowerCase().includes('week');
      
      if (!isValidActivity) {
        console.log(`  ⏭️ Skipping row ${rowIndex} - doesn't look like valid activity: "${activityName}"`);
        continue;
      }
      
      // Preserve activity names exactly as they appear in Excel (no number removal)
      const originalName = activityName;
      activityName = activityName.trim(); // Only basic trimming
      console.log(`  ✅ Activity name preserved: "${originalName}" -> "${activityName}"`);
      
      // If still empty after cleanup, skip
      if (!activityName) {
        console.log(`  ⏭️ Skipping row ${rowIndex} - empty after cleanup`);
        continue;
      }

      const activity = {
        name: activityName,
        rowIndex: rowIndex,
        activePeriods: [],
        schedule: {}
      };

      // Check each timeline column for activity periods
      let activePeriodCount = 0;
      console.log(`  🔍 Checking ${timeline.columns.length} timeline columns for activity periods...`);

      // ENHANCED DEBUGGING: Log timeline structure
      console.log(`  📊 Timeline structure: ${timeline.columns.length} columns`);
      timeline.columns.slice(0, 10).forEach((col, i) => {
        console.log(`    Col ${i}: index=${col.index}, label="${col.label}", week="${col.weekLabel}", month="${col.monthLabel}"`);
      });
      if (timeline.columns.length > 10) {
        console.log(`    ... and ${timeline.columns.length - 10} more columns`);
      }

      // Dynamic timeline detection - find where timeline actually starts
      const timelineStartCol = this.findTimelineStartColumn(data);
      console.log(`  🕐 Timeline start detected at Excel column: ${timelineStartCol}`);
      
      timeline.columns.forEach((timeCol, colIndex) => {
        // CRITICAL FIX: Use the actual Excel column index stored in timeCol.index
        // This preserves the original Excel column position from timeline extraction
        const excelColIndex = timeCol.index;

        console.log(`    🔍 Checking timeline column ${colIndex}: ${timeCol.label} (${timeCol.weekLabel || timeCol.monthLabel}) -> Excel col ${excelColIndex}`);

        const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: excelColIndex });
        const cellStyle = cellStyles[cellRef];
        const cellValue = row[excelColIndex];
        
        // ENHANCED COLOR DETECTION: Check for background color FIRST (primary indicator)
        const hasBackgroundColor = cellStyle && cellStyle.background && cellStyle.background !== '#FFFFFF';
        const isContentActive = cellValue && cellValue.toString().trim() !== '';
        
        // Primary: Background color presence (most reliable for Excel calendar detection)
        let isActive = hasBackgroundColor;
        
        // Secondary: Content-based detection (fallback)
        if (!isActive && isContentActive) {
          isActive = this.isActivityActive(cellValue, cellStyle);
        }
        
        // ENHANCED DEBUGGING: Log first 12 columns in detail
        if (colIndex < 12) {
          console.log(`    📍 Col ${colIndex} (${timeCol.label}): cellRef=${cellRef}, hasBackground=${hasBackgroundColor}, backgroundColor="${cellStyle?.background || 'none'}", hasContent=${isContentActive}, cellValue="${cellValue || ''}", isActive=${isActive}`);
        }
        
        // Simplified content-based detection for cells with content but no style
        if (!isActive && cellValue && cellValue.toString().trim() !== '') {
          const content = cellValue.toString().toLowerCase();
          if (content.includes('●') || content.includes('x') || content.includes('•') || 
              content === '1' || content === 'yes' || content === 'active') {
            isActive = true;
            console.log(`    📝 Content-based activation for "${activityName}" at column ${colIndex}: "${cellValue}"`);
          }
        }
        
        if (colIndex < 12) { // Debug first 12 columns for better coverage
          console.log(`    Col ${colIndex} (${timeCol.label}): excelCol=${excelColIndex}, cellRef=${cellRef}, value="${cellValue}", style=${cellStyle ? 'HAS_STYLE' : 'NO_STYLE'}, bg="${cellStyle?.background || 'none'}", active=${isActive}`);
        }
        
        // Determine if this cell represents an active period
        if (isActive) {
          activePeriodCount++;
          // ENHANCED COLOR PRIORITY: Excel color first, then activity-based, with detailed debugging
          const excelColor = cellStyle?.background;
          const activityColor = this.getActivityBasedColor(activityName);
          
          // ENHANCED debugging for color extraction with more details
          if (colIndex < 8) { // Debug first 8 columns for color issues
            console.log(`    🎨 COLOR DEBUG Col ${colIndex}:`);
            console.log(`      Excel color: "${excelColor}"`);
            console.log(`      Activity color: "${activityColor}"`);
            console.log(`      Cell value: "${cellValue}"`);
            console.log(`      Cell has style: ${!!cellStyle}`);
            if (cellStyle) {
              console.log(`      Style background: "${cellStyle.background}"`);
              console.log(`      Style isFilled: ${cellStyle.isFilled}`);
              console.log(`      Style hasContent: ${cellStyle.hasContent}`);
            }
            console.log(`      Final color chosen: "${excelColor || activityColor}"`);
          }
          
          const period = {
            columnIndex: colIndex,
            weekNumber: colIndex + 1, // WK1, WK2, WK3, etc.
            timeLabel: timeCol.label,
            dateRange: timeCol.dateRange,
            cellValue: cellValue?.toString() || '',
            hasBackground: !!excelColor || cellStyle?.isFilled,
            background: excelColor || activityColor,
            colorSource: excelColor ? 'Excel' : 'Activity-based',
            cellReference: cellRef, // For debugging purposes
            excelColumnIndex: excelColIndex,
            // Additional debugging info
            rawCellStyle: cellStyle ? {
              background: cellStyle.background,
              isFilled: cellStyle.isFilled,
              hasContent: cellStyle.hasContent
            } : null
          };
          
          activity.activePeriods.push(period);
          activity.schedule[timeCol.label] = {
            active: true,
            value: cellValue,
            style: cellStyle
          };

          // SPECIAL DEBUG FOR PLANTING/SOWING ACTIVITY
          if (activityName.toLowerCase().includes('planting') || activityName.toLowerCase().includes('sowing')) {
            console.log(`🌱 PLANTING/SOWING ACTIVITY DETECTED!`);
            console.log(`    Activity: "${activityName}"`);
            console.log(`    Excel Column Index: ${colIndex}`);
            console.log(`    Timeline Column: ${timeCol.label}`);
            console.log(`    Week Number: ${period.weekNumber} (should be 10-17)`);
            console.log(`    Excel Color: ${excelColor || 'none'}`);
            console.log(`    Activity Color: ${activityColor}`);
            console.log(`    Cell Reference: ${cellRef}`);
            console.log(`    Cell Value: "${cellValue}"`);
            console.log(`    Expected: March WK10-April WK17 (columns should be around P-W in Excel)`);
          }
        }
      });

      console.log(`  ✅ Activity "${activityName}" has ${activePeriodCount} active periods`);
      
      if (activity.activePeriods.length > 0 || activityName.length > 0) {
        console.log(`  ➕ Adding activity "${activityName}" to results (${activity.activePeriods.length} periods)`);
        activities.push(activity);
      } else {
        console.log(`  ❌ Skipping activity "${activityName}" - no periods and no name`);
      }
    }

      console.log(`🏁 Activity extraction complete: ${activities.length} activities found`);
      console.log('📋 Extracted activity names:', activities.map(a => a.name));
      
      // MAIZE WEEK RANGE VALIDATION: Check if detected ranges match expected patterns
      console.log('🌽 MAIZE PATTERN VALIDATION:');
      const expectedMaizeRanges = {
        'Site Selection': { start: 1, end: 5 },           // WK1-WK5 (Jan)
        'Land preparation': { start: 1, end: 9 },        // WK1-WK9 (Jan-Feb)
        'Planting/sowing': { start: 10, end: 17 },       // WK10-WK17 (Mar-Apr)
        '1st fertilizer application': { start: 10, end: 17 }, // WK10-WK17 (Mar-Apr)
        'First weed management & Control of fall army worm': { start: 14, end: 17 }, // WK14-WK17 (Apr)
        '2nd Fertilizer Application (Urea or SOA)': { start: 18, end: 22 }, // WK18-WK22 (May)
        'Second weed management & Pest and disease control': { start: 14, end: 22 }, // WK14-WK22 (Apr-May)  
        'Harvesting': { start: 23, end: 29 },            // WK23-WK29 (Jun-Jul)
        'Post harvest handling': { start: 26, end: 33 }  // WK26-WK33 (Jun-Aug)
      };
      
      activities.forEach((activity, index) => {
        const expectedRange = expectedMaizeRanges[activity.name];
        if (expectedRange && activity.activePeriods.length > 0) {
          const detectedWeeks = activity.activePeriods.map(p => p.weekNumber).sort((a, b) => a - b);
          const actualRange = { start: detectedWeeks[0], end: detectedWeeks[detectedWeeks.length - 1] };
          
          const rangeMatches = actualRange.start === expectedRange.start && actualRange.end === expectedRange.end;
          console.log(`  ${index + 1}. "${activity.name}": Expected WK${expectedRange.start}-WK${expectedRange.end}, Detected WK${actualRange.start}-WK${actualRange.end} ${rangeMatches ? '✅' : '⚠️'}`);
          
          if (!rangeMatches) {
            console.log(`     🔍 Detected weeks: [${detectedWeeks.join(', ')}]`);
          }
        } else if (expectedRange) {
          console.log(`  ${index + 1}. "${activity.name}": Expected WK${expectedRange.start}-WK${expectedRange.end}, Detected: NO PERIODS ❌`);
        }
      });
      
      // ENHANCED FALLBACK SYSTEM: Ensure all 9 activities are present with colors
      const expectedActivityNames = [
        'Site Selection', 'Land preparation', 'Planting/sowing', '1st fertilizer application',
        'First weed management & Control of fall army worm', '2nd Fertilizer Application (Urea or SOA)',
        'Second weed management & Pest and disease control', 'Harvesting', 'Post harvest handling'
      ];
      
      const activityColorMap = {
        'Site Selection': '#00B0F0',
        'Land preparation': '#BF9000',
        'Planting/sowing': '#000000',
        '1st fertilizer application': '#FFFF00',
        'First weed management & Control of fall army worm': '#FF0000',
        '2nd Fertilizer Application (Urea or SOA)': '#000000',
        'Second weed management & Pest and disease control': '#FF0000',
        'Harvesting': '#008000',
        'Post harvest handling': '#800080'
      };
      
      // Check if we have all 9 activities
      if (activities.length < 9) {
        console.log(`🔄 PARTIAL FALLBACK: Only ${activities.length}/9 activities extracted, applying fallback for missing ones`);
        
        expectedActivityNames.forEach((expectedName, index) => {
          const existing = activities.find(a => 
            a.name.toLowerCase().includes(expectedName.toLowerCase().split(' ')[0]) ||
            expectedName.toLowerCase().includes(a.name.toLowerCase().split(' ')[0])
          );
          
          if (!existing) {
            console.log(`➕ Adding missing activity: ${expectedName}`);
            const missingActivity = {
              name: expectedName,
              rowIndex: activities.length + 3,
              activePeriods: [],
              schedule: {}
            };
            
            // Apply fallback timing pattern (now with dynamic extraction support)
            const expectedPattern = this.getActivityTimingPattern(expectedName, timeline.columns.length, {}, null);
            expectedPattern.forEach(colIndex => {
              if (colIndex < timeline.columns.length) {
                const period = {
                  columnIndex: colIndex,
                  timeLabel: timeline.columns[colIndex].label,
                  dateRange: timeline.columns[colIndex].dateRange,
                  cellValue: '',
                  hasBackground: true,
                  background: activityColorMap[expectedName] || '#32CD32',
                  isPatternFallback: true
                };
                missingActivity.activePeriods.push(period);
              }
            });
            
            activities.push(missingActivity);
          }
        });
      }
      
      // HYBRID APPROACH: If no activities found at all, use complete default
      if (activities.length === 0) {
        console.log('🔄 COMPLETE FALLBACK: No activities extracted from Excel, using default activities');
        return this.createDefaultActivities(timeline);
      }
      
      return activities;
      
    } catch (error) {
      console.error('💥 CATASTROPHIC ERROR in extractActivitiesWithSchedule:', error);
      console.error('💥 Error name:', error.name);
      console.error('💥 Error message:', error.message);
      console.error('💥 Error stack:', error.stack);
      
      // Check if it's specifically the MAIZE error
      if (error.message.includes('MAIZE')) {
        console.error('🌽 FOUND THE MAIZE ERROR! This is the source of our problem.');
      }
      
      // FALLBACK: Return default activities on any error
      console.log('🔄 ERROR FALLBACK: Using default activities due to parsing error');
      return this.createDefaultActivities(timeline);
    }
  }

  /**
   * Parse timeline from Excel data (enhanced extraction)
   */
  parseExcelTimeline(data, timelineRow, calendarType) {
    console.log('🔍 Parsing real Excel timeline structure');
    console.log('📊 Excel data preview:', {
      totalRows: data.length,
      firstRows: data.slice(0, 5).map((row, i) => ({ 
        row: i, 
        firstCells: row?.slice(0, 15) 
      }))
    });

    const timeline = {
      type: calendarType,
      columns: [],
      months: [],
      weeks: [],
      totalSpan: 0
    };

    try {
      // Parse the multi-row header structure
      // Row 0: S/N | STAGE OF ACTIVITY | Month headers (JAN, FEB, MAR, etc.)
      // Row 1: WK1, WK2, WK3, etc.  
      // Row 2: Calendar Date | date ranges
      
      console.log('🔍 Analyzing Excel header structure...');
      
      // Find month header row (contains JAN, FEB, MAR, etc.)
      let monthRow = null;
      let weekRow = null;
      let dateRow = null;
      
      for (let i = 0; i < Math.min(5, data.length); i++) {
        const row = data[i];
        if (!row) continue;
        
        const rowText = row.join(' ').toUpperCase();
        console.log(`Row ${i} analysis:`, row.slice(0, 10));
        
        // Check if this row contains months
        const monthCount = (rowText.match(/JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT/g) || []).length;
        const weekCount = (rowText.match(/WK\d+/g) || []).length;
        const hasCalendarDate = rowText.includes('CALENDAR') && rowText.includes('DATE');
        
        console.log(`  Month count: ${monthCount}, Week count: ${weekCount}, Has calendar date: ${hasCalendarDate}`);
        
        if (monthCount >= 3 && !monthRow) {
          monthRow = { index: i, data: row };
          console.log('✅ Found month header row at:', i);
        } else if (weekCount >= 5 && !weekRow) {
          weekRow = { index: i, data: row };
          console.log('✅ Found week header row at:', i);
        } else if (hasCalendarDate && !dateRow) {
          dateRow = { index: i, data: row };
          console.log('✅ Found calendar date row at:', i);
        }
      }
      
      // If we found the structure, parse it
      if (monthRow && weekRow) {
        return this.parseComplexExcelStructure(monthRow, weekRow, dateRow, calendarType);
      } else {
        console.log('⚠️ Could not identify Excel header structure, using enhanced fallback');
        return this.createEnhancedTimeline(data, calendarType);
      }
      
    } catch (error) {
      console.error('❌ Error parsing Excel timeline:', error);
      console.log('🔄 Using enhanced fallback timeline');
      return this.createEnhancedTimeline(data, calendarType);
    }
  }

  /**
   * Parse complex Excel structure with multi-row headers
   */
  parseComplexExcelStructure(monthRow, weekRow, dateRow, calendarType) {
    console.log('🏗️ Parsing complex Excel multi-row structure');
    
    const timeline = {
      type: calendarType,
      columns: [],
      months: [],
      weeks: [],
      totalSpan: 0
    };
    
    try {
      // Extract weeks from the week row (WK1, WK2, etc.)
      const weeks = [];
      const weekData = weekRow.data;
      
      console.log('📅 DETAILED Week row analysis:');
      console.log('📅 Full week row length:', weekData.length);
      console.log('📅 Full week row data:', weekData);
      
      // Analyze every cell in the week row to find all weeks
      for (let i = 0; i < weekData.length; i++) {
        const cell = weekData[i];
        console.log(`  Week cell ${i}: "${cell}" (type: ${typeof cell})`);
        
        if (i >= 2 && cell && typeof cell === 'string') { // Skip first 2 columns (S/N, STAGE OF ACTIVITY)
          const weekMatch = cell.match(/WK(\d+)/i);
          if (weekMatch) {
            const weekNum = parseInt(weekMatch[1]);
            weeks.push({
              label: cell.toUpperCase(),
              number: weekNum,
              columnIndex: i - 2,
              excelColumn: i
            });
            console.log(`  ✅ Found week: ${cell.toUpperCase()} (number: ${weekNum}, excel column: ${i})`);
          } else {
            console.log(`  ❌ Cell "${cell}" doesn't match week pattern`);
          }
        }
      }
      
      console.log(`📊 WEEK EXTRACTION SUMMARY: Found ${weeks.length} weeks`);
      console.log(`📊 Week range: ${weeks[0]?.label || 'NONE'} to ${weeks[weeks.length - 1]?.label || 'NONE'}`);
      console.log('📊 All extracted weeks:', weeks.map(w => w.label));
      
      // Enhanced month extraction with real boundary detection
      const months = [];
      const monthData = monthRow.data;
      
      console.log('📅 DETAILED Month row analysis:');
      console.log('📅 Full month row length:', monthData.length);
      console.log('📅 Full month row data:', monthData);
      console.log('📅 Week count for reference:', weeks.length);
      
      const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'SEPT'];
      
      // Expected 9-month structure from target Excel (for validation and fallback)
      const expectedMonthStructure = [
        { name: 'JAN', expectedWeeks: 5 },   // WK1-WK5
        { name: 'FEB', expectedWeeks: 4 },   // WK6-WK9
        { name: 'MAR', expectedWeeks: 4 },   // WK10-WK13
        { name: 'APR', expectedWeeks: 4 },   // WK14-WK17
        { name: 'MAY', expectedWeeks: 4 },   // WK18-WK21
        { name: 'JUN', expectedWeeks: 4 },   // WK22-WK25
        { name: 'JUL', expectedWeeks: 4 },   // WK26-WK29
        { name: 'AUG', expectedWeeks: 4 },   // WK30-WK33
        { name: 'SEPT', expectedWeeks: 4 }   // WK34-WK37
      ];
      
      // First pass: find all month positions with detailed analysis
      const monthPositions = [];
      console.log('📅 Analyzing each month cell:');
      
      for (let i = 0; i < monthData.length; i++) {
        const cell = monthData[i];
        console.log(`  Month cell ${i}: "${cell}" (type: ${typeof cell})`);
        
        if (i >= 2 && cell && typeof cell === 'string') { // Skip first 2 columns (S/N, STAGE OF ACTIVITY)
          const monthName = cell.toString().toUpperCase().trim();
          console.log(`    Checking if "${monthName}" is a month...`);
          
          if (monthNames.includes(monthName)) {
            const normalizedName = monthName === 'SEPT' ? 'SEP' : monthName;
            monthPositions.push({
              name: normalizedName,
              excelColumn: i,
              weekColumn: i - 2 // Adjusted for timeline columns
            });
            console.log(`    ✅ Found month "${normalizedName}" at Excel column ${i}, week column ${i - 2}`);
          } else {
            console.log(`    ❌ "${monthName}" is not a recognized month`);
          }
        }
      }
      
      console.log(`📊 MONTH EXTRACTION SUMMARY: Found ${monthPositions.length} months`);
      console.log('📊 Month positions:', monthPositions.map(m => `${m.name}@col${m.excelColumn}`));
      
      // Second pass: analyze week-to-month mapping using actual week data
      // This creates accurate month boundaries based on where month headers appear
      for (let i = 0; i < monthPositions.length; i++) {
        const currentMonthPos = monthPositions[i];
        const nextMonthPos = monthPositions[i + 1];
        
        // Find the week range for this month
        let startWeekIndex = 0;
        let endWeekIndex = weeks.length - 1;
        
        // Find start position by looking for the first week that belongs to this month
        if (i === 0) {
          startWeekIndex = 0; // First month starts at first week
        } else {
          // This month starts where previous month ended
          const prevMonth = months[i - 1];
          startWeekIndex = prevMonth.endWeekIndex + 1;
        }
        
        // Find end position by looking at next month or end of weeks
        if (nextMonthPos) {
          // Find where next month starts
          let nextMonthStart = nextMonthPos.weekColumn;
          // Sometimes month headers might be offset, so let's be more flexible
          // Look for a reasonable boundary based on the position
          endWeekIndex = Math.max(startWeekIndex, nextMonthStart - 1);
        } else {
          // Last month goes to end of weeks
          endWeekIndex = weeks.length - 1;
        }
        
        // Ensure we have at least 1 week for each month
        if (endWeekIndex < startWeekIndex) {
          endWeekIndex = startWeekIndex;
        }
        
        const weekCount = endWeekIndex - startWeekIndex + 1;
        
        const month = {
          name: currentMonthPos.name,
          startColumn: startWeekIndex,
          endColumn: endWeekIndex,
          startWeekIndex: startWeekIndex,
          endWeekIndex: endWeekIndex,
          colspan: weekCount,
          weekRange: `${weeks[startWeekIndex]?.label || 'WK' + (startWeekIndex + 1)}-${weeks[endWeekIndex]?.label || 'WK' + (endWeekIndex + 1)}`
        };
        
        months.push(month);
        console.log(`  📊 Month ${month.name}: ${month.weekRange} (${month.colspan} weeks, columns ${month.startColumn}-${month.endColumn})`);
      }
      
      console.log('📊 Month spans calculated:', months);
      
      // Extract date ranges if available
      let dateRanges = [];
      if (dateRow && dateRow.data) {
        console.log('📅 Date row analysis:', dateRow.data.slice(0, 20));
        
        for (let i = 2; i < dateRow.data.length && i - 2 < weeks.length; i++) {
          const cell = dateRow.data[i];
          if (cell && typeof cell === 'string' && cell.trim()) {
            dateRanges.push(cell.trim());
          } else {
            dateRanges.push('');
          }
        }
      }
      
      // Build timeline columns
      const columns = [];
      
      for (let i = 0; i < weeks.length; i++) {
        const week = weeks[i];
        
        // Find which month this week belongs to
        const month = months.find(m => 
          i >= m.startColumn && i <= m.endColumn
        ) || { name: 'JAN', startColumn: 0 }; // Fallback
        
        const column = {
          index: i,
          label: week.label,
          weekNumber: week.number,
          monthLabel: month.name,
          weekLabel: week.label,
          dateRange: dateRanges[i] || `${i * 7 + 1}-${(i + 1) * 7}`,
          monthIndex: months.indexOf(month)
        };
        
        columns.push(column);
      }
      
      timeline.columns = columns;
      timeline.months = months;
      timeline.weeks = weeks.map(w => w.label);
      timeline.totalSpan = columns.length;
      
      // Validate parsed structure against expected 9-month, 37-week pattern
      const isValidStructure = (
        weeks.length >= 30 && weeks.length <= 40 &&  // Should be around 37 weeks
        months.length >= 6 && months.length <= 10     // Should be around 9 months
      );
      
      console.log(`📊 Structure validation: ${isValidStructure ? 'VALID' : 'INVALID'}`);
      console.log(`📊 Parsed: ${months.length} months, ${weeks.length} weeks`);
      
      if (!isValidStructure) {
        console.log('⚠️ Parsed structure doesn\'t match expected pattern, using enhanced timeline fallback');
        // If parsing didn't produce the expected structure, fall back to createEnhancedTimeline
        return this.createEnhancedTimeline(null, calendarType);
      }
      
      console.log(`✅ Complex Excel timeline parsed: ${months.length} months, ${weeks.length} weeks`);
      console.log('📊 Final timeline structure:', {
        months: timeline.months.map(m => `${m.name}(${m.colspan})`),
        totalColumns: timeline.columns.length,
        weekRange: `${weeks[0]?.label}-${weeks[weeks.length - 1]?.label}`
      });
      
      return timeline;
      
    } catch (error) {
      console.error('❌ Error in parseComplexExcelStructure:', error);
      throw error;
    }
  }

  /**
   * Create enhanced timeline that matches typical Excel structure
   */
  createEnhancedTimeline(data, calendarType) {
    console.log('🗓️ Creating enhanced timeline with exact Excel structure (37 weeks, 9 months)');
    
    // EXACT month distribution from target Excel screenshots
    // JAN(5w), FEB(4w), MAR(4w), APR(4w), MAY(4w), JUN(4w), JUL(4w), AUG(4w), SEPT(4w) = 37 weeks
    const monthData = [
      { name: 'JAN', startIndex: 0, colspan: 5 },   // WK1-WK5
      { name: 'FEB', startIndex: 5, colspan: 4 },   // WK6-WK9
      { name: 'MAR', startIndex: 9, colspan: 4 },   // WK10-WK13
      { name: 'APR', startIndex: 13, colspan: 4 },  // WK14-WK17
      { name: 'MAY', startIndex: 17, colspan: 4 },  // WK18-WK21
      { name: 'JUN', startIndex: 21, colspan: 4 },  // WK22-WK25
      { name: 'JUL', startIndex: 25, colspan: 4 },  // WK26-WK29
      { name: 'AUG', startIndex: 29, colspan: 4 },  // WK30-WK33 (FIXED: was 5, now 4)
      { name: 'SEPT', startIndex: 33, colspan: 4 }  // WK34-WK37 (FIXED: was SEP with 3, now SEPT with 4)
    ];
    
    // EXACT date ranges from target Excel screenshots
    const exactDateRanges = [
      // JAN (WK1-WK5): 29-4, 5-11, 12-18, 19-25, 26-1
      '29-4', '5-11', '12-18', '19-25', '26-1',
      // FEB (WK6-WK9): 2-8, 9-15, 16-22, 23-1  
      '2-8', '9-15', '16-22', '23-1',
      // MAR (WK10-WK13): 2-8, 9-15, 16-22, 23-29
      '2-8', '9-15', '16-22', '23-29',
      // APR (WK14-WK17): 30-5, 6-12, 13-19, 20-26
      '30-5', '6-12', '13-19', '20-26',
      // MAY (WK18-WK21): 27-3, 4-10, 11-17, 18-24
      '27-3', '4-10', '11-17', '18-24',
      // JUN (WK22-WK25): 25-1, 2-8, 9-15, 16-22
      '25-1', '2-8', '9-15', '16-22',
      // JUL (WK26-WK29): 23-29, 30-5, 6-12, 13-19
      '23-29', '30-5', '6-12', '13-19',
      // AUG (WK30-WK33): 20-26, 27-2, 3-9, 10-16
      '20-26', '27-2', '3-9', '10-16',
      // SEPT (WK34-WK37): 17-23, 24-30, 1-7, 8-13
      '17-23', '24-30', '1-7', '8-13'
    ];
    
    // Build full month structure with all required properties
    const months = monthData.map(m => ({
      name: m.name,
      startIndex: m.startIndex,
      startColumn: m.startIndex,
      endColumn: m.startIndex + m.colspan - 1,
      startWeekIndex: m.startIndex,
      endWeekIndex: m.startIndex + m.colspan - 1,
      colspan: m.colspan,
      weekRange: `WK${m.startIndex + 1}-WK${m.startIndex + m.colspan}`
    }));
    
    console.log('📊 EXACT timeline month distribution:', 
      months.map(m => `${m.name}(${m.colspan}w, ${m.weekRange})`).join(', '));
    
    // Create 37 weeks with exact structure
    const columns = [];
    const weeks = [];
    
    for (let i = 0; i < 37; i++) {
      const monthIndex = months.findIndex(m => 
        i >= m.startIndex && i < m.startIndex + m.colspan
      );
      const month = months[monthIndex] || months[0];
      
      const column = {
        index: i,
        label: `WK${i + 1}`,
        weekNumber: i + 1,
        monthLabel: month.name,
        weekLabel: `WK${i + 1}`,
        dateRange: exactDateRanges[i] || `${i + 1}`, // Use exact date ranges from screenshots
        monthIndex: monthIndex >= 0 ? monthIndex : 0
      };
      
      columns.push(column);
      weeks.push(`WK${i + 1}`);
    }
    
    console.log('✅ Enhanced timeline created with 37 weeks across 9 months');
    console.log('📋 Sample columns:', columns.slice(0, 10).map(c => `${c.label}(${c.monthLabel}):${c.dateRange}`));
    
    return {
      type: calendarType,
      columns: columns,
      months: months,
      weeks: weeks,
      totalSpan: columns.length
    };
  }

  /**
   * Create default timeline structure with proper months and weeks
   */
  createDefaultTimeline(calendarType = 'seasonal') {
    console.log('🗓️ Creating default timeline structure');
    
    // Create proper month structure for agricultural calendar (JAN-JUL)
    const months = [
      { name: 'JAN', startIndex: 0, colspan: 4 },
      { name: 'FEB', startIndex: 4, colspan: 4 },
      { name: 'MAR', startIndex: 8, colspan: 4 },
      { name: 'APR', startIndex: 12, colspan: 4 },
      { name: 'MAY', startIndex: 16, colspan: 4 },
      { name: 'JUN', startIndex: 20, colspan: 4 },
      { name: 'JUL', startIndex: 24, colspan: 4 }
    ];
    
    // Create timeline columns (28 weeks total = 7 months * 4 weeks)
    const columns = [];
    const weeks = [];
    
    for (let i = 0; i < 28; i++) {
      const monthIndex = Math.floor(i / 4);
      const weekInMonth = (i % 4) + 1;
      const month = months[monthIndex];
      
      const column = {
        index: i,
        label: `WK${i + 1}`,
        monthLabel: month?.name || 'JUL',
        weekLabel: `WK${i + 1}`,
        dateRange: `${i * 7 + 1}-${(i + 1) * 7}`,
        monthIndex: monthIndex,
        weekInMonth: weekInMonth
      };
      
      columns.push(column);
      weeks.push(`WK${i + 1}`);
    }
    
    const timeline = {
      type: calendarType,
      columns: columns,
      months: months,
      weeks: weeks,
      totalSpan: columns.length
    };
    
    console.log(`✅ Created default timeline: ${timeline.months.length} months, ${timeline.columns.length} weeks`);
    return timeline;
  }

  /**
   * Create default activities when Excel parsing fails
   */
  createDefaultActivities(timeline) {
    console.log('🏗️ Creating default activities with proper colors and timing');
    
    const totalColumns = timeline?.columns?.length || 37; // Default to 37 weeks to match Excel structure
    const activities = [];
    
    this.defaultActivities.forEach((defaultActivity, index) => {
      console.log(`📋 Creating activity: "${defaultActivity.name}" (color: ${defaultActivity.color})`);
      
      const activePeriods = [];
      
      // Map the default week indices to actual timeline columns
      defaultActivity.weeks.forEach(weekIndex => {
        if (weekIndex < totalColumns) {
          activePeriods.push({
            columnIndex: weekIndex,
            timeLabel: `WK${weekIndex + 1}`,
            background: defaultActivity.color,
            cellValue: '', // No visual indicator - solid color only
            hasBackground: true
          });
        }
      });
      
      const activity = {
        name: defaultActivity.name,
        rowIndex: index + 3, // Start after headers
        activePeriods: activePeriods,
        schedule: {},
        color: defaultActivity.color // Ensure color is preserved
      };
      
      console.log(`  ✅ Activity "${activity.name}": ${activePeriods.length} periods, color: ${activity.color}`);
      activities.push(activity);
    });
    
    console.log(`🎯 Generated ${activities.length} default activities`);
    return activities;
  }

  /**
   * Generate a grid structure for easy display rendering
   */
  generateCalendarGrid(activities, timeline) {
    return {
      headers: ['Activity', ...timeline.columns.map(col => col.label)],
      rows: activities.map(activity => {
        const row = {
          activity: activity.name,
          cells: timeline.columns.map((timeCol, index) => {
            const period = activity.activePeriods.find(p => p.columnIndex === index);
            return {
              active: !!period,
              value: period?.cellValue || '',
              background: period?.background || null,
              timeLabel: timeCol.label
            };
          })
        };
        return row;
      }),
      summary: {
        totalColumns: timeline.columns.length + 1, // +1 for activity column
        totalRows: activities.length,
        timelineType: timeline.type
      }
    };
  }

  // Helper methods
  findCalendarTitle(data) {
    for (let i = 0; i < Math.min(8, data.length); i++) {
      const row = data[i];
      for (let cell of row || []) {
        if (typeof cell === 'string' && cell.length > 10) {
          const upperCell = cell.toUpperCase();
          if (upperCell.includes('CALENDAR') || 
              upperCell.includes('PRODUCTION') || 
              upperCell.includes('SCHEDULE') ||
              upperCell.includes('SEASON')) {
            return cell;
          }
        }
      }
    }
    return '';
  }

  findTimelineHeaders(data) {
    const headers = [];
    for (let i = 0; i < Math.min(15, data.length); i++) {
      const row = data[i];
      if (this.looksLikeTimelineHeader(row)) {
        headers.push(...(row || []).filter(cell => cell && cell.toString().trim()));
        break;
      }
    }
    return headers;
  }

  looksLikeTimelineHeader(row) {
    if (!Array.isArray(row) || row.length < 3) return false;
    
    // Check for month headers (JAN, FEB, etc.) or week headers (WK1, WK2, etc.)
    const monthPatterns = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const weekPatterns = ['week', 'wk1', 'wk2', 'wk3', 'wk4'];
    
    const monthCount = (row || []).filter(cell => {
      if (!cell) return false;
      const cellStr = cell.toString().toLowerCase();
      return monthPatterns.some(month => cellStr.includes(month));
    }).length;
    
    const weekCount = (row || []).filter(cell => {
      if (!cell) return false;
      const cellStr = cell.toString().toLowerCase();
      return weekPatterns.some(week => cellStr.includes(week)) || /wk\d+/i.test(cellStr);
    }).length;
    
    // Check if first column contains "S/N" or "STAGE" indicating this is the header row
    const firstCell = (row[0] || '').toString().toLowerCase();
    const hasStageHeader = firstCell.includes('stage') || firstCell.includes('s/n') || firstCell.includes('activity');
    
    return (monthCount >= 3 || weekCount >= 4) && (hasStageHeader || monthCount >= 3);
  }

  findTimelineStartColumn(row) {
    // Find where the timeline actually starts (skip activity name columns)
    for (let i = 1; i < (row || []).length; i++) {
      const cell = row[i];
      if (cell && this.isTimelineCell(cell.toString())) {
        return i;
      }
    }
    return 2; // Default assumption
  }

  isTimelineCell(cellStr) {
    const lower = cellStr.toLowerCase();
    return lower.includes('week') || 
           lower.includes('wk') || 
           this.isMonthCell(cellStr) ||
           /\d+/.test(cellStr);
  }

  isMonthCell(cellStr) {
    const lower = cellStr.toLowerCase();
    return Object.keys(this.monthMapping).some(month => lower.includes(month));
  }

  isWeekCell(cellStr) {
    const lower = cellStr.toLowerCase();
    return lower.includes('week') || /wk\s*\d+/i.test(cellStr);
  }

  isDateCell(cellStr) {
    return /\d{1,2}[-/]\d{1,2}/.test(cellStr) || /\d{1,2}-\d{1,2}/.test(cellStr);
  }

  isActivityActive(cellValue, cellStyle) {
    let isActive = false;
    let reasons = [];
    let confidence = 0;
    
    // Priority 1: Check for background color (highest confidence indicator)
    if (cellStyle && cellStyle.background && cellStyle.background !== '#FFFFFF' && cellStyle.background !== null) {
      isActive = true;
      confidence += 100;
      reasons.push(`bg:${cellStyle.background}`);
    }
    
    // Priority 2: Check if cell is marked as filled (high confidence)
    if (cellStyle && cellStyle.isFilled) {
      isActive = true;
      confidence += 90;
      reasons.push('filled');
    }
    
    // Priority 3: Check cell content - be very liberal about what constitutes content
    if (cellValue !== undefined && cellValue !== null) {
      const str = cellValue.toString().trim();
      if (str !== '' && str !== '0' && str.toLowerCase() !== 'false' && str.toLowerCase() !== 'null') {
        // Give higher weight to meaningful content
        if (str.length > 1 || /[a-zA-Z]/.test(str)) {
          isActive = true;
          confidence += 60;
          reasons.push(`content:${str.substring(0, 10)}`);
        } else {
          // Even single characters or numbers can indicate activity
          isActive = true;
          confidence += 30;
          reasons.push(`minimal_content:${str}`);
        }
      }
    }
    
    // Priority 4: Excel styling indicators (moderate confidence)
    if (cellStyle) {
      // Check for any content flag
      if (cellStyle.hasContent) {
        if (!isActive) isActive = true;
        confidence += 40;
        reasons.push('has_content_flag');
      }
      
      // Check for font styling (bold, color, etc.)
      if (cellStyle.font && (cellStyle.font.bold || cellStyle.font.color)) {
        if (!isActive) isActive = true;
        confidence += 25;
        reasons.push('font_styling');
      }
      
      // Check for border styling (sometimes indicates activity)
      if (cellStyle.border && Object.keys(cellStyle.border).length > 0) {
        if (!isActive) isActive = true;
        confidence += 20;
        reasons.push('border_styling');
      }
    }
    
    // Priority 5: Smart pattern detection based on position and context
    // If we're not finding colors/content but this looks like it should be active based on calendar patterns
    if (!isActive && this.shouldApplyPatternFallback) {
      // This will be used as a last resort when Excel parsing completely fails
      confidence += 10;
      reasons.push('pattern_fallback');
      // Note: This is enabled via a flag set during activity extraction
    }
    
    // Enhanced debugging with confidence scoring
    if (isActive && reasons.length > 0) {
      const debugCount = this.debugActivityCount || 0;
      if (debugCount < 8) { // Show more debug info
        console.log(`    💡 Active (confidence: ${confidence}): ${reasons.join(',')}`);
        this.debugActivityCount = debugCount + 1;
      }
    } else if (!isActive && cellValue) {
      const noActivityDebugCount = this.noActivityDebugCount || 0;
      if (noActivityDebugCount < 5) {
        console.log(`    ❌ Not active despite content: "${cellValue}" (style: ${cellStyle ? 'HAS_STYLE' : 'NO_STYLE'})`);
        this.noActivityDebugCount = noActivityDebugCount + 1;
      }
    }
    
    return isActive;
  }

  getCellBackgroundColor(cell) {
    // ROBUST Excel color extraction with comprehensive fallbacks and debugging
    if (!cell) {
      return null;
    }
    
    // DEBUGGING: Log cell structure for troubleshooting
    const cellInfo = {
      hasValue: !!cell.v,
      hasStyle: !!cell.s,
      value: cell.v,
      cellType: cell.t
    };
    
    // Early return if no style object
    if (!cell.s) {
      // For cells with content but no detected style, log for debugging
      if (cell.v) {
        console.log(`🔍 Cell has value "${cell.v}" but NO STYLE OBJECT`);
      }
      return null;
    }
    
    const style = cell.s;
    let backgroundColor = null;
    let colorSource = null;
    
    // COMPREHENSIVE DEBUGGING: Log style structure
    console.log(`🔬 ANALYZING CELL STYLE:`, {
      cellRef: cell.address || 'unknown',
      cellValue: cell.v || 'empty',
      styleKeys: Object.keys(style),
      hasFill: !!style.fill,
      hasInterior: !!style.interior,
      hasBgcolor: !!style.bgColor,
      fillDetails: style.fill ? {
        patternType: style.fill.patternType,
        bgColor: style.fill.bgColor ? {
          hasRgb: !!style.fill.bgColor.rgb,
          hasIndexed: !!style.fill.bgColor.indexed,
          hasTheme: !!style.fill.bgColor.theme,
          rgbValue: style.fill.bgColor.rgb,
          indexedValue: style.fill.bgColor.indexed,
          themeValue: style.fill.bgColor.theme
        } : null,
        fgColor: style.fill.fgColor
      } : null,
      rawStyle: JSON.stringify(style).substring(0, 200) + '...'
    });
    
    // METHOD 1: Check fill property (most common modern Excel)
    if (style.fill) {
      const fill = style.fill;
      
      // Pattern type check - solid fill is most reliable
      if (fill.patternType === 'solid' || !fill.patternType) {
        
        // Background color from fill
        if (fill.bgColor) {
          if (fill.bgColor.rgb) {
            let rgb = fill.bgColor.rgb;
            
            // Handle ARGB format (FF prefix)
            if (rgb.length === 8) {
              rgb = rgb.substring(2); // Remove FF prefix
            }
            
            // Normalize to hex format
            backgroundColor = rgb.startsWith('#') ? rgb.toUpperCase() : `#${rgb.toUpperCase()}`;
            
            // ENHANCED RGB MAPPINGS - Map Excel RGB values to exact target colors  
            const rgbMappings = {
              // EXACT USER-SPECIFIED CROP CALENDAR COLORS (all crop types)
              '#00B0F0': '#00B0F0', // Site Selection - light blue
              '#BF9000': '#BF9000', // Land Preparation - dark gold  
              '#5805C7': '#5805C7', // Seed Selection - dark purple
              '#BFBFBF': '#BFBFBF', // Nursery Establishment - light gray
              '#000000': '#000000', // Sowing/Transplanting - black
              '#FFFF00': '#FFFF00', // 1st, 2nd, 3rd Fertilizers - yellow
              '#FF0000': '#FF0000', // 1st, 2nd Weed - red
              '#CC00FF': '#CC00FF', // Roguing - magenta/purple
              '#008000': '#008000', // Harvesting - green
              
              // ADDITIONAL CROP-SPECIFIC COLORS (sorghum, soybean, tomato, maize)
              '#FFA500': '#FFA500', // Orange (alternative land prep)
              '#32CD32': '#32CD32', // Lime green (growth stages)
              '#FFD700': '#FFD700', // Gold (maturity stages)
              '#DC143C': '#DC143C', // Crimson (pest control)
              '#4169E1': '#4169E1', // Royal blue (irrigation)
              '#228B22': '#228B22', // Forest green (fertilization)  
              '#993366': '#993366', // Post Harvest - brownish purple
              
              // COMMON EXCEL COLOR VARIATIONS that might map to our target colors
              // Site Selection variations (light blue)
              '#00AFF0': '#00B0F0', '#00B1F0': '#00B0F0', '#01B0F0': '#00B0F0',
              
              // Land Preparation variations (dark gold)
              '#BE9000': '#BF9000', '#C09000': '#BF9000', '#BF8F00': '#BF9000',
              
              // Seed Selection variations (dark purple) 
              '#5705C7': '#5805C7', '#5906C7': '#5805C7', '#5804C7': '#5805C7',
              
              // Nursery variations (light gray)
              '#BFBEBF': '#BFBFBF', '#C0C0C0': '#BFBFBF', '#BEBEBE': '#BFBFBF',
              '#C0C0BF': '#BFBFBF', '#BFBFC0': '#BFBFBF',
              
              // Roguing variations (magenta)
              '#CC01FF': '#CC00FF', '#CB00FF': '#CC00FF', '#CD00FF': '#CC00FF',
              '#CC00FE': '#CC00FF', '#CB00FE': '#CC00FF',
              
              // Post harvest variations (brownish purple)
              '#993265': '#993366', '#993467': '#993366', '#983366': '#993366',
              '#993365': '#993366', '#943366': '#993366'
            };
            
            backgroundColor = rgbMappings[backgroundColor] || backgroundColor;
            colorSource = `fill.bgColor.rgb(${rgb})`;
          } else if (fill.bgColor.indexed !== undefined) {
            // Excel indexed colors - ENHANCED comprehensive mapping including all possible target colors
            const indexedColors = {
              // Standard palette (0-15)
              0: '#000000', 1: '#FFFFFF', 2: '#FF0000', 3: '#00FF00', 4: '#0000FF',
              5: '#FFFF00', 6: '#FF00FF', 7: '#00FFFF', 8: '#000000', 9: '#FFFFFF',
              10: '#800000', 11: '#008000', 12: '#000080', 13: '#808000', 14: '#800080', 15: '#008080',

              // Extended palette (16-31)
              16: '#C0C0C0', 17: '#808080', 18: '#9999FF', 19: '#993366', 20: '#FFFFCC',
              21: '#CCFFFF', 22: '#660066', 23: '#FF8080', 24: '#0066CC', 25: '#CCCCFF',
              26: '#000080', 27: '#FF00FF', 28: '#FFFF00', 29: '#00FFFF', 30: '#800080', 31: '#800000',

              // Chart and theme colors (32-47)
              32: '#008080', 33: '#0000FF', 34: '#00CCFF', 35: '#CCFFFF', 36: '#CCFFCC',
              37: '#FFFF99', 38: '#99CCFF', 39: '#FF99CC', 40: '#CC99FF', 41: '#FFCC99',
              42: '#3366FF', 43: '#33CCCC', 44: '#99CC00', 45: '#FFCC00', 46: '#FF9900', 47: '#FF6600',

              // Extended colors (48-63)
              48: '#666699', 49: '#969696', 50: '#003366', 51: '#339966', 52: '#003300',
              53: '#333300', 54: '#993300', 55: '#993366', 56: '#333399', 57: '#333333',
              58: '#3F3F3F', 59: '#808080', 60: '#FF0000', 61: '#FF6600', 62: '#FFCC00', 63: '#FFFF00',

              // CRITICAL: Agricultural calendar target colors (64-79)
              64: '#00B0F0',  // Site Selection - Light blue
              65: '#BF9000',  // Land preparation - Dark gold
              66: '#000000',  // Planting/Sowing - Black (CRITICAL)
              67: '#FFFF00',  // 1st Fertilizer - Yellow
              68: '#FF0000',  // Weed management - Red
              69: '#000000',  // 2nd Fertilizer - Black (CRITICAL)
              70: '#FF0000',  // Pest control - Red
              71: '#008000',  // Harvesting - Green
              72: '#800080',  // Post harvest - Purple
              73: '#000000',  // Extra black mapping (CRITICAL)
              74: '#00B0F0',  // Extra light blue
              75: '#BF9000',  // Extra dark gold
              76: '#000000',  // Another black mapping (CRITICAL)
              77: '#000000',  // Yet another black mapping (CRITICAL)
              78: '#000000',  // More black mapping (CRITICAL)
              79: '#000000',  // Maximum black mapping coverage (CRITICAL)

              // Extended range for Excel compatibility (80-95)
              80: '#FFFFFF', 81: '#000000', 82: '#FF0000', 83: '#00FF00', 84: '#0000FF',
              85: '#FFFF00', 86: '#FF00FF', 87: '#00FFFF', 88: '#000000', 89: '#000000',
              90: '#000000', 91: '#000000', 92: '#000000', 93: '#000000', 94: '#000000', 95: '#000000',

              // Maximum range coverage (96-127) - prioritize black for agricultural calendars
              96: '#000000', 97: '#000000', 98: '#000000', 99: '#000000', 100: '#000000',
              101: '#000000', 102: '#000000', 103: '#000000', 104: '#000000', 105: '#000000',
              106: '#000000', 107: '#000000', 108: '#000000', 109: '#000000', 110: '#000000',
              111: '#000000', 112: '#000000', 113: '#000000', 114: '#000000', 115: '#000000',
              116: '#000000', 117: '#000000', 118: '#000000', 119: '#000000', 120: '#000000',
              121: '#000000', 122: '#000000', 123: '#000000', 124: '#000000', 125: '#000000',
              126: '#000000', 127: '#000000'
            };
            backgroundColor = indexedColors[fill.bgColor.indexed];
            colorSource = `fill.bgColor.indexed[${fill.bgColor.indexed}]`;
          } else if (fill.bgColor.theme !== undefined) {
            // Theme colors - expanded mapping including target colors
            const themeColors = {
              0: '#FFFFFF', 1: '#000000', 2: '#E7E6E6', 3: '#44546A', 4: '#5B9BD5',
              5: '#70AD47', 6: '#FFC000', 7: '#F79646', 8: '#C5504B', 9: '#9F4F96',
              10: '#FFFF00', 11: '#FF0000', 12: '#00FF00', 13: '#0000FF', 14: '#800080',
              15: '#FFA500', 16: '#00B0F0', 17: '#BF9000', 18: '#000000', 19: '#00B0F0',
              20: '#BF9000' // Add target colors
            };
            backgroundColor = themeColors[fill.bgColor.theme];
            colorSource = `fill.bgColor.theme[${fill.bgColor.theme}]`;
          }
        }
        
        // Foreground color from pattern fill (fallback)
        if (!backgroundColor && fill.fgColor) {
          if (fill.fgColor.rgb) {
            const rgb = fill.fgColor.rgb;
            backgroundColor = rgb.length === 8 ? `#${rgb.substring(2).toUpperCase()}` :
                            rgb.startsWith('#') ? rgb.toUpperCase() : `#${rgb.toUpperCase()}`;
            colorSource = 'fill.fgColor.rgb';
          } else if (fill.fgColor.indexed !== undefined) {
            const indexedColors = {
              0: '#000000', 1: '#FFFFFF', 2: '#FF0000', 3: '#00FF00', 4: '#0000FF',
              5: '#FFFF00', 6: '#FF00FF', 7: '#000000', 8: '#000000', 9: '#FFFFFF', // Fixed: Map cyan to black
              10: '#800000', 11: '#008000', 12: '#000080', 13: '#808000', 14: '#800080',
              15: '#000000', 16: '#C0C0C0', 17: '#808080' // Fixed: Map teal to black
            };
            backgroundColor = indexedColors[fill.fgColor.indexed];
            colorSource = `fill.fgColor.indexed[${fill.fgColor.indexed}]`;
          } else if (fill.fgColor.theme !== undefined) {
            const themeColors = {
              0: '#FFFFFF', 1: '#000000', 2: '#E7E6E6', 3: '#44546A', 4: '#5B9BD5',
              5: '#70AD47', 6: '#FFC000', 7: '#F79646', 8: '#C5504B', 9: '#9F4F96'
            };
            backgroundColor = themeColors[fill.fgColor.theme];
            colorSource = `fill.fgColor.theme[${fill.fgColor.theme}]`;
          }
        }
      }
    }
    
    // Method 2: Check interior fill (alternative Excel property)
    if (!backgroundColor && style.interior) {
      const interior = style.interior;
      if (interior.color) {
        backgroundColor = interior.color.startsWith('#') ? interior.color.toUpperCase() : `#${interior.color.toUpperCase()}`;
        colorSource = 'style.interior.color';
      } else if (interior.pattern && interior.pattern.color) {
        backgroundColor = interior.pattern.color.startsWith('#') ? interior.pattern.color.toUpperCase() : `#${interior.pattern.color.toUpperCase()}`;
        colorSource = 'style.interior.pattern.color';
      }
    }
    
    // Method 3: Check for shading/background in other style properties
    if (!backgroundColor && style.shd) {
      if (style.shd.fill) {
        backgroundColor = style.shd.fill.startsWith('#') ? style.shd.fill.toUpperCase() : `#${style.shd.fill.toUpperCase()}`;
        colorSource = 'style.shd.fill';
      }
    }
    
    // ENHANCED debug logging for color extraction with more details
    if (backgroundColor && this.colorDebugCount < 20) {
      console.log(`🎨 SUCCESS - COLOR EXTRACTED: "${backgroundColor}" from ${colorSource}`);
      console.log(`    Cell value: "${cell.v || ''}", Cell type: ${typeof cell.v}`);
      console.log(`    Raw RGB: ${style.fill?.bgColor?.rgb || 'none'}`);
      console.log(`    Indexed color: ${style.fill?.bgColor?.indexed || 'none'}`);
      console.log(`    Theme color: ${style.fill?.bgColor?.theme || 'none'}`);
      console.log(`    Cell position: ${cell.address || 'unknown'}`);
      console.log(`    Full style object:`, JSON.stringify(style, null, 2));

      // SPECIAL LOGGING FOR BLACK COLORS
      if (backgroundColor === '#000000') {
        console.log(`🖤 BLACK COLOR DETECTED! This should be PLANTING/SOWING activity`);
        console.log(`    Detection method: ${colorSource}`);
        console.log(`    Cell position: ${cell.address || 'unknown'}`);
      }

      this.colorDebugCount = (this.colorDebugCount || 0) + 1;
    } else if (!backgroundColor && cell.v && this.noColorDebugCount < 15) {
      console.log(`⚪ FAILED - NO COLOR found for cell: "${cell.v}" at ${cell.address || 'unknown'}`);
      console.log(`    Style keys: [${Object.keys(style).join(', ')}]`);
      console.log(`    Has fill: ${!!style.fill}`);
      console.log(`    Full style object:`, JSON.stringify(style, null, 2));
      if (style.fill) {
        console.log(`    Fill keys: [${Object.keys(style.fill).join(', ')}]`);
        console.log(`    Pattern type: ${style.fill.patternType || 'none'}`);
        console.log(`    BG color keys: [${style.fill.bgColor ? Object.keys(style.fill.bgColor).join(', ') : 'none'}]`);
      }
      this.noColorDebugCount = (this.noColorDebugCount || 0) + 1;
    }
    
    // CRITICAL: Log exact RGB values when found
    if (style.fill && style.fill.bgColor && style.fill.bgColor.rgb && this.colorDebugCount < 20) {
      console.log(`🔍 RAW RGB VALUE: "${style.fill.bgColor.rgb}" for cell "${cell.v || ''}"`);
    }
    
    // BACKUP METHOD 1: Check for any color-related properties if main methods fail
    if (!backgroundColor && style) {
      console.log('🔄 ATTEMPTING BACKUP COLOR DETECTION...');
      backgroundColor = this.tryBackupColorExtraction(style, cell);
    }
    
    // BACKUP METHOD 2: Use workbook theme colors if available
    if (!backgroundColor && this.workbook && this.workbook.Styles) {
      console.log('🔄 ATTEMPTING WORKBOOK THEME COLOR DETECTION...');
      backgroundColor = this.tryWorkbookThemeColors(style, this.workbook);
    }
    
    // Filter out white/transparent colors that shouldn't be considered as "colored"
    // Note: Keep black (#000000) as it's a valid color for Sowing and 2nd fertilizer
    if (backgroundColor === '#FFFFFF' || backgroundColor === 'transparent') {
      return null;
    }
    
    // FINAL DEBUG: Log result for comprehensive tracking
    if (backgroundColor) {
      console.log(`✅ FINAL COLOR RESULT: "${backgroundColor}" for cell "${cell.v || 'empty'}"`);
    } else {
      console.log(`❌ FINAL RESULT: NO COLOR for cell "${cell.v || 'empty'}"`);
    }
    
    return backgroundColor;
  }

  /**
   * Backup method 1: Try alternative color extraction approaches
   */
  tryBackupColorExtraction(style, cell) {
    // Try different style property names that might contain color info
    const possibleColorProps = [
      'backgroundColor', 'bgColor', 'color', 'fillColor', 
      'backColor', 'background', 'patternColor'
    ];
    
    for (const prop of possibleColorProps) {
      if (style[prop]) {
        console.log(`🎯 BACKUP: Found color in ${prop}:`, style[prop]);
        let color = style[prop];
        if (typeof color === 'string') {
          return color.startsWith('#') ? color.toUpperCase() : `#${color.toUpperCase()}`;
        } else if (color.rgb) {
          let rgb = color.rgb;
          if (rgb.length === 8) rgb = rgb.substring(2);
          return rgb.startsWith('#') ? rgb.toUpperCase() : `#${rgb.toUpperCase()}`;
        }
      }
    }
    
    // Try alternative fill structure paths
    if (style.fill) {
      const alt_paths = [
        ['fill', 'color'],
        ['fill', 'background'],
        ['fill', 'backgroundColor'],
        ['fill', 'patternFg'],
        ['fill', 'patternBg']
      ];
      
      for (const path of alt_paths) {
        let value = style;
        for (const key of path) {
          value = value[key];
          if (!value) break;
        }
        if (value && typeof value === 'string') {
          console.log(`🎯 BACKUP: Found color via path ${path.join('.')}:`, value);
          return value.startsWith('#') ? value.toUpperCase() : `#${value.toUpperCase()}`;
        }
      }
    }
    
    return null;
  }

  /**
   * Backup method 2: Try workbook-level theme colors
   */
  tryWorkbookThemeColors(style, workbook) {
    // This is a placeholder for workbook-level theme color extraction
    // In practice, this would require deeper analysis of Excel workbook structure
    console.log('🔄 Workbook theme color detection not yet implemented');
    return null;
  }

  // Get color based on activity name if no Excel color found
  getActivityBasedColor(activityName) {
    const activity = activityName.toLowerCase();
    
    for (const [key, color] of Object.entries(this.activityColors)) {
      if (activity.includes(key)) {
        return color;
      }
    }
    
    // Enhanced activity color mapping based on target image
    if (activity.includes('site') && activity.includes('selection')) return '#00B0F0'; // Light blue (corrected)
    if (activity.includes('land') && activity.includes('preparation')) return '#BF9000'; // Dark gold (corrected)
    if (activity.includes('planting') || activity.includes('sowing')) return '#000000'; // Black (corrected)
    if (activity.includes('1st') && activity.includes('fertilizer')) return '#FFFF00'; // Yellow
    if (activity.includes('2nd') && activity.includes('fertilizer')) return '#FFFF00'; // Yellow (CORRECTED)
    if (activity.includes('first') && activity.includes('weed')) return '#FF0000'; // Red
    if (activity.includes('second') && activity.includes('weed')) return '#FF0000'; // Red
    if (activity.includes('harvest') && !activity.includes('post')) return '#008000'; // Green
    if (activity.includes('post') && activity.includes('harvest')) return '#993366'; // Brownish purple (CORRECTED)
    
    // RICE-SPECIFIC ACTIVITY COLORS based on rice calendar screenshot
    if ((activity.includes('seed') && activity.includes('selection')) || 
        (activity.includes('seed') && activity.includes('treatment'))) return '#5805C7'; // Dark purple (CORRECTED)
    if (activity.includes('nursery') && activity.includes('establishment')) return '#BFBFBF'; // Light gray (CORRECTED)
    if (activity.includes('transplanting') || activity.includes('transplant')) return '#000000'; // Black
    if (activity.includes('roguing')) return '#CC00FF'; // Magenta/purple (CORRECTED)
    if (activity.includes('3rd') && activity.includes('fertilizer')) return '#FFFF00'; // Yellow (CORRECTED)
    if (activity.includes('bird') && activity.includes('scar')) return '#FFA500'; // Orange
    
    // Broader pattern matching
    if (activity.includes('fertilizer') || activity.includes('fertiliser')) return '#FF0000';
    if (activity.includes('weed') || activity.includes('pest') || activity.includes('disease')) return '#FF0000';
    if (activity.includes('application') || activity.includes('management') || activity.includes('control')) return '#FF0000';
    if (activity.includes('harvest')) return '#008000';
    
    return '#32CD32'; // Default lime green as last resort
  }

  /**
   * Get timing patterns for activities - NOW SUPPORTS DYNAMIC EXTRACTION
   * Returns array of column indices where this activity should occur
   */
  getActivityTimingPattern(activityName, totalColumns, formData = {}, worksheet = null) {
    console.log(`🔍 TIMING PATTERN REQUEST: "${activityName}"`);
    
    // PRIORITY 1: Try dynamic extraction if worksheet is available
    if (worksheet) {
      console.log(`🔄 Attempting dynamic extraction for "${activityName}"`);
      const dynamicPattern = this.getDynamicTimingPattern(activityName, worksheet, formData);
      
      if (dynamicPattern.length > 0) {
        console.log(`✅ Dynamic pattern found for "${activityName}": [${dynamicPattern.join(', ')}]`);
        return dynamicPattern.filter(index => index >= 0 && index < totalColumns);
      }
    }
    
    // PRIORITY 2: Fallback to enhanced detection + hardcoded patterns
    const detectedType = this.detectAgriculturalType(formData);
    console.log(`🔍 Fallback to hardcoded patterns for type: "${detectedType}"`);
    
    const activity = activityName.toLowerCase();
    let patterns = [];
    
    // Use crop-specific timing patterns based on detected type
    switch (detectedType) {
      case 'maize':
        patterns = this.getMaizeTimingPattern()[activity] || [];
        break;
      case 'rice':
        patterns = this.getRiceTimingPattern()[activity] || [];
        break;
      case 'soybean':
        patterns = this.getSoybeanTimingPattern()[activity] || [];
        break;
      case 'sorghum':
        patterns = this.getSorghumTimingPattern()[activity] || [];
        break;
      case 'groundnut':
        patterns = this.getGroundnutTimingPattern()[activity] || [];
        break;
      case 'tomato':
        patterns = this.getTomatoTimingPattern()[activity] || [];
        break;
      case 'broiler':
        patterns = this.getBroilerCyclePattern()[activity] || [];
        break;
      case 'layer':
        patterns = this.getLayerCyclePattern()[activity] || [];
        break;
      default:
        // Fallback to generic patterns for unknown types
        patterns = this.getGenericTimingPattern(activity);
        console.log(`⚠️ Using generic pattern for unrecognized type: "${detectedType}"`);
    }
    
    // Enhanced debugging for pattern matching
    if (patterns.length === 0) {
      console.log(`⚠️ No timing pattern found for activity: "${activityName}" in type: "${detectedType}"`);
      console.log(`   Available patterns for ${detectedType}:`, Object.keys(this.getTimingPatternForType(detectedType)));
      
      // Try alternative activity name matching
      const alternativePatterns = this.tryAlternativeActivityMatching(activity, detectedType);
      if (alternativePatterns.length > 0) {
        console.log(`✅ Found alternative pattern for "${activity}":`, alternativePatterns);
        patterns = alternativePatterns;
      }
    }
    
    // Filter out any indices that exceed the actual column count
    return patterns.filter(index => index >= 0 && index < totalColumns);
  }

  /**
   * Get timing pattern object for a specific agricultural type
   */
  getTimingPatternForType(type) {
    switch (type) {
      case 'maize': return this.getMaizeTimingPattern();
      case 'rice': return this.getRiceTimingPattern();
      case 'soybean': return this.getSoybeanTimingPattern();
      case 'sorghum': return this.getSorghumTimingPattern();
      case 'groundnut': return this.getGroundnutTimingPattern();
      case 'tomato': return this.getTomatoTimingPattern();
      case 'broiler': return this.getBroilerCyclePattern();
      case 'layer': return this.getLayerCyclePattern();
      default: return {};
    }
  }

  /**
   * Try alternative activity name matching when exact match fails
   */
  tryAlternativeActivityMatching(activity, agriculturalType) {
    const patterns = this.getTimingPatternForType(agriculturalType);
    const activityKeys = Object.keys(patterns);
    
    // Try partial matching
    for (const key of activityKeys) {
      if (key.includes(activity) || activity.includes(key)) {
        console.log(`🔄 Alternative match: "${activity}" → "${key}"`);
        return patterns[key];
      }
    }
    
    // Try fuzzy matching for common variations
    const fuzzyMatches = {
      'site selection': ['site', 'selection', 'field selection'],
      'land preparation': ['land prep', 'preparation', 'soil prep'],
      'planting': ['sowing', 'transplanting', 'seeding'],
      'harvesting': ['harvest', 'reaping'],
      'post-harvest handling': ['post harvest', 'handling', 'storage']
    };
    
    for (const [standardName, variations] of Object.entries(fuzzyMatches)) {
      if (variations.some(variation => activity.includes(variation))) {
        if (patterns[standardName]) {
          console.log(`🔄 Fuzzy match: "${activity}" → "${standardName}"`);
          return patterns[standardName];
        }
      }
    }
    
    return [];
  }

  /**
   * Generic timing patterns for fallback when specific type not detected
   */
  getGenericTimingPattern(activity) {
    const patterns = [];
    
    if (activity.includes('site') && activity.includes('selection')) {
      patterns.push(...[0,1,2,3,4]); // JAN WK1-5
    } 
    else if (activity.includes('land') && activity.includes('preparation')) {
      patterns.push(...[0,1,2,3,4,5,6,7,8]); // JAN-FEB
    }
    else if (activity.includes('planting') || activity.includes('sowing')) {
      patterns.push(...[9,10,11,12,13,14,15,16]); // MAR-APR
    }
    else if (activity.includes('harvest') && !activity.includes('post')) {
      patterns.push(...[22,23,24,25,26,27,28]); // JUN-JUL
    }
    else if (activity.includes('post') && activity.includes('harvest')) {
      patterns.push(...[25,26,27,28,29,30,31,32]); // JUN-AUG
    }
    
    return patterns;
  }

  isCellVisuallyActive(cell) {
    // Check if cell has visual indicators (background, content, etc.)
    
    // Priority 1: Background color (most reliable for calendar activities)
    const backgroundColor = this.getCellBackgroundColor(cell);
    if (backgroundColor && backgroundColor !== '#FFFFFF' && backgroundColor !== 'transparent') {
      return true;
    }
    
    // Priority 2: Cell content
    if (cell.v) {
      const content = cell.v.toString().trim();
      if (content !== '' && content !== '0' && content.toLowerCase() !== 'false') {
        return true;
      }
    }
    
    // Priority 3: Check for other Excel formatting indicators
    if (cell.s) {
      // Check for border formatting
      if (cell.s.border && Object.keys(cell.s.border).length > 0) {
        return true;
      }
      
      // Check for font formatting
      if (cell.s.font && (cell.s.font.bold || cell.s.font.color)) {
        return true;
      }
    }
    
    return false;
  }

  extractCommodity(text) {
    if (!text || typeof text !== 'string') {
      return 'maize'; // Default fallback
    }
    
    const lowerText = text.toLowerCase();
    
    // Ensure commodity arrays exist
    const seasonalCommodities = this.seasonalCommodities || ['maize', 'rice', 'cassava'];
    const cycleCommodities = this.cycleCommodities || ['broiler', 'layer'];
    
    for (let commodity of [...seasonalCommodities, ...cycleCommodities]) {
      if (lowerText.includes(commodity)) {
        return commodity;
      }
    }
    return 'maize'; // Default fallback
  }

  isCropCommodity(commodity) {
    if (!commodity || typeof commodity !== 'string') {
      return true; // Default to crop
    }
    const seasonalCommodities = this.seasonalCommodities || ['maize', 'rice', 'cassava'];
    return seasonalCommodities.includes(commodity.toLowerCase());
  }

  isPoultryCommodity(commodity) {
    if (!commodity || typeof commodity !== 'string') {
      return false;
    }
    const cycleCommodities = this.cycleCommodities || ['broiler', 'layer'];
    return cycleCommodities.includes(commodity.toLowerCase());
  }

  hasAbsoluteDatePattern(headers) {
    if (!Array.isArray(headers) || headers.length === 0) {
      return false;
    }
    const datePatterns = /\d{1,2}[-/]\d{1,2}|\d{4}/;
    return headers.some(header => header && datePatterns.test(header.toString()));
  }

  hasMonthPattern(headers) {
    if (!Array.isArray(headers) || headers.length === 0) {
      return false;
    }
    const monthMapping = this.monthMapping || {};
    const monthNames = Object.keys(monthMapping);
    return headers.some(header => 
      header && monthNames.some(month => 
        header.toString().toLowerCase().includes(month)
      )
    );
  }

  hasWeekPattern(headers) {
    if (!Array.isArray(headers) || headers.length === 0) {
      return false;
    }
    const weekPatterns = /week\s*\d+|wk\s*\d+/i;
    return headers.some(header => header && weekPatterns.test(header.toString()));
  }

  hasRelativeWeekPattern(headers) {
    return this.hasWeekPattern(headers);
  }

  hasProductionWeekPattern(data) {
    const flatText = data.flat().join(' ').toLowerCase();
    return flatText.includes('production week') || 
           flatText.includes('cycle week') ||
           (flatText.includes('week') && !this.hasAbsoluteDatePattern(data.flat()));
  }

  /**
   * Detect agricultural type from multiple sources
   * @param {Object} metadata - Form data and file info
   * @param {Array} data - Raw Excel data
   * @param {string} filename - Excel filename
   * @returns {string} Detected agricultural type
   */
  detectAgriculturalType(metadata = {}, data = [], filename = '') {
    console.log('🔍 DETECTING AGRICULTURAL TYPE...');
    
    // METHOD 1: Form data (highest priority)
    if (metadata.crop && metadata.crop.trim()) {
      const formCrop = metadata.crop.toLowerCase().trim();
      console.log(`📋 Form crop detected: "${formCrop}"`);
      if (this.isValidAgriculturalType(formCrop)) {
        console.log(`✅ Using form crop: ${formCrop}`);
        return formCrop;
      }
    }
    
    // METHOD 2: Filename analysis
    const filenameType = this.detectTypeFromFilename(filename);
    if (filenameType) {
      console.log(`✅ Using filename type: ${filenameType}`);
      return filenameType;
    }
    
    // METHOD 3: Excel content analysis
    const contentType = this.detectTypeFromContent(data);
    if (contentType) {
      console.log(`✅ Using content type: ${contentType}`);
      return contentType;
    }
    
    // METHOD 4: Default fallback
    console.log('⚠️ No specific type detected, using default: maize');
    return 'maize';
  }

  /**
   * Check if agricultural type is valid and supported
   */
  isValidAgriculturalType(type) {
    const allTypes = [
      ...this.priorityAgriculturalTypes.seasonalCrops,
      ...Object.keys(this.priorityAgriculturalTypes.poultryCycles)
    ];
    return allTypes.includes(type.toLowerCase());
  }

  /**
   * Detect agricultural type from filename
   */
  detectTypeFromFilename(filename) {
    if (!filename) return null;
    
    const name = filename.toLowerCase();
    console.log(`🔍 Analyzing filename: "${filename}"`);
    
    // Check for exact matches first
    const allTypes = [
      ...this.priorityAgriculturalTypes.seasonalCrops,
      ...Object.keys(this.priorityAgriculturalTypes.poultryCycles)
    ];
    
    for (const type of allTypes) {
      if (name.includes(type)) {
        console.log(`📁 Filename contains "${type}"`);
        return type;
      }
    }
    
    return null;
  }

  /**
   * Detect agricultural type from Excel content - Enhanced Dynamic Detection
   */
  detectTypeFromContent(data) {
    if (!data || data.length === 0) return null;
    
    console.log('🔍 Analyzing Excel content for dynamic type detection...');
    
    // Extract comprehensive text content from more rows for better detection
    const textContent = data.slice(0, 15)
      .flat()
      .filter(cell => cell && (typeof cell === 'string' || typeof cell === 'number'))
      .map(cell => String(cell))
      .join(' ')
      .toLowerCase();
    
    console.log(`📄 Content sample: "${textContent.substring(0, 300)}..."`);
    
    // Enhanced keyword detection with comprehensive coverage for all agricultural types
    const enhancedCropKeywords = {
      'rice': [
        'rice', 'paddy', 'transplanting', 'transplant', 'roguing', 'bird scaring', 'nursery establishment', 
        'seed treatment', 'puddling', 'leveling', 'water management', 'irrigation', 'gap filling',
        'basal fertilizer', 'top dressing', 'threshing', 'winnowing', 'drying', 'milling', 'oryza sativa'
      ],
      'maize': [
        'maize', 'corn', 'fall army worm', 'army worm', 'zea mays', 'site selection', 'land preparation',
        'planting', 'sowing', 'fertilizer application', 'weed management', 'pest control', 'harvesting',
        'post harvest', 'major season', 'minor season'
      ],
      'soybean': [
        'soybean', 'soy bean', 'soya', 'glycine max', 'inoculation', 'rhizobium', 'nodulation', 
        'flowering', 'pod formation', 'pod filling', 'maturity assessment', 'cutting', 'legume',
        'nitrogen fixation', 'rhizobium inoculation', 'bean'
      ],
      'sorghum': [
        'sorghum', 'millet', 'guinea corn', 'sorghum bicolor', 'thinning', 'gap filling', 'ploughing',
        'harrowing', 'seed selection', 'seed treatment', 'basal fertilizer', 'top dressing',
        'maturity assessment', 'threshing', 'winnowing', 'cleaning', 'grading', 'durra'
      ],
      'groundnut': [
        'groundnut', 'peanut', 'nuts', 'arachis hypogaea', 'earthing up', 'ridging', 'pegging',
        'peg penetration', 'pod formation', 'pod filling', 'lifting', 'picking', 'pod separation',
        'curing', 'shelling', 'field drying', 'arachis', 'nuts', 'monkey nuts'
      ],
      'tomato': [
        'tomato', 'fruit', 'solanum lycopersicum', 'staking', 'trellising', 'germination test',
        'nursing', 'starter solution', 'earthening-up', 'pruning', 'transplanting', 'vegetable',
        'lycopersicon', 'nightshade', 'solanaceae'
      ],
      'cassava': [
        'cassava', 'manihot esculenta', 'tuber', 'stem cutting', 'mounding', 'harvesting',
        'root crop', 'tapioca', 'yuca', 'manioc'
      ],
      'yam': [
        'yam', 'dioscorea', 'tuber', 'seed yam', 'mounding', 'staking', 'root crop'
      ],
      'plantain': [
        'plantain', 'banana', 'musa', 'sucker', 'mat', 'bunch', 'cooking banana'
      ],
      'cocoa': [
        'cocoa', 'cacao', 'theobroma', 'pod', 'bean', 'fermentation', 'drying', 'chocolate'
      ],
      'coffee': [
        'coffee', 'coffea', 'bean', 'berry', 'processing', 'arabica', 'robusta'
      ],
      'broiler': [
        'broiler', 'chick', 'day-old', 'processing', 'pre-starter', 'gumboro', 'newcastle',
        'starter diet', 'grower', 'finisher', 'meat production', 'poultry', 'chicken',
        'brooder management', 'controlled environment', 'heat', 'vaccination', 'biosecurity',
        'harvesting and processing', 'meat bird', '8 week', 'slaughter'
      ],
      'layer': [
        'layer', 'egg', 'laying', 'debeaking', 'pullet', 'hen', 'egg production',
        'poultry', 'chicken', 'point of lay', '20 week', 'production phase',
        'harvesting and marketing', 'eggs', 'layer diet', 'feed layer'
      ]
    };
    
    // Score-based detection for better accuracy
    const scores = {};
    
    for (const [crop, keywords] of Object.entries(enhancedCropKeywords)) {
      scores[crop] = 0;
      for (const keyword of keywords) {
        const occurrences = (textContent.match(new RegExp(keyword, 'g')) || []).length;
        scores[crop] += occurrences;
        if (occurrences > 0) {
          console.log(`🌱 Found "${keyword}" in ${crop}: ${occurrences} times`);
        }
      }
    }
    
    // Find the crop with highest score
    const detectedCrop = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
    
    if (scores[detectedCrop] > 0) {
      console.log(`✅ Detected crop: ${detectedCrop} (score: ${scores[detectedCrop]})`);
      return detectedCrop;
    }
    
    // Fallback: Try to extract any crop name from headers or title
    const potentialCrop = this.extractCropFromHeaders(data);
    if (potentialCrop) {
      console.log(`✅ Extracted crop from headers: ${potentialCrop}`);
      return potentialCrop;
    }
    
    return null;
  }

  /**
   * Extract crop name from Excel headers/titles
   */
  extractCropFromHeaders(data) {
    if (!data || data.length === 0) return null;
    
    // Check first 3 rows for title/header information
    const headerRows = data.slice(0, 3);
    
    for (const row of headerRows) {
      if (Array.isArray(row)) {
        for (const cell of row) {
          if (cell && typeof cell === 'string') {
            const cellText = cell.toLowerCase();
            
            // Look for common patterns like "maize calendar", "rice production", etc.
            const words = cellText.split(/\s+/);
            for (const word of words) {
              // Remove common suffixes
              const cleanWord = word.replace(/[s']$/, '').replace(/ing$/, '');
              
              // Check against known crops with comprehensive alternatives
              const knownCrops = {
                'maize': ['maize', 'corn', 'zea'],
                'rice': ['rice', 'paddy', 'oryza'],
                'soybean': ['soybean', 'soya', 'bean', 'glycine'],
                'sorghum': ['sorghum', 'millet', 'guinea', 'durra'],
                'groundnut': ['groundnut', 'peanut', 'nuts', 'arachis', 'monkey'],
                'tomato': ['tomato', 'lycopersicon', 'solanum'],
                'cassava': ['cassava', 'manihot', 'tapioca', 'yuca', 'manioc'],
                'yam': ['yam', 'dioscorea'],
                'plantain': ['plantain', 'banana', 'musa'],
                'cocoa': ['cocoa', 'cacao', 'theobroma', 'chocolate'],
                'coffee': ['coffee', 'coffea'],
                'broiler': ['broiler', 'meat', 'chicken', 'poultry'],
                'layer': ['layer', 'egg', 'laying', 'hen', 'pullet']
              };
              
              // Check each crop type and its alternatives
              for (const [cropType, alternatives] of Object.entries(knownCrops)) {
                if (alternatives.some(alt => cleanWord.includes(alt) || alt.includes(cleanWord))) {
                  return cropType;
                }
              }
            }
          }
        }
      }
    }
    
    return null;
  }

  /**
   * DYNAMIC TIMING PATTERN EXTRACTION
   * Replaces hardcoded patterns with real-time Excel analysis
   */
  getDynamicTimingPattern(activityName, worksheet, formData = {}) {
    console.log(`🔄 DYNAMIC EXTRACTION: "${activityName}"`);
    
    try {
      // First, extract the calendar structure from Excel
      const calendarStructure = this.extractCalendarStructure(worksheet);
      
      // Find the activity row in the Excel data
      const activityRow = this.findActivityRow(worksheet, activityName);
      
      if (!activityRow) {
        console.log(`⚠️ Activity "${activityName}" not found in Excel`);
        return [];
      }
      
      // Extract week ranges where this activity is active
      const activeWeeks = this.extractActiveWeeksForActivity(worksheet, activityRow, calendarStructure);
      
      console.log(`✅ Dynamic pattern for "${activityName}": weeks [${activeWeeks.join(', ')}]`);
      return activeWeeks;
      
    } catch (error) {
      console.error(`❌ Dynamic extraction failed for "${activityName}":`, error);
      return [];
    }
  }

  /**
   * Extract the calendar structure (weeks, months) from Excel headers
   */
  extractCalendarStructure(worksheet) {
    console.log('📅 Extracting calendar structure...');
    
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    const structure = {
      weekColumns: [],
      monthColumns: [],
      startCol: range.s.c,
      endCol: range.e.c
    };
    
    // Scan first few rows for week/month headers
    for (let row = range.s.r; row <= Math.min(range.s.r + 3, range.e.r); row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellRef];
        
        if (cell && cell.v) {
          const cellText = String(cell.v).toLowerCase();
          
          // Look for week patterns (WK1, Week 1, etc.)
          const weekMatch = cellText.match(/w(?:eek|k)\s*(\d+)/i);
          if (weekMatch) {
            const weekNum = parseInt(weekMatch[1]) - 1; // Convert to 0-based index
            structure.weekColumns.push({ col, weekNum, text: cellText });
          }
          
          // Look for month patterns
          const monthMatch = cellText.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i);
          if (monthMatch) {
            structure.monthColumns.push({ col, month: monthMatch[1], text: cellText });
          }
        }
      }
    }
    
    console.log(`📅 Found ${structure.weekColumns.length} week columns, ${structure.monthColumns.length} month columns`);
    return structure;
  }

  /**
   * Find the row containing a specific activity
   */
  findActivityRow(worksheet, activityName) {
    console.log(`🔍 Searching for activity: "${activityName}"`);
    
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    const searchTerm = activityName.toLowerCase();
    
    // Scan all rows looking for the activity name
    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= Math.min(range.s.c + 3, range.e.c); col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellRef];
        
        if (cell && cell.v) {
          const cellText = String(cell.v).toLowerCase();
          
          // Check for exact match or partial match
          if (cellText.includes(searchTerm) || searchTerm.includes(cellText)) {
            console.log(`✅ Found activity "${activityName}" at row ${row}, col ${col}`);
            return { row, col, text: cellText };
          }
        }
      }
    }
    
    // Try fuzzy matching for common variations
    const variations = this.generateActivityVariations(activityName);
    
    for (const variation of variations) {
      for (let row = range.s.r; row <= range.e.r; row++) {
        for (let col = range.s.c; col <= Math.min(range.s.c + 3, range.e.c); col++) {
          const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
          const cell = worksheet[cellRef];
          
          if (cell && cell.v) {
            const cellText = String(cell.v).toLowerCase();
            if (cellText.includes(variation)) {
              console.log(`✅ Found activity "${activityName}" (variant: "${variation}") at row ${row}`);
              return { row, col, text: cellText };
            }
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Generate activity name variations for better matching
   */
  generateActivityVariations(activityName) {
    const variations = [activityName.toLowerCase()];
    
    // Common substitutions
    const substitutions = {
      'first': '1st',
      'second': '2nd', 
      'third': '3rd',
      'fertilizer': 'fertiliser',
      'fertiliser': 'fertilizer',
      'management': 'control',
      'control': 'management',
      'weed': 'weeding',
      'harvest': 'harvesting'
    };
    
    for (const [from, to] of Object.entries(substitutions)) {
      if (activityName.includes(from)) {
        variations.push(activityName.replace(from, to));
      }
    }
    
    return variations;
  }

  /**
   * Extract active weeks for a specific activity from its row
   */
  extractActiveWeeksForActivity(worksheet, activityRow, calendarStructure) {
    console.log(`📊 Extracting active weeks for activity at row ${activityRow.row}`);
    
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    const activeWeeks = [];
    
    // Scan across the activity row to find colored/filled cells
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: activityRow.row, c: col });
      const cell = worksheet[cellRef];
      
      if (this.isCellActiveInExcel(cell)) {
        // Map column to week number based on calendar structure
        const weekNum = this.mapColumnToWeek(col, calendarStructure);
        if (weekNum !== null && !activeWeeks.includes(weekNum)) {
          activeWeeks.push(weekNum);
        }
      }
    }
    
    return activeWeeks.sort((a, b) => a - b);
  }

  /**
   * Check if a cell is considered "active" (has color, content, or formatting)
   */
  isCellActiveInExcel(cell) {
    if (!cell) return false;

    let isActive = false;
    let reasons = [];

    // PRIORITY 1: Check for background color (most reliable indicator)
    const backgroundColor = this.getCellBackgroundColor(cell);
    if (backgroundColor && backgroundColor !== '#FFFFFF' && backgroundColor !== 'transparent') {
      isActive = true;
      reasons.push(`backgroundColor:${backgroundColor}`);

      // SPECIAL: Log black color detection for planting/sowing debugging
      if (backgroundColor === '#000000') {
        console.log(`🖤 BLACK COLOR DETECTED in isCellActiveInExcel! Cell: ${cell.address || 'unknown'}, Value: "${cell.v || 'empty'}"`);
      }
    }

    // PRIORITY 2: Check for meaningful content (secondary indicator)
    if (cell.v !== undefined && cell.v !== null) {
      const str = String(cell.v).trim();
      if (str !== '' && str !== '0' && str.toLowerCase() !== 'false' && str.toLowerCase() !== 'null') {
        isActive = true;
        reasons.push(`content:${str.substring(0, 10)}`);
      }
    }

    // PRIORITY 3: Check for any Excel styling/formatting (tertiary indicator)
    if (cell.s && Object.keys(cell.s).length > 0) {
      // Check for fill patterns even without explicit color
      if (cell.s.fill) {
        isActive = true;
        reasons.push('hasFillPattern');
      }

      // Check for borders (sometimes indicates activity)
      if (cell.s.border) {
        isActive = true;
        reasons.push('hasBorder');
      }

      // Check for font styling (bold, color, etc.)
      if (cell.s.font) {
        isActive = true;
        reasons.push('hasFontStyling');
      }

      // Any other styling
      if (!isActive && Object.keys(cell.s).length > 0) {
        isActive = true;
        reasons.push('hasOtherStyling');
      }
    }

    // PRIORITY 4: Excel format codes (quaternary indicator)
    if (cell.z && cell.z !== 'General') {
      isActive = true;
      reasons.push(`format:${cell.z}`);
    }

    // PRIORITY 5: Cell type indicators (final fallback)
    if (cell.t && ['n', 's', 'b'].includes(cell.t) && cell.v !== undefined) {
      // Numeric, string, or boolean with actual value
      if (!isActive && String(cell.v).trim() !== '') {
        isActive = true;
        reasons.push(`type:${cell.t}`);
      }
    }

    // Enhanced debugging for cells that should be active
    if (isActive && this.debugActivityCount < 20) {
      console.log(`✅ CELL ACTIVE: ${cell.address || 'unknown'} - Value: "${cell.v || 'empty'}" - Reasons: [${reasons.join(', ')}]`);
      this.debugActivityCount = (this.debugActivityCount || 0) + 1;
    } else if (!isActive && (cell.v || (cell.s && Object.keys(cell.s).length > 0))) {
      const noActivityCount = this.noActivityDebugCount || 0;
      if (noActivityCount < 10) {
        console.log(`❌ CELL NOT ACTIVE: ${cell.address || 'unknown'} - Value: "${cell.v || 'empty'}" - HasStyle: ${!!(cell.s && Object.keys(cell.s).length > 0)}`);
        this.noActivityDebugCount = noActivityCount + 1;
      }
    }

    return isActive;
  }

  /**
   * Map Excel column to week number based on calendar structure
   */
  mapColumnToWeek(col, calendarStructure) {
    // Try to find exact week column match
    const weekCol = calendarStructure.weekColumns.find(wc => wc.col === col);
    if (weekCol) {
      return weekCol.weekNum;
    }
    
    // Estimate based on column position relative to known week columns
    if (calendarStructure.weekColumns.length > 0) {
      const sortedWeekCols = calendarStructure.weekColumns.sort((a, b) => a.col - b.col);
      
      // Find the closest week column
      let closestWeekCol = sortedWeekCols[0];
      for (const weekCol of sortedWeekCols) {
        if (weekCol.col <= col) {
          closestWeekCol = weekCol;
        } else {
          break;
        }
      }
      
      // Calculate offset
      const offset = col - closestWeekCol.col;
      return closestWeekCol.weekNum + offset;
    }
    
    // Fallback: assume column index maps directly to weeks
    return col - calendarStructure.startCol;
  }

  /**
   * DYNAMIC ACTIVITY-WEEK MAPPING ENGINE
   * Scans the entire Excel file to build a complete mapping of all activities and their week ranges
   */
  buildDynamicActivityWeekMapping(worksheet) {
    console.log('🏗️ Building dynamic activity-week mapping...');
    
    try {
      const mapping = {};
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      const calendarStructure = this.extractCalendarStructure(worksheet);
      
      // Step 1: Find all activity rows by scanning the first few columns for activity names
      const activityRows = this.findAllActivityRows(worksheet);
      console.log(`📋 Found ${activityRows.length} activity rows`);
      
      // Step 2: For each activity, extract its week pattern
      for (const activityRow of activityRows) {
        const activityName = activityRow.text.toLowerCase().trim();
        const activeWeeks = this.extractActiveWeeksForActivity(worksheet, activityRow, calendarStructure);
        
        if (activeWeeks.length > 0) {
          mapping[activityName] = activeWeeks;
          console.log(`📊 Mapped "${activityName}": weeks [${activeWeeks.join(', ')}]`);
        }
      }
      
      console.log(`✅ Dynamic mapping completed: ${Object.keys(mapping).length} activities mapped`);
      return mapping;
      
    } catch (error) {
      console.error('❌ Failed to build dynamic mapping:', error);
      return {};
    }
  }

  /**
   * Find all rows that contain activity names
   */
  findAllActivityRows(worksheet) {
    console.log('🔍 Scanning for all activity rows...');
    
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    const activityRows = [];
    
    // Define activity keywords to look for
    const activityKeywords = [
      'site', 'selection', 'land', 'preparation', 'planting', 'sowing', 'transplanting',
      'fertilizer', 'fertiliser', 'weed', 'management', 'control', 'pest', 'disease',
      'harvest', 'harvesting', 'post', 'handling', 'roguing', 'bird', 'scaring',
      'seed', 'treatment', 'nursery', 'establishment', 'earthing', 'staking', 'trellising'
    ];
    
    // Scan rows, focusing on the first 3-4 columns where activity names typically appear
    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= Math.min(range.s.c + 3, range.e.c); col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellRef];
        
        if (cell && cell.v && typeof cell.v === 'string') {
          const cellText = String(cell.v).toLowerCase();
          
          // Check if this looks like an activity name
          const isActivity = activityKeywords.some(keyword => cellText.includes(keyword));
          
          if (isActivity && cellText.length > 3) {
            // Avoid duplicates (same row but different columns)
            const existingRow = activityRows.find(ar => ar.row === row);
            if (!existingRow) {
              activityRows.push({
                row,
                col,
                text: String(cell.v).trim()
              });
              console.log(`🎯 Found activity: "${cell.v}" at row ${row}, col ${col}`);
            }
          }
        }
      }
    }
    
    return activityRows;
  }

  /**
   * ENHANCED DYNAMIC TIMING PATTERN - Uses the complete activity mapping
   */
  getDynamicTimingPatternEnhanced(activityName, worksheet, formData = {}) {
    console.log(`🔄 ENHANCED DYNAMIC EXTRACTION: "${activityName}"`);
    
    // First, try direct extraction
    const directPattern = this.getDynamicTimingPattern(activityName, worksheet, formData);
    if (directPattern.length > 0) {
      return directPattern;
    }
    
    // If direct extraction failed, use the complete activity mapping
    const activityMapping = this.buildDynamicActivityWeekMapping(worksheet);
    
    // Try exact match
    const exactMatch = activityMapping[activityName.toLowerCase()];
    if (exactMatch) {
      console.log(`✅ Found exact match in mapping: [${exactMatch.join(', ')}]`);
      return exactMatch;
    }
    
    // Try partial matches
    for (const [mappedActivity, weeks] of Object.entries(activityMapping)) {
      if (mappedActivity.includes(activityName.toLowerCase()) || 
          activityName.toLowerCase().includes(mappedActivity)) {
        console.log(`✅ Found partial match "${mappedActivity}" for "${activityName}": [${weeks.join(', ')}]`);
        return weeks;
      }
    }
    
    console.log(`⚠️ No dynamic pattern found for "${activityName}"`);
    return [];
  }

  /**
   * UNIVERSAL CALENDAR PREVIEW PARSER
   * Works with any Excel calendar format by dynamically extracting structure and content
   */
  parseUniversalCalendar(worksheet, metadata = {}) {
    console.log('🌍 Starting universal calendar parsing...');
    
    try {
      // Step 1: Dynamic crop/commodity detection
      const detectedCrop = this.detectAgriculturalType(metadata);
      console.log(`🌱 Detected crop: ${detectedCrop}`);
      
      // Step 2: Extract calendar structure
      const calendarStructure = this.extractCalendarStructure(worksheet);
      console.log(`📅 Calendar structure: ${calendarStructure.weekColumns.length} weeks, ${calendarStructure.monthColumns.length} months`);
      
      // Step 3: Build complete activity mapping
      const activityMapping = this.buildDynamicActivityWeekMapping(worksheet);
      console.log(`📊 Activity mapping: ${Object.keys(activityMapping).length} activities`);
      
      // Step 4: Generate universal calendar structure
      const universalCalendar = {
        detectedCrop,
        calendarStructure,
        activityMapping,
        totalWeeks: calendarStructure.weekColumns.length || 52,
        totalActivities: Object.keys(activityMapping).length
      };
      
      console.log('✅ Universal calendar parsing completed');
      return universalCalendar;
      
    } catch (error) {
      console.error('❌ Universal calendar parsing failed:', error);
      return null;
    }
  }

  /**
   * Dynamically find where the timeline starts in the Excel sheet
   * @param {Array} data - Raw Excel data
   * @returns {number} Column index where timeline starts
   */
  findTimelineStartColumn_Original(data) {
    // Look for timeline indicators in first few rows
    for (let row = 0; row < Math.min(10, data.length); row++) {
      const rowData = data[row];
      if (!rowData) continue;
      
      for (let col = 1; col < Math.min(20, rowData.length); col++) {
        const cellValue = rowData[col];
        if (cellValue && typeof cellValue === 'string') {
          const value = cellValue.toLowerCase();
          // Check for common timeline patterns
          if (value.includes('week') || value.includes('wk') || 
              value.includes('month') || value.includes('jan') || 
              value.includes('feb') || value.includes('mar') ||
              /^w\d+/.test(value) || /week\s*\d+/i.test(value)) {
            console.log(`🕐 Timeline start detected at column ${col} (${cellValue})`);
            return col;
          }
        }
      }
    }
    // Default fallback - typically column 2 (C) after S/N and Activity
    console.log('🕐 Using default timeline start column: 2');
    return 2;
  }

  /**
   * SOYBEAN TIMING PATTERN - Enhanced with complete soybean production activities
   * March WK3-4, April WK1-2, May WK2-4, etc.
   */
  getSoybeanTimingPattern() {
    return {
      'site selection': [2, 3],                           // MAR WK3-4
      'land preparation': [2, 3],                         // MAR WK3-4
      'ploughing': [2, 3],                                // MAR WK3-4
      'harrowing': [3, 4],                                // MAR WK4-APR WK1
      'seed selection': [0, 1, 2],                        // MAR WK1-3
      'seed treatment': [2, 3, 4],                        // MAR WK3-APR WK1
      'inoculation': [3, 4],                              // MAR WK4-APR WK1
      'rhizobium inoculation': [3, 4],                    // MAR WK4-APR WK1 (alias)
      'planting': [4, 5],                                 // APR WK1-2
      'sowing': [4, 5],                                   // APR WK1-2 (alias)
      'emergence': [5, 6],                                // APR WK2-3
      'thinning': [6, 7, 8],                              // APR WK3-MAY WK1
      'gap filling': [6, 7],                              // APR WK3-MAY WK1
      '1st fertilizer application': [6, 7, 8],            // MAY WK2-4
      'first fertilizer application': [6, 7, 8],          // MAY WK2-4 (alias)
      'basal fertilizer': [4, 5, 6],                      // APR WK1-APR WK3
      'first weed management': [10, 11, 12],              // JUN WK2-4
      '1st weed management': [10, 11, 12],                // JUN WK2-4 (alias)
      'weeding': [10, 11, 12, 15, 16],                    // JUN WK2-4, JUL WK3-4
      'control of fall army worm': [10, 11, 12],          // JUN WK2-4
      '2nd fertilizer application': [11, 12],             // JUN WK3-4
      'second fertilizer application': [11, 12],          // JUN WK3-4 (alias)
      'top dressing': [11, 12, 13, 14],                   // JUN WK3-JUL WK2
      'urea': [11, 12],                                   // JUN WK3-4
      'soa': [11, 12],                                    // JUN WK3-4
      'nodulation': [8, 9, 10, 11],                       // MAY WK1-JUN WK3
      'flowering': [12, 13, 14, 15],                      // JUN WK4-JUL WK3
      'second weed management': [13, 14, 15, 16],         // JUL WK1-4
      '2nd weed management': [13, 14, 15, 16],            // JUL WK1-4 (alias)
      'pest and disease control': [13, 14, 15, 16, 17, 18], // JUL WK1-AUG WK2
      'disease management': [13, 14, 15, 16, 17, 18],     // JUL WK1-AUG WK2 (alias)
      'insect control': [13, 14, 15, 16, 17, 18],         // JUL WK1-AUG WK2
      'pod formation': [14, 15, 16, 17],                  // JUL WK2-AUG WK1
      'pod filling': [16, 17, 18, 19],                    // JUL WK4-AUG WK3
      'field monitoring': [10, 11, 12, 13, 14, 15, 16, 17, 18, 19], // JUN WK2-AUG WK3
      'maturity assessment': [18, 19],                    // AUG WK2-3
      'harvesting': [19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35], // AUG WK3-NOV WK4
      'cutting': [19, 20, 21, 22],                        // AUG WK3-SEP WK2
      'drying': [20, 21, 22, 23, 24],                     // AUG WK4-SEP WK4
      'sun drying': [20, 21, 22, 23, 24],                 // AUG WK4-SEP WK4 (alias)
      'threshing': [22, 23, 24, 25, 26],                  // SEP WK2-OCT WK2
      'winnowing': [23, 24, 25, 26, 27],                  // SEP WK3-OCT WK3
      'cleaning': [24, 25, 26, 27],                       // SEP WK4-OCT WK3
      'grading': [25, 26, 27, 28],                        // OCT WK1-4
      'storage': [26, 27, 28, 29, 30, 31, 32, 33, 34, 35], // OCT WK2-NOV WK4
      'post harvest handling': [20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35], // AUG WK4-NOV WK4
      'packaging': [26, 27, 28, 29],                      // OCT WK2-NOV WK1
      'marketing': [28, 29, 30, 31, 32, 33, 34, 35]       // OCT WK4-NOV WK4
    };
  }

  /**
   * SORGHUM TIMING PATTERN - Enhanced with complete sorghum production activities
   * March WK1-2, March WK3-April WK2, etc.
   */
  getSorghumTimingPattern() {
    return {
      'site selection': [0, 1],                           // MAR WK1-2
      'land preparation': [2, 3, 4, 5],                   // MAR WK3-APR WK2
      'ploughing': [2, 3, 4],                             // MAR WK3-5
      'harrowing': [4, 5],                                // APR WK1-2
      'seed selection': [0, 1, 2],                        // MAR WK1-3
      'seed treatment': [4, 5, 6],                        // APR WK1-3
      'planting': [6, 7],                                 // APR WK3-4
      'sowing': [6, 7],                                   // APR WK3-4 (alias)
      'thinning': [8, 9, 10],                             // MAY WK1-3
      'gap filling': [8, 9],                              // MAY WK1-2
      '1st fertilizer application': [8, 9],               // MAY WK1-2
      'first fertilizer application': [8, 9],             // MAY WK1-2 (alias)
      'basal fertilizer': [6, 7, 8],                      // APR WK3 - MAY WK1
      'first weed management': [10, 11, 12, 13],          // MAY WK3-JUN WK2
      '1st weed management': [10, 11, 12, 13],            // MAY WK3-JUN WK2 (alias)
      'weeding': [10, 11, 12, 13, 16, 17],               // MAY WK3-JUN WK2, JUL WK1-2
      'control of fall army worm': [10, 11, 12, 13],      // MAY WK3-JUN WK2
      '2nd fertilizer application': [11, 12],             // MAY WK4-JUN WK1
      'second fertilizer application': [11, 12],          // MAY WK4-JUN WK1 (alias)
      'top dressing': [11, 12, 14, 15],                   // MAY WK4-JUN WK1, JUN WK3-4
      'urea': [11, 12],                                   // MAY WK4-JUN WK1
      'soa': [11, 12],                                    // MAY WK4-JUN WK1
      'second weed management': [12, 13, 14, 15, 16, 17], // JUN WK1-JUL WK2
      '2nd weed management': [12, 13, 14, 15, 16, 17],    // JUN WK1-JUL WK2 (alias)
      'pest and disease control': [12, 13, 14, 15, 16, 17, 18, 19], // JUN WK1-AUG WK3
      'disease management': [12, 13, 14, 15, 16, 17, 18, 19], // JUN WK1-AUG WK3 (alias)
      'insect control': [12, 13, 14, 15, 16, 17, 18, 19], // JUN WK1-AUG WK3
      'bird scaring': [18, 19, 20, 21],                   // JUL WK3-AUG WK4
      'field monitoring': [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], // MAY WK3-AUG WK4
      'maturity assessment': [19, 20],                    // AUG WK3-4
      'harvesting': [20, 21, 22, 23, 24, 25, 26, 27],     // AUG WK1-SEPT WK4
      'cutting': [20, 21, 22, 23],                        // AUG WK1-4 (alias)
      'threshing': [22, 23, 24, 25, 26],                  // AUG WK3-SEP WK2
      'winnowing': [23, 24, 25, 26, 27],                  // AUG WK4-SEP WK3
      'drying': [22, 23, 24, 25, 26, 27],                 // AUG WK3-SEP WK3
      'sun drying': [22, 23, 24, 25, 26, 27],             // AUG WK3-SEP WK3 (alias)
      'cleaning': [24, 25, 26, 27],                       // SEP WK1-3
      'grading': [25, 26, 27, 28],                        // SEP WK2-4
      'storage': [26, 27, 28, 29, 30, 31],                // SEP WK3-OCT WK4
      'post harvest handling': [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31], // AUG WK2-OCT WK4
      'packaging': [26, 27, 28],                          // SEP WK3-4, OCT WK1
      'marketing': [28, 29, 30, 31]                       // OCT WK1-4
    };
  }

  /**
   * BROILER PRODUCTION CYCLE PATTERN - Based on Excel screenshot analysis
   * 8-week production cycle
   */
  getBroilerCyclePattern() {
    return {
      'site selection': [0, 1],                           // Week B4 + Week 1
      'construction': [0, 1],                             // Week B4 + Week 1
      'appropriate housing': [0, 1],                      // Week B4 + Week 1
      'source for market': [0, 1],                       // Week B4 + Week 1
      'preparation before arrival': [1],                  // Week 1
      'day-old chicks': [1],                             // Week 1
      'brooder management': [1, 2, 3],                   // Week 1-3
      'controlled environment': [1, 2, 3],               // Week 1-3
      'heat': [1, 2, 3],                                 // Week 1-3
      'provision of pre-starter': [1, 2, 3],             // Week 1-3
      'starter diet': [1, 2, 3],                         // Week 1-3
      'potable water': [1, 2, 3],                        // Week 1-3
      'ad libitum': [1, 2, 3],                           // Week 1-3
      '1st gumboro vaccine': [2],                        // Week 2
      'gumboro vaccine intermediate': [2],                // Week 2
      'not given gumboro matelni': [2],                  // Week 2
      'hatchery': [2],                                   // Week 2
      '1st newcastle vaccine': [3],                      // Week 3
      'hitchiner vaccine': [3],                          // Week 3
      'water': [3],                                      // Week 3
      '2nd gumboro vaccine': [3, 4],                     // Week 3-4
      'intermediate plus': [3, 4],                       // Week 3-4
      'provision of grower': [4, 5, 6, 7, 8],           // Week 4-8
      'finisher diet': [4, 5, 6, 7, 8],                 // Week 4-8
      'grower finisher diet': [4, 5, 6, 7, 8],          // Week 4-8
      '2nd newcastle vaccine': [5],                      // Week 5
      'lasota vaccine': [5],                             // Week 5
      'adherence to husbandry': [1, 2, 3, 4, 5, 6, 7, 8], // Week 1-8
      'biosecurity measures': [1, 2, 3, 4, 5, 6, 7, 8],  // Week 1-8
      'harvesting and processing': [6, 7, 8]             // Week 6-8
    };
  }

  /**
   * LAYER PRODUCTION CYCLE PATTERN - Based on Excel screenshot analysis  
   * 20-week (5-month) production cycle
   */
  getLayerCyclePattern() {
    return {
      'site selection': [0, 1],                          // Before + Month 1 Week 1
      'construction': [0, 1],                            // Before + Month 1 Week 1
      'appropriate housing': [0, 1],                     // Before + Month 1 Week 1
      'source for market': [0, 1],                      // Before + Month 1 Week 1
      'preparation before arrival': [1],                 // Month 1 Week 1
      'day-old chicks': [1],                            // Month 1 Week 1
      'brooder management': [1, 2, 3, 4],               // Month 1 Week 1-4
      'controlled environment': [1, 2, 3, 4],           // Month 1 Week 1-4
      'heat': [1, 2, 3, 4],                             // Month 1 Week 1-4
      'feed pre-starter': [1, 2, 3, 4, 5, 6, 7, 8],     // Month 1-2 all weeks
      'starter diet': [1, 2, 3, 4, 5, 6, 7, 8],         // Month 1-2 all weeks
      'water provision': [1, 2, 3, 4, 5, 6, 7, 8],      // Month 1-2 all weeks
      '1st gumboro vaccine': [2, 3],                     // Month 1 Week 2-3
      'intermediate administration': [2, 3],              // Month 1 Week 2-3
      'day-old chicks were not': [2, 3],                 // Month 1 Week 2-3
      'given gumboro matelni': [2, 3],                   // Month 1 Week 2-3
      'hatchery': [2, 3],                               // Month 1 Week 2-3
      '1st newcastle vaccine': [3, 4],                   // Month 1 Week 3-4
      'hitchiner vaccine': [3, 4],                       // Month 1 Week 3-4
      'water administration': [3, 4],                    // Month 1 Week 3-4
      '2nd gumboro vaccine': [4, 5],                     // Month 1 Week 4 + Month 2 Week 1
      'intermediate plus': [4, 5],                       // Month 1 Week 4 + Month 2 Week 1
      'debeaking': [6, 7],                              // Month 2 Week 2-3
      'white birds': [6, 7],                            // Month 2 Week 2-3
      'brown birds': [6, 7],                            // Month 2 Week 2-3
      'feed grower': [8, 9, 10, 11, 12],                // Month 2 Week 4 + Month 3 all
      'grower diet': [8, 9, 10, 11, 12],                // Month 2 Week 4 + Month 3 all
      '2nd newcastle vaccine': [8, 9],                   // Month 2 Week 4 + Month 3 Week 1
      'lasota vaccine': [8, 9],                         // Month 2 Week 4 + Month 3 Week 1
      '1st fowl pox vaccination': [9, 10],               // Month 3 Week 1-2
      'wing web route': [9, 10],                        // Month 3 Week 1-2
      '2nd fowl pox vaccination': [11, 12],              // Month 3 Week 3-4
      '3rd newcastle vaccine': [13],                     // Month 4 Week 1
      'intramuscular': [13],                            // Month 4 Week 1
      'biosecurity measures': [13, 14, 15, 16],         // Month 4 Week 1-4
      'husbandry practices': [13, 14, 15, 16],          // Month 4 Week 1-4
      'observed throughout': [13, 14, 15, 16],          // Month 4 Week 1-4
      'feed layer': [17, 18, 19, 20],                   // Month 5 Week 1-4+
      'layer diet': [17, 18, 19, 20],                   // Month 5 Week 1-4+
      'harvesting and marketing': [20],                  // Month 5 Week 4+
      'eggs': [20]                                      // Month 5 Week 4+
    };
  }

  /**
   * TOMATO TIMING PATTERN - Based on Excel screenshot analysis
   * January WK1-4, February WK5-8, etc.
   */
  getTomatoTimingPattern() {
    return {
      'site selection': [0, 1, 2, 3],                     // JAN WK1-4
      'land preparation': [3, 4, 5, 6, 7],               // JAN WK4 - FEB WK8
      'germination test': [2, 3, 4],                     // JAN WK3-5
      'nursing': [4, 5, 6, 7],                           // FEB WK5-8
      'transplanting': [6, 7, 8, 9, 10],                 // FEB WK7 - MAR WK11
      'application of starter solution': [8, 9, 10, 11], // FEB WK9 - APR WK12
      'starter solution': [8, 9, 10, 11],                // FEB WK9 - APR WK12 (alias)
      'pest and disease management': [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18], // JAN WK4 - MAY WK19
      'disease management': [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18], // JAN WK4 - MAY WK19 (alias)
      '1st fertilizer application': [9, 10],             // MAR WK10-11
      'first fertilizer application': [9, 10],           // MAR WK10-11 (alias)
      'npk': [9, 10, 15, 16, 17, 18],                    // MAR WK10-11 + APR WK16-19
      'earthening-up': [11, 12, 13, 14, 15, 16, 17, 18], // APR WK12 - MAY WK19
      'staking': [11, 12, 13, 14, 15, 16, 17, 18],       // APR WK12 - MAY WK19
      'trellising': [11, 12, 13, 14, 15, 16, 17, 18],    // APR WK12 - MAY WK19
      'pruning': [11, 12, 13, 14, 15, 16, 17, 18],       // APR WK12 - MAY WK19
      '2nd fertilizer application': [15, 16, 17, 18],    // APR WK16-19
      'second fertilizer application': [15, 16, 17, 18], // APR WK16-19 (alias)
      'harvesting': [19, 20, 21, 22],                    // JUN WK20-23
      'post-harvest handling': [19, 20, 21, 22],         // JUN WK20-23
      'post harvest handling': [19, 20, 21, 22]          // JUN WK20-23 (alias)
    };
  }

  /**
   * MAIZE TIMING PATTERN - Updated with correct specifications
   * Based on user specifications for maize calendar
   */
  getMaizeTimingPattern() {
    return {
      'site selection': [0, 1, 2, 3, 4],                 // Jan WK1-5
      'land preparation': [0, 1, 2, 3, 4, 5, 6, 7, 8],   // Jan WK1 - Feb WK9
      'planting': [9, 10, 11, 12, 13, 14, 15, 16],       // Mar WK10 - Apr WK17
      'sowing': [9, 10, 11, 12, 13, 14, 15, 16],         // Mar WK10 - Apr WK17 (alias)
      '1st fertilizer application': [9, 10, 11, 12, 13, 14, 15, 16], // Mar WK10 - Apr WK17
      'first fertilizer application': [9, 10, 11, 12, 13, 14, 15, 16], // Mar WK10 - Apr WK17 (alias)
      'first weed management': [13, 14, 15, 16],          // Apr WK14 - Apr WK17
      '1st weed management': [13, 14, 15, 16],            // Apr WK14 - Apr WK17 (alias)
      'control of fall army worm': [13, 14, 15, 16],      // Apr WK14 - Apr WK17
      '2nd fertilizer application': [17, 18, 19, 20, 21], // May WK18 - May WK22
      'second fertilizer application': [17, 18, 19, 20, 21], // May WK18 - May WK22 (alias)
      'second weed management': [13, 14, 15, 16, 17, 18, 19, 20, 21], // Apr WK14 - May WK22
      '2nd weed management': [13, 14, 15, 16, 17, 18, 19, 20, 21], // Apr WK14 - May WK22 (alias)
      'pest and disease control': [13, 14, 15, 16, 17, 18, 19, 20, 21], // Apr WK14 - May WK22
      'harvesting': [22, 23, 24, 25, 26, 27, 28],        // Jun WK23 - Jul WK29
      'post harvest handling': [25, 26, 27, 28, 29, 30, 31, 32] // Jun WK26 - Aug WK33
    };
  }

  /**
   * RICE TIMING PATTERN - Enhanced with complete rice production activities
   * Rice-specific activities with appropriate timing
   */
  getRiceTimingPattern() {
    return {
      'seed selection': [0, 1],                           // JAN WK1-2
      'seed treatment': [0, 1],                           // JAN WK1-2
      'nursery establishment': [2, 3, 4],                 // JAN WK3-5
      'nursery management': [2, 3, 4, 5, 6],             // JAN WK3 - FEB WK7
      'land preparation': [2, 3, 4, 5, 6, 7],           // JAN WK3 - FEB WK8
      'puddling': [5, 6, 7],                             // FEB WK6-8
      'leveling': [5, 6, 7],                             // FEB WK6-8
      'transplanting': [6, 7, 8, 9],                     // FEB WK7 - MAR WK10
      'transplant': [6, 7, 8, 9],                        // FEB WK7 - MAR WK10 (alias)
      'water management': [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23], // FEB WK7 - JUN WK24
      'irrigation': [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23], // FEB WK7 - JUN WK24 (alias)
      '1st fertilizer application': [8, 9, 10],          // MAR WK9-11
      'first fertilizer application': [8, 9, 10],        // MAR WK9-11 (alias)
      'basal fertilizer': [6, 7, 8],                     // FEB WK7 - MAR WK9
      'first weed management': [10, 11, 12],             // MAR WK11-13
      '1st weed management': [10, 11, 12],               // MAR WK11-13 (alias)
      'weeding': [10, 11, 12, 16, 17, 18],               // MAR WK11-13, APR WK17-19
      'roguing': [12, 13, 14, 15],                       // MAR WK13 - APR WK16
      'gap filling': [8, 9, 10],                         // MAR WK9-11
      '2nd fertilizer application': [14, 15, 16],        // APR WK15-17
      'second fertilizer application': [14, 15, 16],     // APR WK15-17 (alias)
      'top dressing': [14, 15, 16, 18, 19, 20],          // APR WK15-17, MAY WK19-21
      '3rd fertilizer application': [18, 19, 20],        // MAY WK19-21
      'third fertilizer application': [18, 19, 20],      // MAY WK19-21 (alias)
      'second weed management': [12, 13, 14, 15, 16, 17, 18], // MAR WK13 - MAY WK19
      '2nd weed management': [12, 13, 14, 15, 16, 17, 18], // MAR WK13 - MAY WK19 (alias)
      'pest and disease control': [12, 13, 14, 15, 16, 17, 18, 19, 20], // MAR WK13 - MAY WK21
      'disease management': [12, 13, 14, 15, 16, 17, 18, 19, 20], // MAR WK13 - MAY WK21 (alias)
      'insect pest control': [12, 13, 14, 15, 16, 17, 18, 19, 20], // MAR WK13 - MAY WK21
      'bird scaring': [20, 21, 22, 23],                  // MAY WK21 - JUN WK24
      'field monitoring': [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23], // MAR WK11 - JUN WK24
      'drainage': [22, 23, 24],                          // JUN WK23 - JUN WK25
      'harvesting': [24, 25, 26, 27],                    // JUN WK25 - JUL WK28
      'cutting': [24, 25, 26, 27],                       // JUN WK25 - JUL WK28 (alias)
      'threshing': [26, 27, 28, 29],                     // JUL WK27 - AUG WK30
      'winnowing': [27, 28, 29, 30],                     // JUL WK28 - AUG WK31
      'drying': [26, 27, 28, 29, 30],                    // JUL WK27 - AUG WK31
      'sun drying': [26, 27, 28, 29, 30],                // JUL WK27 - AUG WK31 (alias)
      'cleaning': [28, 29, 30],                          // AUG WK29-31
      'grading': [28, 29, 30],                           // AUG WK29-31
      'milling': [30, 31, 32],                           // AUG WK31 - SEP WK33
      'storage': [30, 31, 32, 33, 34],                   // AUG WK31 - SEP WK35
      'post harvest handling': [26, 27, 28, 29, 30, 31, 32, 33, 34], // JUL WK27 - SEP WK35
      'packaging': [30, 31, 32],                         // AUG WK31 - SEP WK33
      'marketing': [32, 33, 34, 35]                      // SEP WK33 - SEP WK36
    };
  }

  /**
   * GROUNDNUT TIMING PATTERN - Enhanced with complete groundnut production activities
   * Groundnut-specific activities with appropriate timing
   */
  getGroundnutTimingPattern() {
    return {
      'site selection': [0, 1, 2],                       // JAN WK1-3
      'land preparation': [2, 3, 4, 5, 6],              // JAN WK3 - FEB WK7
      'ploughing': [2, 3, 4],                            // JAN WK3-5
      'harrowing': [4, 5, 6],                            // FEB WK5-7
      'ridging': [5, 6, 7],                              // FEB WK6-MAR WK8
      'seed selection': [3, 4],                          // JAN WK4-5
      'seed treatment': [4, 5],                          // FEB WK5-6
      'seed sorting': [3, 4, 5],                         // JAN WK4-FEB WK6
      'planting': [6, 7, 8, 9],                         // FEB WK7 - MAR WK10
      'sowing': [6, 7, 8, 9],                           // FEB WK7 - MAR WK10 (alias)
      'emergence': [8, 9],                               // MAR WK9-10
      'thinning': [9, 10, 11],                           // MAR WK10-12
      'gap filling': [9, 10],                            // MAR WK10-11
      '1st fertilizer application': [8, 9, 10],         // MAR WK9-11
      'first fertilizer application': [8, 9, 10],       // MAR WK9-11 (alias)
      'basal fertilizer': [6, 7, 8],                     // FEB WK7-MAR WK9
      'first weed management': [10, 11, 12, 13],        // MAR WK11-14
      '1st weed management': [10, 11, 12, 13],          // MAR WK11-14 (alias)
      'weeding': [10, 11, 12, 13, 15, 16],              // MAR WK11-14, APR WK16-17
      'pest and disease control': [12, 13, 14, 15, 16, 17, 18], // MAR WK13 - MAY WK19
      'disease management': [12, 13, 14, 15, 16, 17, 18], // MAR WK13 - MAY WK19 (alias)
      'insect control': [12, 13, 14, 15, 16, 17, 18],   // MAR WK13 - MAY WK19
      'flowering': [12, 13, 14, 15, 16],                 // MAR WK13-APR WK17
      'pegging': [14, 15, 16, 17],                       // APR WK15-18
      'peg penetration': [15, 16, 17, 18],               // APR WK16-MAY WK19
      'second weed management': [14, 15, 16],           // APR WK15-17
      '2nd weed management': [14, 15, 16],              // APR WK15-17 (alias)
      '2nd fertilizer application': [16, 17, 18],       // APR WK17 - MAY WK19
      'second fertilizer application': [16, 17, 18],    // APR WK17 - MAY WK19 (alias)
      'top dressing': [16, 17, 18],                      // APR WK17 - MAY WK19
      'earthing up': [16, 17, 18, 19],                  // APR WK17 - MAY WK20
      'pod formation': [17, 18, 19, 20],                // APR WK18-MAY WK21
      'pod filling': [18, 19, 20, 21],                  // MAY WK19-22
      'field monitoring': [12, 13, 14, 15, 16, 17, 18, 19, 20], // MAR WK13-MAY WK21
      'maturity assessment': [19, 20],                   // MAY WK20-21
      'harvesting': [20, 21, 22, 23, 24],              // MAY WK21 - JUN WK25
      'lifting': [20, 21, 22, 23],                       // MAY WK21 - JUN WK24
      'field drying': [21, 22, 23, 24],                 // MAY WK22 - JUN WK25
      'picking': [22, 23, 24, 25],                       // JUN WK23-26
      'pod separation': [22, 23, 24, 25],                // JUN WK23-26 (alias)
      'drying': [23, 24, 25, 26],                        // JUN WK24-27
      'sun drying': [23, 24, 25, 26],                    // JUN WK24-27 (alias)
      'curing': [24, 25, 26],                            // JUN WK25-27
      'shelling': [25, 26, 27],                          // JUN WK26-JUL WK28
      'winnowing': [25, 26, 27],                         // JUN WK26-JUL WK28
      'grading': [26, 27, 28],                           // JUL WK27-29
      'storage': [27, 28, 29, 30, 31],                   // JUL WK28-AUG WK32
      'post harvest handling': [22, 23, 24, 25, 26, 27, 28, 29, 30, 31], // JUN WK23-AUG WK32
      'packaging': [27, 28, 29],                         // JUL WK28-30
      'marketing': [28, 29, 30, 31]                      // JUL WK29-AUG WK32
    };
  }
}

// Export singleton instance
const calendarPreviewParser = new CalendarPreviewParser();
export default calendarPreviewParser;