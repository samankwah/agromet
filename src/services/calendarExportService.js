/**
 * Calendar Export Service
 *
 * Provides comprehensive export functionality for agricultural calendar data
 * Supports multiple formats: CSV, PDF, Excel, and JSON
 * Features graceful degradation and fallback mechanisms
 */

// Lazy load PDF dependencies with error handling
let jsPDF = null;
let jsPDFAutoTable = null;

async function loadPDFLibraries() {
  try {
    if (!jsPDF) {
      const pdfModule = await import('jspdf');
      jsPDF = pdfModule.jsPDF;
    }

    if (!jsPDFAutoTable) {
      await import('jspdf-autotable');
      jsPDFAutoTable = true; // Flag to indicate autotable is loaded
    }

    return { success: true };
  } catch (error) {
    console.warn('⚠️ PDF libraries failed to load:', error.message);
    return { success: false, error: error.message };
  }
}

class CalendarExportService {
  constructor() {
    this.supportedFormats = ['csv', 'pdf', 'excel', 'json'];
    this.pdfCapabilityChecked = false;
    this.pdfAvailable = null;
  }

  /**
   * Check if PDF export is available
   * @returns {Promise<boolean>} PDF availability
   */
  async checkPDFCapability() {
    if (this.pdfCapabilityChecked) {
      return this.pdfAvailable;
    }

    const pdfLibs = await loadPDFLibraries();
    this.pdfAvailable = pdfLibs.success;
    this.pdfCapabilityChecked = true;

    console.log(`📄 PDF export capability: ${this.pdfAvailable ? 'Available' : 'Not Available'}`);

    return this.pdfAvailable;
  }

