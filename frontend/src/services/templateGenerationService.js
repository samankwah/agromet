import * as XLSX from 'xlsx';

// Template generation service based on Ghana agricultural advisory formats
class TemplateGenerationService {
  
  // Generate Agrometeorological Advisory Template (Multi-sheet format like tomato_agrometerologicalforcast.xlsx)
  static generateAgrometAdvisoryTemplate(crop = 'Tomato', region = 'Greater Accra Region', district = 'La-Dade-Kotopon') {
    const workbook = XLSX.utils.book_new();
    
    // Production stages for agricultural activities
    const stages = [
      'SITE SELECTION',
      'LAND PREPARATION', 
      'SEED PREPARATION',
      'PLANTING/SOWING',
      'FERTILIZER APPLICATION',
      'WEEDING',
      'PEST CONTROL',
      'DISEASE CONTROL',
      'HARVESTING',
      'POST HARVEST HANDLING'
    ];

    stages.forEach(stage => {
      const sheetData = [
        // Header row
        ['[ZONE]', '[REGION]', '[DISTRICT]', '[MONTH/YEAR]', '[WEEK]', '[START DATE]', '[END DATE]', '[CROP]'],
        
        // Sample data row
        ['Enter Zone', `REG07/${region}`, `DS148/${district}`, 'Enter Month/Year', 'ENTER WEEK', 'DD/MM/YYYY', 'DD/MM/YYYY', crop],
        
        // Empty row
        ['', '', '', '', '', '', '', ''],
        
        // Weather headers
        ['', '[RAINFALL]', '[TEMP]', '[HUMIDITY]', '[SOIL MOISTURE]', '[WIND SPEED]', '[SOLAR RADIATION]', ''],
        
        // Forecast row
        ['[FORECAST]', '', '', '', '', '', '', ''],
        ['Expected mm', 'Min-Max °C', '%', '%', 'km/h', 'MJ/m²', '', ''],
        
        // Empty rows for data entry
        ...Array(10).fill(['', '', '', '', '', '', '', '']),
        
        // Advisory sections
        ['', '', '', '', '', '', '', ''],
        ['[AGRICULTURAL ACTIVITIES]', '', '', '', '', '', '', ''],
        ['Activity', 'Timing', 'Method', 'Materials Needed', 'Weather Consideration', 'Expected Outcome', '', ''],
        
        // Sample activities for this stage
        [`${stage} activities`, 'Optimal timing', 'Recommended method', 'Required materials', 'Weather requirements', 'Expected results', '', ''],
        ...Array(5).fill(['', '', '', '', '', '', '', '']),
        
        // Recommendations section
        ['', '', '', '', '', '', '', ''],
        ['[RECOMMENDATIONS]', '', '', '', '', '', '', ''],
        ['Recommendation Type', 'Description', 'Timing', 'Expected Benefit', '', '', '', ''],
        ['Weather-based advice', 'Specific recommendation', 'When to implement', 'Expected outcome', '', '', '', ''],
        ...Array(8).fill(['', '', '', '', '', '', '', '']),
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
      
      // Set column widths
      worksheet['!cols'] = [
        { width: 15 }, // Zone
        { width: 20 }, // Region
        { width: 20 }, // District
        { width: 15 }, // Month/Year
        { width: 10 }, // Week
        { width: 12 }, // Start Date
        { width: 12 }, // End Date
        { width: 15 }  // Crop
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, stage);
    });

    return workbook;
  }

  // Generate Crop Calendar Template (Format like BIAKOYE CALENDAR FOR MAIZE.xlsx)
  static generateCropCalendarTemplate(crop = 'Maize', region = 'Oti Region', district = 'Biakoye') {
    const workbook = XLSX.utils.book_new();
    
    // Create weeks data for the year
    const weeks = [];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    
    // Generate week structure
    let weekCounter = 1;
    months.forEach(month => {
      for (let week = 1; week <= 4; week++) {
        weeks.push({
          month: month,
          week: `WK${week}`,
          weekNumber: weekCounter,
          dateRange: this.getWeekDateRange(weekCounter)
        });
        weekCounter++;
      }
    });

    // Major Season Calendar
    const majorSeasonData = [
      [`2025 CROPPING CALENDAR FOR ${crop.toUpperCase()} PRODUCTION-${region.toUpperCase()}, ${district.toUpperCase()} DISTRICT`],
      [`${crop.toUpperCase()} PRODUCTION - MAJOR SEASON`],
      ['S/N', 'STAGE OF ACTIVITY', ...months.slice(0, 6)], // First 6 months for major season
      ['', '', ...Array(6).fill().map((_, i) => `WK1 WK2 WK3 WK4`)],
      ['', 'Calendar Date', ...weeks.slice(0, 24).map(w => w.dateRange)],
      
      // Agricultural activities
      ['1', 'Site Selection', '', '', '', '', '', ''],
      ['2', 'Land Preparation', '', '', '', '', '', ''],
      ['3', 'Seed Preparation', '', '', '', '', '', ''],
      ['4', 'Planting/Sowing', '', '', '', '', '', ''],
      ['5', 'First Weeding', '', '', '', '', '', ''],
      ['6', 'Fertilizer Application', '', '', '', '', '', ''],
      ['7', 'Second Weeding', '', '', '', '', '', ''],
      ['8', 'Pest Control', '', '', '', '', '', ''],
      ['9', 'Disease Control', '', '', '', '', '', ''],
      ['10', 'Harvesting', '', '', '', '', '', ''],
      ['11', 'Post-Harvest Handling', '', '', '', '', '', ''],
      
      // Empty rows for additional activities
      ...Array(5).fill(['', '', '', '', '', '', '', '']),
    ];

    const majorSeasonSheet = XLSX.utils.aoa_to_sheet(majorSeasonData);
    
    // Set column widths
    majorSeasonSheet['!cols'] = [
      { width: 5 },   // S/N
      { width: 25 },  // Stage of Activity
      ...Array(6).fill({ width: 15 }) // Months
    ];

    XLSX.utils.book_append_sheet(workbook, majorSeasonSheet, 'Major Season');

    // Minor Season Calendar
    const minorSeasonData = [
      [`2025 CROPPING CALENDAR FOR ${crop.toUpperCase()} PRODUCTION-${region.toUpperCase()}, ${district.toUpperCase()} DISTRICT`],
      [`${crop.toUpperCase()} PRODUCTION - MINOR SEASON`],
      ['S/N', 'STAGE OF ACTIVITY', ...months.slice(6, 12)], // Last 6 months for minor season
      ['', '', ...Array(6).fill().map((_, i) => `WK1 WK2 WK3 WK4`)],
      ['', 'Calendar Date', ...weeks.slice(24, 48).map(w => w.dateRange)],
      
      // Agricultural activities (same as major season)
      ['1', 'Site Selection', '', '', '', '', '', ''],
      ['2', 'Land Preparation', '', '', '', '', '', ''],
      ['3', 'Seed Preparation', '', '', '', '', '', ''],
      ['4', 'Planting/Sowing', '', '', '', '', '', ''],
      ['5', 'First Weeding', '', '', '', '', '', ''],
      ['6', 'Fertilizer Application', '', '', '', '', '', ''],
      ['7', 'Second Weeding', '', '', '', '', '', ''],
      ['8', 'Pest Control', '', '', '', '', '', ''],
      ['9', 'Disease Control', '', '', '', '', '', ''],
      ['10', 'Harvesting', '', '', '', '', '', ''],
      ['11', 'Post-Harvest Handling', '', '', '', '', '', ''],
      
      // Empty rows for additional activities
      ...Array(5).fill(['', '', '', '', '', '', '', '']),
    ];

    const minorSeasonSheet = XLSX.utils.aoa_to_sheet(minorSeasonData);
    
    // Set column widths
    minorSeasonSheet['!cols'] = [
      { width: 5 },   // S/N
      { width: 25 },  // Stage of Activity
      ...Array(6).fill({ width: 15 }) // Months
    ];

    XLSX.utils.book_append_sheet(workbook, minorSeasonSheet, 'Minor Season');

    return workbook;
  }

  // Generate Poultry Calendar Template
  static generatePoultryCalendarTemplate(poultryType = 'Broiler', breed = 'Cobb 500', region = 'Greater Accra Region', district = 'Accra Metro') {
    const workbook = XLSX.utils.book_new();
    
    const weeks = Array.from({length: 52}, (_, i) => ({
      week: i + 1,
      dateRange: this.getWeekDateRange(i + 1)
    }));

    const poultryData = [
      [`2025 ${poultryType.toUpperCase()} PRODUCTION CALENDAR-${region.toUpperCase()}, ${district.toUpperCase()} DISTRICT`],
      [`${poultryType.toUpperCase()} (${breed}) PRODUCTION SCHEDULE`],
      ['S/N', 'PRODUCTION STAGE', 'WEEK 1-13', 'WEEK 14-26', 'WEEK 27-39', 'WEEK 40-52'],
      ['', '', 'JAN-MAR', 'APR-JUN', 'JUL-SEP', 'OCT-DEC'],
      
      // Poultry production stages
      ['1', 'Brooding (Day 1-21)', '', '', '', ''],
      ['2', 'Starter Phase (Day 1-14)', '', '', '', ''],
      ['3', 'Grower Phase (Day 15-35)', '', '', '', ''],
      ['4', 'Finisher Phase (Day 36-42)', '', '', '', ''],
      ['5', 'Processing', '', '', '', ''],
      
      // Health management
      ['', 'HEALTH MANAGEMENT', '', '', '', ''],
      ['6', 'Vaccination Schedule', '', '', '', ''],
      ['7', 'Disease Prevention', '', '', '', ''],
      ['8', 'Feed Management', '', '', '', ''],
      ['9', 'Water Management', '', '', '', ''],
      ['10', 'Environmental Control', '', '', '', ''],
      
      // Empty rows
      ...Array(5).fill(['', '', '', '', '', '']),
      
      // Notes section
      ['', 'NOTES & RECOMMENDATIONS', '', '', '', ''],
      ['', 'Temperature Requirements:', '32-35°C (Week 1)', '25-30°C (Week 2-3)', '20-25°C (Week 4+)', ''],
      ['', 'Humidity Requirements:', '60-70%', '60-65%', '55-65%', ''],
      ['', 'Feed Consumption:', 'Starter: 0.5kg', 'Grower: 1.2kg', 'Finisher: 1.8kg', ''],
    ];

    const poultrySheet = XLSX.utils.aoa_to_sheet(poultryData);
    
    // Set column widths
    poultrySheet['!cols'] = [
      { width: 5 },   // S/N
      { width: 30 },  // Production Stage
      { width: 15 },  // Week 1-13
      { width: 15 },  // Week 14-26
      { width: 15 },  // Week 27-39
      { width: 15 }   // Week 40-52
    ];

    XLSX.utils.book_append_sheet(workbook, poultrySheet, 'Production Calendar');

    return workbook;
  }

  // Generate Poultry Advisory Template
  static generatePoultryAdvisoryTemplate(poultryType = 'Broiler', region = 'Greater Accra Region', district = 'Accra Metro') {
    const workbook = XLSX.utils.book_new();
    
    const advisoryStages = [
      'BROODING MANAGEMENT',
      'FEEDING MANAGEMENT', 
      'HEALTH MANAGEMENT',
      'VACCINATION SCHEDULE',
      'DISEASE PREVENTION',
      'ENVIRONMENTAL CONTROL'
    ];

    advisoryStages.forEach(stage => {
      const sheetData = [
        // Header row
        ['[REGION]', '[DISTRICT]', '[POULTRY TYPE]', '[BREED]', '[PRODUCTION STAGE]', '[WEEK]', '[AGE (Days)]', '[ADVISORY TYPE]'],
        
        // Sample data
        [region, district, poultryType, 'Enter Breed', stage, 'Enter Week', 'Enter Age', 'Health Advisory'],
        
        // Empty row
        ['', '', '', '', '', '', '', ''],
        
        // Management parameters
        ['[MANAGEMENT PARAMETERS]', '', '', '', '', '', '', ''],
        ['Parameter', 'Recommended Value', 'Minimum', 'Maximum', 'Unit', 'Notes', '', ''],
        ['Temperature', '32°C', '30°C', '35°C', '°C', 'Day 1-7', '', ''],
        ['Humidity', '65%', '60%', '70%', '%', 'Optimal range', '', ''],
        ['Feed Intake', '50g', '40g', '60g', 'g/bird/day', 'Week 1', '', ''],
        ['Water Intake', '100ml', '80ml', '120ml', 'ml/bird/day', 'Week 1', '', ''],
        
        // Empty rows
        ...Array(5).fill(['', '', '', '', '', '', '', '']),
        
        // Health monitoring
        ['[HEALTH MONITORING]', '', '', '', '', '', '', ''],
        ['Health Indicator', 'Normal Range', 'Action Required If', 'Recommended Action', 'Frequency', '', '', ''],
        ['Mortality Rate', '<2%', '>5%', 'Investigate cause', 'Daily', '', '', ''],
        ['Feed Conversion', '1.5-1.8', '>2.0', 'Review feed quality', 'Weekly', '', '', ''],
        ['Body Weight', 'Breed standard', '<80% standard', 'Adjust nutrition', 'Weekly', '', '', ''],
        
        // Empty rows
        ...Array(5).fill(['', '', '', '', '', '', '', '']),
        
        // Recommendations
        ['[SPECIFIC RECOMMENDATIONS]', '', '', '', '', '', '', ''],
        ['Recommendation', 'Implementation Method', 'Timing', 'Expected Outcome', 'Cost Estimate', '', '', ''],
        ['Vaccination program', 'Follow schedule', 'As per calendar', 'Disease prevention', 'Low', '', '', ''],
        ['Feed quality check', 'Visual inspection', 'Daily', 'Optimal nutrition', 'Minimal', '', '', ''],
        
        // Empty rows for additional recommendations
        ...Array(8).fill(['', '', '', '', '', '', '', '']),
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
      
      // Set column widths
      worksheet['!cols'] = [
        { width: 20 }, // Region/Parameter
        { width: 20 }, // District/Value
        { width: 15 }, // Poultry Type
        { width: 15 }, // Breed
        { width: 20 }, // Production Stage
        { width: 10 }, // Week
        { width: 12 }, // Age
        { width: 15 }  // Advisory Type
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, stage);
    });

    return workbook;
  }

  // Utility function to get week date ranges
  static getWeekDateRange(weekNumber) {
    const startDate = new Date(2025, 0, 1); // January 1, 2025
    const startOfWeek = new Date(startDate.getTime() + (weekNumber - 1) * 7 * 24 * 60 * 60 * 1000);
    const endOfWeek = new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000);
    
    const formatDate = (date) => {
      const day = date.getDate();
      const month = date.getMonth() + 1;
      return `${day}/${month}`;
    };
    
    return `${formatDate(startOfWeek)}-${formatDate(endOfWeek)}`;
  }

  // Generate and download template
  static downloadTemplate(templateType, options = {}) {
    let workbook;
    let filename;

    switch (templateType) {
      case 'agromet-advisory':
        workbook = this.generateAgrometAdvisoryTemplate(
          options.crop || 'Tomato',
          options.region || 'Greater Accra Region', 
          options.district || 'La-Dade-Kotopon'
        );
        filename = `agromet_advisory_${options.crop || 'tomato'}_template.xlsx`;
        break;
        
      case 'crop-calendar':
        workbook = this.generateCropCalendarTemplate(
          options.crop || 'Maize',
          options.region || 'Oti Region',
          options.district || 'Biakoye'
        );
        filename = `crop_calendar_${options.crop || 'maize'}_template.xlsx`;
        break;
        
      case 'poultry-calendar':
        workbook = this.generatePoultryCalendarTemplate(
          options.poultryType || 'Broiler',
          options.breed || 'Cobb 500',
          options.region || 'Greater Accra Region',
          options.district || 'Accra Metro'
        );
        filename = `poultry_calendar_${options.poultryType || 'broiler'}_template.xlsx`;
        break;
        
      case 'poultry-advisory':
        workbook = this.generatePoultryAdvisoryTemplate(
          options.poultryType || 'Broiler',
          options.region || 'Greater Accra Region',
          options.district || 'Accra Metro'
        );
        filename = `poultry_advisory_${options.poultryType || 'broiler'}_template.xlsx`;
        break;
        
      default:
        throw new Error('Unknown template type');
    }

    // Write and download
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export default TemplateGenerationService;