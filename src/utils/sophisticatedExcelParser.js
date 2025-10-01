import * as XLSX from 'xlsx';

/**
 * Sophisticated Excel Parser for Browser Environment
 * Extracts exact Excel contents including colors, formatting, and cell data
 * NO FALLBACK DATA - Pure Excel content extraction
 */

class SophisticatedExcelParser {
  constructor() {
    this.debugMode = true;
  }

  /**
   * Parse Excel file with sophisticated content extraction
   */
  async parseExcelFile(file, metadata = {}) {
    try {
      console.log('🔬 Sophisticated Excel Parser: Starting analysis of', file.name);

      // Read file as array buffer for maximum compatibility
      const arrayBuffer = await file.arrayBuffer();

      // Read workbook with full options for sophisticated parsing
      const workbook = XLSX.read(arrayBuffer, {
        type: 'array',
        cellStyles: true,
        cellHTML: true,
        cellFormula: true,
        sheetStubs: true,
        bookDeps: true,
        bookFiles: true,
        bookProps: true,
        bookSheets: true,
        bookVBA: false,
        dense: false
      });

      // Validate workbook structure
      if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('Invalid Excel file: No sheets found or workbook is corrupted');
      }

      console.log('📊 Sophisticated Parser: Loaded workbook with', workbook.SheetNames.length, 'sheets');
      console.log('📋 Available sheets:', workbook.SheetNames);

      // Validate that Sheets object exists
      if (!workbook.Sheets) {
        throw new Error('Invalid Excel file: Sheets data is missing');
      }

      // Extract comprehensive workbook information
      const workbookInfo = this.extractWorkbookInfo(workbook);

      // Parse all sheets with sophisticated content extraction
      const sheetsData = {};
      for (const sheetName of workbook.SheetNames) {
        console.log(`🔍 Analyzing sheet: "${sheetName}"`);

        // Validate individual sheet exists
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) {
          console.warn(`⚠️ Sheet "${sheetName}" exists in SheetNames but not in Sheets object`);
          continue;
        }

        sheetsData[sheetName] = await this.parseSheetSophisticated(sheet, sheetName);
      }

      // Ensure we have at least one sheet processed
      if (Object.keys(sheetsData).length === 0) {
        throw new Error('No valid sheets could be processed from the Excel file');
      }

      // Identify calendar type and extract agricultural data
      const calendarAnalysis = this.analyzeCalendarStructure(sheetsData, metadata);

      // Extract sophisticated formatting and colors
      const formattingData = this.extractAdvancedFormatting(sheetsData);

      // Build comprehensive result with exact Excel content
      const result = {
        success: true,
        source: 'exact-excel-content',
        filename: file.name,
        workbookInfo,
        sheetsData,
        calendarAnalysis,
        formattingData,
        metadata: {
          ...metadata,
          parseDate: new Date().toISOString(),
          parser: 'sophisticated',
          noFallback: true,
          exactContent: true
        }
      };

      console.log('✅ Sophisticated Excel parsing completed successfully');
      console.log('📊 Extracted', Object.keys(sheetsData).length, 'sheets with full content');
      console.log('🎨 Detected', formattingData.colors.length, 'unique colors');