  /**
   * Export calendar data in specified format
   * @param {Array} activities - Calendar activities
   * @param {Object} metadata - Calendar metadata
   * @param {string} format - Export format (csv, pdf, excel, json)
   * @param {Object} options - Export options
   * @returns {Promise<Object>} Export result
   */
  async exportCalendar(activities, metadata, format = 'csv', options = {}) {
    const {
      filename = `calendar_${new Date().toISOString().split('T')[0]}`,
      includeWeatherData = true,
      includeMetadata = true,
      includeAdvisory = true
    } = options;

    try {
      console.log(`📤 Exporting calendar data as ${format.toUpperCase()}`);

      switch (format.toLowerCase()) {
        case 'csv':
          return await this.exportToCSV(activities, metadata, { filename, includeAdvisory });

        case 'pdf':
          return await this.exportToPDF(activities, metadata, { filename, includeAdvisory, includeMetadata });

        case 'excel':
          return await this.exportToExcel(activities, metadata, { filename, includeAdvisory });

        case 'json':
          return await this.exportToJSON(activities, metadata, { filename, includeMetadata, includeWeatherData });

        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

    } catch (error) {
      console.error('❌ Export error:', error);
      return {
        success: false,
        error: error.message,
        format
      };
    }
  }

  /**
   * Export to CSV format
   * @param {Array} activities - Calendar activities
   * @param {Object} metadata - Calendar metadata
   * @param {Object} options - Export options
   * @returns {Object} CSV export result
   */
  async exportToCSV(activities, metadata, options = {}) {
    const { filename, includeAdvisory = true } = options;

    // Prepare CSV headers
    const headers = [
      'Activity',
      'Start Period',
      'End Period',
      'Color',
      ...(includeAdvisory ? ['Advisory'] : []),
      'Data Source',
      'Confidence'
    ];

    // Prepare CSV rows
    const rows = activities.map(activity => [
      this.cleanForCSV(activity.activity || ''),
      activity.start || '',
      activity.end || '',
      activity.color || '',
      ...(includeAdvisory ? [this.cleanForCSV(activity.advisory || '')] : []),
      activity.metadata?.source || metadata.dataSourceUsed || '',
      activity.metadata?.confidence || metadata.confidence || 'medium'
    ]);

    // Generate CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create download
    this.downloadFile(csvContent, `${filename}.csv`, 'text/csv');

    return {
      success: true,
      format: 'csv',
      filename: `${filename}.csv`,
      recordCount: activities.length,
      downloadedAt: new Date().toISOString()
    };
  }

  /**
   * Export to PDF format
   * @param {Array} activities - Calendar activities
   * @param {Object} metadata - Calendar metadata
   * @param {Object} options - Export options
   * @returns {Object} PDF export result
   */
  async exportToPDF(activities, metadata, options = {}) {
    const { filename, includeAdvisory = true, includeMetadata = true } = options;

    // Try to load PDF libraries
    const pdfLibs = await loadPDFLibraries();
    if (!pdfLibs.success) {
      console.warn('📄 PDF export unavailable, falling back to CSV');
      return await this.exportToCSV(activities, metadata, {
        filename: `${filename}_fallback`,
        includeAdvisory
      });
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;

    // Add header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Agricultural Production Calendar', pageWidth / 2, 20, { align: 'center' });

    // Add metadata section
    let yPosition = 35;
    if (includeMetadata && metadata) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');

      const metadataLines = [
        `Generated: ${new Date().toLocaleDateString()}`,
        `Data Source: ${metadata.dataSourceUsed || 'Unknown'}`,
        `Region: ${metadata.regionCode || 'Not specified'}`,
        `Crop: ${metadata.commodity || 'Multiple'}`,
        `Activities: ${activities.length} total`,
        ...(metadata.weatherIntegration ? [`Weather Integration: ${metadata.weatherIntegration.weatherIntegrationUsed ? 'Enabled' : 'Disabled'}`] : [])
      ];

      metadataLines.forEach(line => {
        doc.text(line, 20, yPosition);
        yPosition += 7;
      });

      yPosition += 10;
    }

    // Prepare table data
    const tableColumns = [
      'Activity',
      'Start',
      'End',
      ...(includeAdvisory ? ['Advisory'] : [])
    ];

    const tableRows = activities.map(activity => [
      activity.activity || '',
      activity.start || '',
      activity.end || '',
      ...(includeAdvisory ? [this.truncateText(activity.advisory || '', 50)] : [])
    ]);

    // Add table
    doc.autoTable({
      head: [tableColumns],
      body: tableRows,
      startY: yPosition,
      margin: { horizontal: 20 },
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [46, 125, 50],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: includeAdvisory ? {
        3: { cellWidth: 60 } // Advisory column wider
      } : {}
    });

    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Page ${i} of ${pageCount} | Generated by TriAgro AI`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

      // Save PDF
      doc.save(`${filename}.pdf`);

      return {
        success: true,
        format: 'pdf',
        filename: `${filename}.pdf`,
        recordCount: activities.length,
        pageCount,
        downloadedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ PDF generation error:', error);

      // Fallback to CSV on PDF generation error
      console.warn('📄 PDF generation failed, falling back to CSV export');
      return await this.exportToCSV(activities, metadata, {
        filename: `${filename}_pdf_failed`,
        includeAdvisory
      });
    }
  }

  /**
   * Export to Excel format (simplified as CSV for now)
   * @param {Array} activities - Calendar activities
   * @param {Object} metadata - Calendar metadata
   * @param {Object} options - Export options
   * @returns {Object} Excel export result
   */
  async exportToExcel(activities, metadata, options = {}) {
    // For now, export as enhanced CSV that can be opened in Excel
    const { filename, includeAdvisory = true } = options;

    const headers = [
      'Activity Name',
      'Start Period',
      'End Period',
      'Activity Color',
      'Data Source',
      'Confidence Level',
      ...(includeAdvisory ? ['Agricultural Advisory'] : []),
      'Export Date',
      'Region',
      'Crop Type'
    ];

    const rows = activities.map(activity => [
      this.cleanForCSV(activity.activity || ''),
      activity.start || '',
      activity.end || '',
      activity.color || '',
      activity.metadata?.source || metadata.dataSourceUsed || '',
      activity.metadata?.confidence || metadata.confidence || 'medium',
      ...(includeAdvisory ? [this.cleanForCSV(activity.advisory || '')] : []),
      new Date().toISOString().split('T')[0],
      metadata.regionCode || '',
      metadata.commodity || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create download with .xlsx extension but CSV content (Excel can open it)
    this.downloadFile(csvContent, `${filename}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    return {
      success: true,
      format: 'excel',
      filename: `${filename}.xlsx`,
      recordCount: activities.length,
      downloadedAt: new Date().toISOString(),
      note: 'Exported as CSV format compatible with Excel'
    };
  }

  /**
   * Export to JSON format
   * @param {Array} activities - Calendar activities
   * @param {Object} metadata - Calendar metadata
   * @param {Object} options - Export options
   * @returns {Object} JSON export result
   */
  async exportToJSON(activities, metadata, options = {}) {
    const { filename, includeMetadata = true, includeWeatherData = true } = options;

    const exportData = {
      exportInfo: {
        format: 'json',
        version: '1.0',
        exportedAt: new Date().toISOString(),
        exportedBy: 'TriAgro AI Calendar System'
      },
      ...(includeMetadata ? { metadata } : {}),
      calendar: {
        activitiesCount: activities.length,
        activities: activities.map(activity => ({
          ...activity,
          ...(includeWeatherData && activity.weatherAdjustment ? {
            weatherAdjustment: activity.weatherAdjustment
          } : {})
        }))
      }
    };

    const jsonContent = JSON.stringify(exportData, null, 2);

    this.downloadFile(jsonContent, `${filename}.json`, 'application/json');

    return {
      success: true,
      format: 'json',
      filename: `${filename}.json`,
      recordCount: activities.length,
      includesWeatherData: includeWeatherData,
      includesMetadata: includeMetadata,
      downloadedAt: new Date().toISOString()
    };
  }

  /**
   * Generate calendar summary report
   * @param {Array} activities - Calendar activities
   * @param {Object} metadata - Calendar metadata
   * @returns {Object} Summary report
   */
  generateSummaryReport(activities, metadata) {
    const activityTypes = {};
    const monthCoverage = {};
    let totalActivities = activities.length;

    activities.forEach(activity => {
      // Count activity types
      const activityType = this.categorizeActivity(activity.activity);
      activityTypes[activityType] = (activityTypes[activityType] || 0) + 1;

      // Count month coverage
      if (activity.start) monthCoverage[activity.start] = (monthCoverage[activity.start] || 0) + 1;
      if (activity.end && activity.end !== activity.start) {
        monthCoverage[activity.end] = (monthCoverage[activity.end] || 0) + 1;
      }
    });

    return {
      totalActivities,
      activityTypes,
      monthCoverage,
      dataSource: metadata.dataSourceUsed,
      confidence: metadata.confidence,
      hasWeatherIntegration: !!(metadata.weatherIntegration?.weatherIntegrationUsed),
      peakMonths: Object.entries(monthCoverage)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([month, count]) => ({ month, activities: count }))
    };
  }

  /**
   * Categorize activity type
   * @param {string} activityName - Activity name
   * @returns {string} Activity category
   */
  categorizeActivity(activityName) {
    const name = (activityName || '').toLowerCase();

    if (name.includes('site') || name.includes('select')) return 'Site Selection';
    if (name.includes('land') || name.includes('prepar')) return 'Land Preparation';
    if (name.includes('plant') || name.includes('sow')) return 'Planting';
    if (name.includes('fertiliz') || name.includes('nutri')) return 'Fertilization';
    if (name.includes('weed') || name.includes('pest')) return 'Crop Protection';
    if (name.includes('harvest')) return 'Harvesting';
    if (name.includes('water') || name.includes('irrigat')) return 'Water Management';

    return 'Other';
  }

  /**
   * Clean text for CSV format
   * @param {string} text - Text to clean
   * @returns {string} Cleaned text
   */
  cleanForCSV(text) {
    return (text || '')
      .replace(/"/g, '""')
      .replace(/\n/g, ' ')
      .replace(/\r/g, ' ')
      .trim();
  }

  /**
   * Truncate text to specified length
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated text
   */
  truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Download file helper
   * @param {string} content - File content
   * @param {string} filename - File name
   * @param {string} mimeType - MIME type
   */
  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
  }

  /**
   * Get supported export formats
   * @returns {Promise<Array>} Supported formats with dynamic availability
   */
  async getSupportedFormats() {
    const pdfAvailable = await this.checkPDFCapability();

    const allFormats = [
      {
        value: 'csv',
        label: 'CSV',
        description: this.getFormatDescription('csv'),
        available: true
      },
      {
        value: 'pdf',
        label: 'PDF',
        description: pdfAvailable
          ? this.getFormatDescription('pdf')
          : 'PDF export currently unavailable (will fallback to CSV)',
        available: pdfAvailable,
        fallback: !pdfAvailable ? 'csv' : null
      },
      {
        value: 'excel',
        label: 'EXCEL',
        description: this.getFormatDescription('excel'),
        available: true
      },
      {
        value: 'json',
        label: 'JSON',
        description: this.getFormatDescription('json'),
        available: true
      }
    ];

    return allFormats;
  }

  /**
   * Get supported export formats (synchronous version for immediate use)
   * @returns {Array} Supported formats
   */
  getSupportedFormatsSync() {
    return this.supportedFormats.map(format => ({
      value: format,
      label: format.toUpperCase(),
      description: this.getFormatDescription(format)
    }));
  }

  /**
   * Get format description
   * @param {string} format - Format name
   * @returns {string} Format description
   */
  getFormatDescription(format) {
    const descriptions = {
      csv: 'Comma-separated values, compatible with Excel and Google Sheets',
      pdf: 'Formatted document with tables and metadata',
      excel: 'Microsoft Excel compatible spreadsheet format',
      json: 'Structured data format including all metadata and weather data'
    };

    return descriptions[format] || 'Unknown format';
  }
}

export default new CalendarExportService();