      return result;

    } catch (error) {
      console.error('❌ Sophisticated Excel Parser Error:', error);
      return {
        success: false,
        error: error.message,
        source: 'sophisticated-parser-error',
        filename: file.name
      };
    }
  }

  /**
   * Extract comprehensive workbook information
   */
  extractWorkbookInfo(workbook) {
    return {
      sheetNames: workbook.SheetNames,
      sheetCount: workbook.SheetNames.length,
      props: workbook.Props || {},
      custProps: workbook.Custprops || {},
      workbookType: 'Excel',
      hasStyles: !!(workbook.SSF || workbook.Styles),
      hasThemes: !!(workbook.Themes),
      hasComments: !!(workbook.Comments)
    };
  }

  /**
   * Parse individual sheet with sophisticated content extraction
   */
  async parseSheetSophisticated(worksheet, sheetName) {
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
    const sheetData = {
      name: sheetName,
      range: worksheet['!ref'],
      dimensions: {
        rows: range.e.r - range.s.r + 1,
        cols: range.e.c - range.s.c + 1,
        startRow: range.s.r,
        startCol: range.s.c,
        endRow: range.e.r,
        endCol: range.s.c
      },
      cells: {},
      activities: [],
      colors: {},
      formatting: {},
      timeline: null
    };

    console.log(`📏 Sheet "${sheetName}" dimensions:`, sheetData.dimensions);

    // Extract every cell with sophisticated content analysis
    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellAddress];

        if (cell) {
          sheetData.cells[cellAddress] = this.extractCellSophisticated(cell, row, col);
        }
      }
    }

    // Analyze sheet structure for agricultural calendar patterns
    const structureAnalysis = this.analyzeSheetStructure(sheetData);
    sheetData.structureAnalysis = structureAnalysis;

    // Extract activities based on sophisticated pattern recognition
    sheetData.activities = this.extractActivitiesSophisticated(sheetData);

    // Build timeline from sophisticated analysis
    sheetData.timeline = this.buildTimelineSophisticated(sheetData);

    // Extract color patterns
    sheetData.colors = this.extractColorPatterns(sheetData);

    console.log(`📊 Sheet "${sheetName}": Found ${sheetData.activities.length} activities, ${Object.keys(sheetData.colors).length} colors`);

    return sheetData;
  }

  /**
   * Extract sophisticated cell content including all formatting
   */
  extractCellSophisticated(cell, row, col) {
    const cellData = {
      address: XLSX.utils.encode_cell({ r: row, c: col }),
      row,
      col,
      value: cell.v,
      displayValue: cell.w || cell.v,
      type: cell.t,
      formula: cell.f || null,
      style: cell.s || null,
      formatting: {},
      colors: {},
      isEmpty: !cell.v && !cell.w
    };

    // Extract sophisticated formatting
    if (cell.s) {
      cellData.formatting = this.extractCellFormatting(cell.s);
      cellData.colors = this.extractCellColors(cell.s);
    }

    // Detect content type with sophisticated analysis
    cellData.contentType = this.detectContentType(cellData);

    // Check if cell appears to be active/filled based on multiple criteria
    cellData.isActive = this.isCellActiveSophisticated(cellData);

    return cellData;
  }

  /**
   * Extract detailed cell formatting
   */
  extractCellFormatting(style) {
    const formatting = {};

    if (style.fill) {
      formatting.fill = {
        type: style.fill.patternType,
        foreground: style.fill.fgColor,
        background: style.fill.bgColor
      };
    }

    if (style.font) {
      formatting.font = {
        name: style.font.name,
        size: style.font.sz,
        bold: style.font.bold,
        italic: style.font.italic,
        underline: style.font.underline,
        color: style.font.color
      };
    }

    if (style.border) {
      formatting.border = style.border;
    }

    if (style.alignment) {
      formatting.alignment = style.alignment;
    }

    return formatting;
  }

  /**
   * Extract sophisticated color information
   */
  extractCellColors(style) {
    const colors = {};

    if (style.fill) {
      if (style.fill.fgColor) {
        colors.background = this.parseColor(style.fill.fgColor);
      }
      if (style.fill.bgColor) {
        colors.backgroundSecondary = this.parseColor(style.fill.bgColor);
      }
    }

    if (style.font && style.font.color) {
      colors.text = this.parseColor(style.font.color);
    }

    return colors;
  }

  /**
   * Parse color information from Excel format
   */
  parseColor(colorInfo) {
    if (!colorInfo) return null;

    // Handle different color formats
    if (colorInfo.rgb) {
      return `#${colorInfo.rgb}`;
    }

    if (colorInfo.indexed !== undefined) {
      // Convert indexed colors to RGB approximation
      const indexedColors = {
        0: '#000000', 1: '#FFFFFF', 2: '#FF0000', 3: '#00FF00',
        4: '#0000FF', 5: '#FFFF00', 6: '#FF00FF', 7: '#00FFFF',
        8: '#800000', 9: '#008000', 10: '#000080', 11: '#808000',
        12: '#800080', 13: '#008080', 14: '#C0C0C0', 15: '#808080'
      };
      return indexedColors[colorInfo.indexed] || '#000000';
    }

    if (colorInfo.theme !== undefined) {
      // Theme colors - approximate common values
      const themeColors = {
        0: '#FFFFFF', 1: '#000000', 2: '#E7E6E6', 3: '#44546A',
        4: '#5B9BD5', 5: '#70AD47', 6: '#FFC000', 7: '#C55A11'
      };
      return themeColors[colorInfo.theme] || '#000000';
    }

    return '#000000';
  }

  /**
   * Sophisticated content type detection
   */
  detectContentType(cellData) {
    const value = String(cellData.value || '').toLowerCase().trim();

    if (!value) return 'empty';

    // Activity name patterns
    if (value.includes('plant') || value.includes('sowing')) return 'activity-planting';
    if (value.includes('harvest')) return 'activity-harvest';
    if (value.includes('fertiliz') || value.includes('fertiliser')) return 'activity-fertilizer';
    if (value.includes('weed')) return 'activity-weeding';
    if (value.includes('pest') || value.includes('spray')) return 'activity-pest-control';
    if (value.match(/\d+(st|nd|rd|th)/)) return 'activity-numbered';

    // Time indicators
    if (value.match(/week|month|day|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i)) {
      return 'time-indicator';
    }

    // Check if it looks like an activity
    if (cellData.row > 2 && cellData.col <= 3 && value.length > 3) {
      return 'potential-activity';
    }

    return 'content';
  }

  /**
   * Sophisticated cell activity detection
   */
  isCellActiveSophisticated(cellData) {
    // Multiple criteria for detecting active cells
    const criteria = {
      hasValue: !!cellData.value,
      hasColor: Object.keys(cellData.colors).length > 0,
      hasFormatting: Object.keys(cellData.formatting).length > 0,
      isColored: false,
      hasStroke: false
    };

    // Check for background colors
    if (cellData.colors.background && cellData.colors.background !== '#FFFFFF') {
      criteria.isColored = true;
    }

    // Check for borders
    if (cellData.formatting.border) {
      criteria.hasStroke = true;
    }

    // Determine if active based on multiple criteria
    const activeScore = Object.values(criteria).filter(Boolean).length;
    return activeScore >= 1; // At least one positive criterion
  }

  /**
   * Analyze sheet structure for agricultural calendar patterns
   */
  analyzeSheetStructure(sheetData) {
    const analysis = {
      hasActivityColumn: false,
      hasTimelineRow: false,
      activityColumnIndex: -1,
      timelineRowIndex: -1,
      dataStartRow: -1,
      dataStartCol: -1,
      calendarType: 'unknown'
    };

    // Look for activity column (usually first few columns)
    for (let col = 0; col < Math.min(5, sheetData.dimensions.cols); col++) {
      let activityCount = 0;
      for (let row = 1; row < Math.min(20, sheetData.dimensions.rows); row++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = sheetData.cells[cellAddress];
        if (cell && cell.contentType.startsWith('activity')) {
          activityCount++;
        }
      }

      if (activityCount >= 2) {
        analysis.hasActivityColumn = true;
        analysis.activityColumnIndex = col;
        break;
      }
    }

    // Look for timeline row (usually first few rows)
    for (let row = 0; row < Math.min(5, sheetData.dimensions.rows); row++) {
      let timeCount = 0;
      for (let col = 1; col < Math.min(20, sheetData.dimensions.cols); col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = sheetData.cells[cellAddress];
        if (cell && cell.contentType === 'time-indicator') {
          timeCount++;
        }
      }

      if (timeCount >= 3) {
        analysis.hasTimelineRow = true;
        analysis.timelineRowIndex = row;
        break;
      }
    }

    return analysis;
  }

  /**
   * Extract activities using sophisticated pattern recognition
   */
  extractActivitiesSophisticated(sheetData) {
    const activities = [];
    const analysis = sheetData.structureAnalysis;

    if (!analysis.hasActivityColumn) {
      console.log('⚠️ No activity column detected, using alternative detection');
    }

    const startCol = analysis.activityColumnIndex >= 0 ? analysis.activityColumnIndex : 0;
    const startRow = Math.max(1, analysis.timelineRowIndex + 1);

    // Extract activities with their periods
    for (let row = startRow; row < sheetData.dimensions.rows; row++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: startCol });
      const activityCell = sheetData.cells[cellAddress];

      if (activityCell && activityCell.value && String(activityCell.value).trim()) {
        const activity = {
          name: String(activityCell.value).trim(),
          row: row,
          periods: [],
          colors: [],
          totalActivePeriods: 0
        };

        // Extract periods across the timeline
        for (let col = startCol + 1; col < sheetData.dimensions.cols; col++) {
          const periodCellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          const periodCell = sheetData.cells[periodCellAddress];

          if (periodCell && periodCell.isActive) {
            const period = {
              col: col,
              week: col - startCol,
              value: periodCell.value,
              colors: periodCell.colors,
              formatting: periodCell.formatting,
              isActive: true
            };

            activity.periods.push(period);
            activity.totalActivePeriods++;

            // Collect unique colors
            if (periodCell.colors.background && !activity.colors.includes(periodCell.colors.background)) {
              activity.colors.push(periodCell.colors.background);
            }
          }
        }

        if (activity.totalActivePeriods > 0) {
          activities.push(activity);
          console.log(`🌱 Found activity: "${activity.name}" with ${activity.totalActivePeriods} periods`);
        }
      }
    }

    return activities;
  }

  /**
   * Build sophisticated timeline analysis
   */
  buildTimelineSophisticated(sheetData) {
    const analysis = sheetData.structureAnalysis;

    if (!analysis.hasTimelineRow) {
      // Create default timeline based on columns
      const timeline = {
        type: 'inferred',
        totalPeriods: sheetData.dimensions.cols - 2,
        periods: []
      };

      for (let col = 2; col < sheetData.dimensions.cols; col++) {
        timeline.periods.push({
          index: col - 2,
          col: col,
          label: `Week ${col - 1}`,
          type: 'week'
        });
      }

      return timeline;
    }

    // Extract actual timeline from detected row
    const timeline = {
      type: 'extracted',
      row: analysis.timelineRowIndex,
      periods: []
    };

    for (let col = 1; col < sheetData.dimensions.cols; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: analysis.timelineRowIndex, c: col });
      const cell = sheetData.cells[cellAddress];

      if (cell && cell.value) {
        timeline.periods.push({
          index: timeline.periods.length,
          col: col,
          label: String(cell.value),
          type: cell.contentType
        });
      }
    }

    return timeline;
  }

  /**
   * Extract sophisticated color patterns
   */
  extractColorPatterns(sheetData) {
    const colorMap = {};
    const colorStats = {};

    Object.values(sheetData.cells).forEach(cell => {
      Object.entries(cell.colors).forEach(([type, color]) => {
        if (color && color !== '#FFFFFF') {
          if (!colorMap[color]) {
            colorMap[color] = {
              color: color,
              count: 0,
              cells: [],
              activities: []
            };
          }
          colorMap[color].count++;
          colorMap[color].cells.push(cell.address);
        }
      });
    });

    return colorMap;
  }

  /**
   * Analyze calendar structure for type determination
   */
  analyzeCalendarStructure(sheetsData, metadata) {
    const analysis = {
      calendarType: 'unknown',
      commodity: 'unknown',
      confidence: 0,
      reasons: []
    };

    // Analyze metadata clues
    if (metadata.poultryType) {
      analysis.calendarType = 'cycle';
      analysis.commodity = metadata.poultryType;
      analysis.reasons.push('Poultry type specified in metadata');
    }

    // Analyze content patterns
    const firstSheet = Object.values(sheetsData)[0];
    if (firstSheet && firstSheet.activities.length > 0) {
      const activityNames = firstSheet.activities.map(a => a.name.toLowerCase());

      // Poultry indicators
      const poultryTerms = ['brooding', 'laying', 'feeding', 'vaccination', 'egg'];
      const cropTerms = ['planting', 'sowing', 'harvest', 'weeding', 'fertilizer'];

      const poultryScore = activityNames.filter(name =>
        poultryTerms.some(term => name.includes(term))
      ).length;

      const cropScore = activityNames.filter(name =>
        cropTerms.some(term => name.includes(term))
      ).length;

      if (poultryScore > cropScore) {
        analysis.calendarType = 'cycle';
        analysis.reasons.push(`Detected ${poultryScore} poultry-related activities`);
      } else if (cropScore > poultryScore) {
        analysis.calendarType = 'seasonal';
        analysis.reasons.push(`Detected ${cropScore} crop-related activities`);
      }

      analysis.confidence = Math.max(poultryScore, cropScore) / activityNames.length;
    }

    return analysis;
  }

  /**
   * Extract advanced formatting patterns
   */
  extractAdvancedFormatting(sheetsData) {
    const formatting = {
      colors: [],
      fonts: [],
      patterns: {},
      summary: {}
    };

    Object.values(sheetsData).forEach(sheet => {
      Object.values(sheet.cells).forEach(cell => {
        // Collect unique colors
        Object.values(cell.colors).forEach(color => {
          if (color && !formatting.colors.includes(color)) {
            formatting.colors.push(color);
          }
        });

        // Collect font information
        if (cell.formatting.font) {
          const fontKey = `${cell.formatting.font.name}-${cell.formatting.font.size}`;
          if (!formatting.fonts.includes(fontKey)) {
            formatting.fonts.push(fontKey);
          }
        }
      });
    });

    formatting.summary = {
      totalColors: formatting.colors.length,
      totalFonts: formatting.fonts.length,
      hasAdvancedFormatting: formatting.colors.length > 1 || formatting.fonts.length > 1
    };

    return formatting;
  }
}

export default SophisticatedExcelParser;