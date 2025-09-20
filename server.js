import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import XLSX from 'xlsx';
import EnhancedCalendarParser from './services/enhancedCalendarParser.js';

// ES6 module path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// JWT Secret (in production, use a secure random string from environment)
const JWT_SECRET = process.env.JWT_SECRET || 'triagro-ai-secret-key-2025';

// In-memory storage for demo (in production, use a proper database)
const users = new Map();
const userFiles = new Map();
const userReports = new Map();

// Agricultural data storage
let agriculturalData = {
  'crop-calendar': [],
  'agromet-advisory': [],
  'poultry-calendar': [],
  'poultry-advisory': []
};

// Initialize enhanced calendar parser
const calendarParser = new EnhancedCalendarParser();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Load existing agricultural data from file if it exists
const dataFilePath = path.join(__dirname, 'agricultural-data.json');
if (fs.existsSync(dataFilePath)) {
  try {
    const fileData = fs.readFileSync(dataFilePath, 'utf8');
    agriculturalData = JSON.parse(fileData);
    console.log('Loaded existing agricultural data');
  } catch (error) {
    console.log('Error loading existing data:', error.message);
  }
}

// Save data to file
const saveDataToFile = () => {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(agriculturalData, null, 2));
  } catch (error) {
    console.error('Error saving data to file:', error.message);
  }
};

// Helper function to process Excel file
const processExcelFile = (buffer, filename) => {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetNames = workbook.SheetNames;
    const sheets = {};
    
    sheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Filter out empty rows
      const filteredData = jsonData.filter(row => row.some(cell => cell !== undefined && cell !== ''));
      
      if (filteredData.length > 0) {
        const headers = filteredData[0];
        const dataRows = filteredData.slice(1);
        
        sheets[sheetName] = {
          headers,
          data: dataRows,
          totalRows: dataRows.length
        };
      }
    });
    
    return {
      filename,
      sheets,
      totalSheets: Object.keys(sheets).length,
      totalRecords: Object.values(sheets).reduce((sum, sheet) => sum + sheet.totalRows, 0)
    };
  } catch (error) {
    throw new Error(`Error processing Excel file: ${error.message}`);
  }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Memory storage for agricultural data processing
const memoryStorage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|csv|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, documents, and spreadsheets are allowed'));
    }
  }
});

const uploadMemory = multer({ 
  storage: memoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Enhanced CORS configuration for proper preflight handling
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:5176",
      "http://localhost:5178",
      "http://localhost:3000",
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With',
      'Accept',
      'Origin'
    ],
    optionsSuccessStatus: 200, // For legacy browser support
    preflightContinue: false
  })
);
app.use(express.json({ limit: "10mb" }));


// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "TriAgro AI Backend",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

// =============================================================================
// AGRICULTURAL DATA ENDPOINTS
// =============================================================================

// Enhanced agricultural calendar upload endpoint
app.post('/api/agricultural-data/upload', authenticateToken, uploadMemory.single('file'), async (req, res) => {
  try {
    const { dataType } = req.body;
    const file = req.file;
    
    console.log('Enhanced upload request received:', { dataType, hasFile: !!file });
    
    if (!dataType) {
      return res.status(400).json({ message: 'Data type is required' });
    }
    
    if (!['crop-calendar', 'agromet-advisory', 'poultry-calendar', 'poultry-advisory', 'enhanced-calendar'].includes(dataType)) {
      return res.status(400).json({ message: 'Invalid data type' });
    }

    // Handle enhanced calendar processing with dual-mode parser
    if (dataType === 'enhanced-calendar' && file) {
      const {
        regionCode,
        districtCode,
        title,
        description,
        year
      } = req.body;
      
      // Parse Excel file with enhanced calendar parser
      const parseResult = await calendarParser.parseCalendarExcel(
        file.buffer,
        file.originalname,
        {
          region: regionCode,
          district: districtCode,
          year: year ? parseInt(year) : new Date().getFullYear()
        }
      );
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          success: false,
          message: 'Failed to parse calendar file',
          error: parseResult.error 
        });
      }
      
      // Create enhanced calendar data structure
      const enhancedCalendarData = {
        id: Date.now().toString(),
        uniqueId: `EC_${parseResult.commodity}_${regionCode}_${districtCode}_${Date.now()}`,
        calendarType: parseResult.calendarType, // 'seasonal' or 'cycle'
        commodity: parseResult.commodity,
        regionCode,
        districtCode,
        title: title || parseResult.data.title,
        description: description || '',
        year: parseResult.data.metadata?.year || new Date().getFullYear(),
        
        // Calendar-specific data
        timeline: parseResult.data.timeline,
        activities: parseResult.data.activities,
        schedule: parseResult.data.schedule,
        
        // Seasonal calendar specific
        season: parseResult.data.season || null,
        startMonth: parseResult.data.timeline?.startMonth || null,
        endMonth: parseResult.data.timeline?.endMonth || null,
        totalWeeks: parseResult.data.timeline?.totalWeeks || 0,
        
        // Cycle calendar specific
        cycleDuration: parseResult.data.cycleDuration || null,
        breedType: parseResult.data.metadata?.breedType || null,
        flexibleStart: parseResult.data.timeline?.flexibleStart || false,
        
        // Metadata
        parseMetadata: parseResult.metadata,
        uploadDate: new Date().toISOString(),
        userId: req.user.userId
      };
      
      // Store in appropriate category based on calendar type
      const storageKey = parseResult.calendarType === 'seasonal' ? 'crop-calendar' : 'poultry-calendar';
      agriculturalData[storageKey].push(enhancedCalendarData);
      saveDataToFile();
      
      console.log(`Enhanced ${parseResult.calendarType} calendar saved:`, enhancedCalendarData.id);
      
      return res.json({
        success: true,
        data: enhancedCalendarData,
        message: `Enhanced ${parseResult.calendarType} calendar uploaded successfully`,
        calendarType: parseResult.calendarType,
        commodity: parseResult.commodity,
        activities: parseResult.data.activities?.length || 0
      });
    }
    
    // Handle legacy upload types
    if (dataType === 'crop-calendar') {
      // Handle crop calendar form data
      const {
        region,
        district,
        crop,
        majorSeasonMonth,
        majorSeasonWeek,
        minorSeasonMonth,
        minorSeasonWeek
      } = req.body;
      
      const cropCalendarData = {
        id: Date.now().toString(),
        uniqueId: `CC_${region}_${district}_${crop}_${Date.now()}`,
        region,
        district,
        crop,
        majorSeason: {
          startMonth: majorSeasonMonth,
          startWeek: majorSeasonWeek,
          file: file ? file.originalname : null
        },
        minorSeason: {
          startMonth: minorSeasonMonth || null,
          startWeek: minorSeasonWeek || null,
          hasFile: !!req.body.minorSeasonFile
        },
        uploadDate: new Date().toISOString(),
        userId: req.user.userId
      };
      
      // Process Excel file if provided
      if (file) {
        const processedFile = processExcelFile(file.buffer, file.originalname);
        cropCalendarData.fileData = processedFile;
        
        // Extract sample activities from the Excel file
        const firstSheet = Object.values(processedFile.sheets)[0];
        if (firstSheet && firstSheet.data.length > 0) {
          cropCalendarData.sampleActivities = firstSheet.data.slice(0, 5).map(row => 
            row.join(' | ')
          );
        }
      }
      
      agriculturalData['crop-calendar'].push(cropCalendarData);
      saveDataToFile();
      
      console.log('Crop calendar saved:', cropCalendarData.id);
      
      res.json({
        success: true,
        data: cropCalendarData,
        message: 'Crop calendar uploaded successfully'
      });
      
    } else if (file) {
      // Handle file uploads for other data types
      const processedFile = processExcelFile(file.buffer, file.originalname);
      
      // Extract additional data from request body
      const {
        uniqueId,
        regionCode,
        districtCode,
        commodityCode,
        poultryTypeCode,
        breedCode,
        title,
        description,
        selectedSheets
      } = req.body;
      
      const uploadData = {
        id: Date.now().toString(),
        uniqueId: uniqueId || `${dataType.toUpperCase()}_${Date.now()}`,
        regionCode,
        districtCode,
        commodityCode,
        poultryTypeCode,
        breedCode,
        title,
        description,
        selectedSheets: selectedSheets ? JSON.parse(selectedSheets) : Object.keys(processedFile.sheets),
        fileData: processedFile,
        uploadDate: new Date().toISOString(),
        userId: req.user.userId
      };
      
      agriculturalData[dataType].push(uploadData);
      saveDataToFile();
      
      console.log(`${dataType} uploaded:`, uploadData.id);
      
      res.json({
        success: true,
        data: uploadData,
        message: `${dataType} uploaded successfully`
      });
      
    } else {
      res.status(400).json({ message: 'File is required for this data type' });
    }
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      message: 'Error processing upload',
      error: error.message 
    });
  }
});

// Enhanced calendar query endpoint
app.get('/api/enhanced-calendars', (req, res) => {
  try {
    const {
      calendarType,
      commodity,
      regionCode,
      districtCode,
      season,
      year,
      breedType,
      computed = false,
      includeMetadata = true,
      limit = 50,
      // Advanced filtering parameters
      search,
      sortBy = 'uploadDate',
      sortOrder = 'desc',
      offset = 0,
      dateFrom,
      dateTo,
      status,
      tags,
      createdBy,
      hasActivities,
      minActivities,
      maxActivities
    } = req.query;
    
    console.log('🔍 Enhanced calendar query received:', { calendarType, commodity, regionCode, districtCode, season, year });

    // Helper function to map region codes to names
    const getRegionName = (codeOrName) => {
      const regionMapping = {
        'WR': 'Western Region',
        'WNR': 'Western North Region',
        'AR': 'Ashanti Region',
        'CR': 'Central Region',
        'ER': 'Eastern Region',
        'GAR': 'Greater Accra Region',
        'NR': 'Northern Region',
        'NER': 'North East Region',
        'UER': 'Upper East Region',
        'UWR': 'Upper West Region',
        'VR': 'Volta Region',
        'OR': 'Oti Region',
        'BR': 'Brong-Ahafo Region',
        'SR': 'Savannah Region',
        'BAR': 'Bono Ahafo Region'
      };
      return regionMapping[codeOrName] || codeOrName;
    };

    // Helper function to map district codes to names
    const getDistrictName = (codeOrName) => {
      const districtMapping = {
        'ELLEMBELLE': 'Ellembelle',
        'JOMORO': 'Jomoro',
        'BIAKOYE': 'Biakoye'
        // Add more mappings as needed
      };
      return districtMapping[codeOrName] || codeOrName;
    };

    // Convert codes to names for filtering
    const regionName = regionCode ? getRegionName(regionCode) : null;
    const districtName = districtCode ? getDistrictName(districtCode) : null;

    console.log(`🔄 Code mapping: regionCode="${regionCode}" → regionName="${regionName}", districtCode="${districtCode}" → districtName="${districtName}"`);

    // Combine seasonal (crop-calendar) and cycle (poultry-calendar) data
    let allCalendars = [];

    if (!calendarType || calendarType === 'seasonal') {
      const seasonalCalendars = agriculturalData['crop-calendar']
        .filter(item => item.calendarType === 'seasonal' || !item.calendarType)
        .map(item => ({ ...item, calendarType: item.calendarType || 'seasonal' }));
      allCalendars.push(...seasonalCalendars);
      console.log(`📊 Loaded ${seasonalCalendars.length} seasonal calendars from crop-calendar`);
    }

    if (!calendarType || calendarType === 'cycle') {
      const cycleCalendars = agriculturalData['poultry-calendar']
        .filter(item => item.calendarType === 'cycle' || !item.calendarType)
        .map(item => ({ ...item, calendarType: item.calendarType || 'cycle' }));
      allCalendars.push(...cycleCalendars);
      console.log(`📊 Loaded ${cycleCalendars.length} cycle calendars from poultry-calendar`);
    }

    console.log(`📚 Total calendars before filtering: ${allCalendars.length}`);

    // Log sample data structure for debugging
    if (allCalendars.length > 0) {
      console.log('📋 Sample calendar data structure:');
      allCalendars.slice(0, 3).forEach(item => {
        console.log(`   📄 ID: ${item.id}, region: "${item.region}", regionCode: "${item.regionCode}", district: "${item.district}", districtCode: "${item.districtCode}", crop: "${item.crop}", commodity: "${item.commodity}"`);
      });
    }

    // Apply filters with detailed logging
    let filteredCalendars = allCalendars;
    
    if (commodity) {
      const beforeCommodity = filteredCalendars.length;
      filteredCalendars = filteredCalendars.filter(item => {
        // Check both 'commodity' and 'crop' fields for compatibility
        const commodityField = item.commodity || item.crop;
        const matches = commodityField && commodityField.toLowerCase().includes(commodity.toLowerCase());
        if (!matches) {
          console.log(`❌ Commodity filter: "${commodityField}" does not match "${commodity}"`);
        }
        return matches;
      });
      console.log(`🌾 Commodity filter ("${commodity}"): ${beforeCommodity} → ${filteredCalendars.length} calendars`);
    }

    if (regionCode || regionName) {
      const beforeRegion = filteredCalendars.length;
      const filterValue = regionName || regionCode;
      console.log(`🗺️  Applying region filter: "${filterValue}" (original: "${regionCode}")`);
      filteredCalendars = filteredCalendars.filter(item => {
        // Check both 'regionCode' and 'region' fields for compatibility
        const regionField = item.regionCode || item.region;
        const matches = regionField === filterValue || regionField === regionCode;
        console.log(`   📍 Calendar ${item.id}: regionField="${regionField}", matches=${matches}`);
        return matches;
      });
      console.log(`🗺️  Region filter ("${filterValue}"): ${beforeRegion} → ${filteredCalendars.length} calendars`);
    }

    if (districtCode || districtName) {
      const beforeDistrict = filteredCalendars.length;
      const filterValue = districtName || districtCode;
      console.log(`🏘️  Applying district filter: "${filterValue}" (original: "${districtCode}")`);
      filteredCalendars = filteredCalendars.filter(item => {
        // Check both 'districtCode' and 'district' fields for compatibility
        const districtField = item.districtCode || item.district;
        const matches = districtField === filterValue || districtField === districtCode;
        console.log(`   📍 Calendar ${item.id}: districtField="${districtField}", matches=${matches}`);
        return matches;
      });
      console.log(`🏘️  District filter ("${filterValue}"): ${beforeDistrict} → ${filteredCalendars.length} calendars`);
    }
    
    if (season) {
      const beforeSeason = filteredCalendars.length;
      console.log(`🗓️  Applying season filter: "${season}"`);
      filteredCalendars = filteredCalendars.filter(item => {
        // Check direct season field
        if (item.season && item.season.toLowerCase() === season.toLowerCase()) {
          return true;
        }

        // Check majorSeason/minorSeason structure for legacy data
        if (season.toLowerCase() === 'major' && item.majorSeason && item.majorSeason.startMonth) {
          console.log(`   ✅ Calendar ${item.id}: Has majorSeason data`);
          return true;
        }

        if (season.toLowerCase() === 'minor' && item.minorSeason && item.minorSeason.startMonth) {
          console.log(`   ✅ Calendar ${item.id}: Has minorSeason data`);
          return true;
        }

        console.log(`   ❌ Calendar ${item.id}: No season match (season="${item.season}", majorSeason=${!!item.majorSeason?.startMonth}, minorSeason=${!!item.minorSeason?.startMonth})`);
        return false;
      });
      console.log(`🗓️  Season filter ("${season}"): ${beforeSeason} → ${filteredCalendars.length} calendars`);
    }
    
    if (year) {
      filteredCalendars = filteredCalendars.filter(item => item.year === parseInt(year));
    }
    
    if (breedType) {
      filteredCalendars = filteredCalendars.filter(item =>
        item.breedType && item.breedType.toLowerCase().includes(breedType.toLowerCase())
      );
    }

    // Advanced filtering parameters
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredCalendars = filteredCalendars.filter(item => {
        const searchableFields = [
          item.commodity,
          item.crop,
          item.title,
          item.description,
          item.regionCode,
          item.districtCode,
          item.breedType,
          item.season
        ].filter(Boolean);

        return searchableFields.some(field =>
          field.toLowerCase().includes(searchTerm)
        ) || (item.activities && item.activities.some(activity =>
          (activity.name && activity.name.toLowerCase().includes(searchTerm)) ||
          (activity.description && activity.description.toLowerCase().includes(searchTerm))
        ));
      });
    }

    if (dateFrom || dateTo) {
      filteredCalendars = filteredCalendars.filter(item => {
        const uploadDate = new Date(item.uploadDate);
        if (dateFrom && uploadDate < new Date(dateFrom)) return false;
        if (dateTo && uploadDate > new Date(dateTo)) return false;
        return true;
      });
    }

    if (status) {
      filteredCalendars = filteredCalendars.filter(item =>
        item.status && item.status.toLowerCase() === status.toLowerCase()
      );
    }

    if (tags) {
      const tagList = tags.split(',').map(tag => tag.trim().toLowerCase());
      filteredCalendars = filteredCalendars.filter(item => {
        if (!item.tags) return false;
        const itemTags = Array.isArray(item.tags) ? item.tags : item.tags.split(',');
        return tagList.some(tag =>
          itemTags.some(itemTag => itemTag.toLowerCase().includes(tag))
        );
      });
    }

    if (createdBy) {
      filteredCalendars = filteredCalendars.filter(item =>
        item.createdBy && item.createdBy.toLowerCase().includes(createdBy.toLowerCase())
      );
    }

    if (hasActivities !== undefined) {
      const hasActivitiesBool = hasActivities === 'true';
      filteredCalendars = filteredCalendars.filter(item =>
        hasActivitiesBool ? (item.activities && item.activities.length > 0) :
                           (!item.activities || item.activities.length === 0)
      );
    }

    if (minActivities) {
      const min = parseInt(minActivities);
      filteredCalendars = filteredCalendars.filter(item =>
        item.activities && item.activities.length >= min
      );
    }

    if (maxActivities) {
      const max = parseInt(maxActivities);
      filteredCalendars = filteredCalendars.filter(item =>
        !item.activities || item.activities.length <= max
      );
    }

    // Handle computed calendar request (mark results as computed)
    if (computed === 'true') {
      filteredCalendars = filteredCalendars.map(calendar => ({
        ...calendar,
        isComputed: true,
        computedDate: new Date().toISOString(),
        metadata: {
          ...calendar.metadata,
          source: 'computed',
          computationMethod: 'uploaded_data_only'
        }
      }));
    }

    // Advanced sorting
    const validSortFields = ['uploadDate', 'commodity', 'regionCode', 'districtCode', 'season', 'year', 'title'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'uploadDate';
    const isDesc = sortOrder.toLowerCase() === 'desc';

    filteredCalendars.sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';

      // Handle date sorting
      if (sortField === 'uploadDate') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }

      // Handle string sorting
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return isDesc ? 1 : -1;
      if (aVal > bVal) return isDesc ? -1 : 1;
      return 0;
    });

    // Apply pagination
    const offsetNum = parseInt(offset) || 0;
    const limitNum = parseInt(limit) || 50;
    const limitedResults = filteredCalendars.slice(offsetNum, offsetNum + limitNum);

    console.log(`Returning ${limitedResults.length} enhanced calendar records`);

    // Build response with enhanced metadata
    const response = {
      success: true,
      data: limitedResults,
      total: filteredCalendars.length,
      pagination: {
        offset: offsetNum,
        limit: limitNum,
        total: filteredCalendars.length,
        hasNext: (offsetNum + limitNum) < filteredCalendars.length,
        hasPrev: offsetNum > 0,
        totalPages: Math.ceil(filteredCalendars.length / limitNum),
        currentPage: Math.floor(offsetNum / limitNum) + 1
      },
      filters: {
        calendarType,
        commodity,
        regionCode,
        districtCode,
        season,
        year,
        breedType,
        computed: computed === 'true',
        search,
        sortBy: sortField,
        sortOrder,
        dateFrom,
        dateTo,
        status,
        tags,
        createdBy,
        hasActivities,
        minActivities,
        maxActivities
      }
    };

    // Add metadata if requested
    if (includeMetadata === 'true' || includeMetadata === true) {
      response.metadata = {
        queryTimestamp: new Date().toISOString(),
        dataSource: computed === 'true' ? 'computed' : 'uploaded',
        summary: {
          seasonal: filteredCalendars.filter(c => c.calendarType === 'seasonal').length,
          cycle: filteredCalendars.filter(c => c.calendarType === 'cycle').length,
          computed: filteredCalendars.filter(c => c.isComputed).length
        },
        availableRegions: [...new Set(filteredCalendars.map(c => c.regionCode).filter(Boolean))],
        availableCommodities: [...new Set(filteredCalendars.map(c => c.commodity).filter(Boolean))]
      };
    }

    console.log(`✅ Final result: ${filteredCalendars.length} calendars found`);
    if (filteredCalendars.length > 0) {
      console.log('📋 Returned calendar IDs:', filteredCalendars.map(c => c.id));
    } else {
      console.log('❌ No calendars match the filters');
    }

    res.json(response);
    
  } catch (error) {
    console.error('Enhanced calendar query error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error retrieving enhanced calendars',
      error: error.message 
    });
  }
});

// Enhanced metadata endpoint for filtering capabilities (must be before /:id route)
app.get('/api/enhanced-calendars/metadata', (req, res) => {
  try {
    const { includeRegionMapping = true, includeDistrictMapping = true } = req.query;

    const allCalendars = [
      ...agriculturalData['crop-calendar'],
      ...agriculturalData['poultry-calendar']
    ];

    // Extract unique values from uploaded calendars
    const uploadedRegions = [...new Set(allCalendars.map(c => c.regionCode).filter(Boolean))];
    const uploadedDistricts = [...new Set(allCalendars.map(c => c.districtCode).filter(Boolean))];
    const uploadedCommodities = [...new Set(allCalendars.map(c => c.commodity).filter(Boolean))];

    // Standard Ghana regions and districts (from Ghana administrative structure)
    const standardRegions = [
      { code: 'Greater Accra Region', name: 'Greater Accra Region' },
      { code: 'Ashanti Region', name: 'Ashanti Region' },
      { code: 'Western Region', name: 'Western Region' },
      { code: 'Central Region', name: 'Central Region' },
      { code: 'Eastern Region', name: 'Eastern Region' },
      { code: 'Volta Region', name: 'Volta Region' },
      { code: 'Northern Region', name: 'Northern Region' },
      { code: 'Upper East Region', name: 'Upper East Region' },
      { code: 'Upper West Region', name: 'Upper West Region' },
      { code: 'Brong Ahafo Region', name: 'Brong Ahafo Region' },
      { code: 'Western North Region', name: 'Western North Region' },
      { code: 'Ahafo Region', name: 'Ahafo Region' },
      { code: 'Bono Region', name: 'Bono Region' },
      { code: 'Bono East Region', name: 'Bono East Region' },
      { code: 'Oti Region', name: 'Oti Region' },
      { code: 'North East Region', name: 'North East Region' },
      { code: 'Savannah Region', name: 'Savannah Region' }
    ];

    // Standard commodities supported by the system
    const standardCommodities = [
      'maize', 'rice', 'sorghum', 'millet', 'cassava', 'yam', 'plantain', 'cocoyam',
      'tomato', 'pepper', 'onion', 'okra', 'garden egg', 'cabbage', 'lettuce',
      'soybean', 'groundnut', 'cowpea', 'bambara beans',
      'cocoa', 'coffee', 'oil palm', 'coconut', 'rubber',
      'broiler chicken', 'layer chicken', 'guinea fowl', 'duck', 'turkey',
      'cattle', 'goat', 'sheep', 'pig', 'rabbit',
      'tilapia', 'catfish', 'grasscutter'
    ];

    // Helper function to get districts by region
    const getDistrictsByRegion = (calendars) => {
      const districtsByRegion = {};
      calendars.forEach(calendar => {
        if (calendar.regionCode && calendar.districtCode) {
          if (!districtsByRegion[calendar.regionCode]) {
            districtsByRegion[calendar.regionCode] = [];
          }
          if (!districtsByRegion[calendar.regionCode].includes(calendar.districtCode)) {
            districtsByRegion[calendar.regionCode].push(calendar.districtCode);
          }
        }
      });
      return districtsByRegion;
    };

    const metadata = {
      totalCalendars: allCalendars.length,
      dataStatus: {
        hasUploadedData: allCalendars.length > 0,
        uploadedCalendars: allCalendars.length,
        lastUpload: allCalendars.length > 0 ?
          new Date(Math.max(...allCalendars.map(c => new Date(c.uploadDate || 0).getTime()))).toISOString() : null
      },
      availableFilters: {
        calendarTypes: [...new Set(allCalendars.map(c => c.calendarType).filter(Boolean))],
        commodities: {
          uploaded: uploadedCommodities.sort(),
          standard: standardCommodities.sort(),
          all: [...new Set([...uploadedCommodities, ...standardCommodities])].sort()
        },
        regions: {
          uploaded: uploadedRegions.sort(),
          standard: standardRegions.map(r => r.code).sort(),
          all: [...new Set([...uploadedRegions, ...standardRegions.map(r => r.code)])].sort(),
          mapping: includeRegionMapping === 'true' ? standardRegions : []
        },
        districts: {
          uploaded: uploadedDistricts.sort(),
          all: uploadedDistricts.sort(),
          byRegion: includeDistrictMapping === 'true' ? getDistrictsByRegion(allCalendars) : {}
        },
        seasons: [...new Set(allCalendars.map(c => c.season).filter(Boolean))],
        years: [...new Set(allCalendars.map(c => c.year).filter(Boolean))].sort(),
        breedTypes: [...new Set(allCalendars.map(c => c.breedType).filter(Boolean))]
      },
      statistics: {
        byCommodity: {},
        byRegion: {},
        byDistrict: {},
        byCalendarType: {},
        byYear: {},
        coverage: {
          regionsWithData: uploadedRegions.length,
          totalRegions: standardRegions.length,
          coveragePercentage: uploadedRegions.length > 0 ?
            Math.round((uploadedRegions.length / standardRegions.length) * 100) : 0
        }
      }
    };

    // Generate enhanced statistics
    allCalendars.forEach(calendar => {
      // Commodity stats
      if (calendar.commodity) {
        metadata.statistics.byCommodity[calendar.commodity] =
          (metadata.statistics.byCommodity[calendar.commodity] || 0) + 1;
      }

      // Region stats
      if (calendar.regionCode) {
        metadata.statistics.byRegion[calendar.regionCode] =
          (metadata.statistics.byRegion[calendar.regionCode] || 0) + 1;
      }

      // District stats
      if (calendar.districtCode) {
        metadata.statistics.byDistrict[calendar.districtCode] =
          (metadata.statistics.byDistrict[calendar.districtCode] || 0) + 1;
      }

      // Calendar type stats
      if (calendar.calendarType) {
        metadata.statistics.byCalendarType[calendar.calendarType] =
          (metadata.statistics.byCalendarType[calendar.calendarType] || 0) + 1;
      }

      // Year stats
      if (calendar.year) {
        metadata.statistics.byYear[calendar.year] =
          (metadata.statistics.byYear[calendar.year] || 0) + 1;
      }
    });

    res.json({
      success: true,
      data: metadata,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Metadata generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating metadata',
      error: error.message
    });
  }
});

// Get specific calendar with activities
app.get('/api/enhanced-calendars/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { includeActivities = true } = req.query;
    
    // Search in both crop and poultry calendars
    let calendar = agriculturalData['crop-calendar'].find(item => item.id === id) ||
                  agriculturalData['poultry-calendar'].find(item => item.id === id);
    
    if (!calendar) {
      return res.status(404).json({ 
        success: false,
        message: 'Calendar not found' 
      });
    }
    
    // Optionally exclude activities for performance
    if (includeActivities === 'false') {
      const { activities, schedule, ...calendarWithoutActivities } = calendar;
      calendar = calendarWithoutActivities;
    }
    
    res.json({
      success: true,
      data: calendar
    });
    
  } catch (error) {
    console.error('Get calendar error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error retrieving calendar',
      error: error.message 
    });
  }
});

// Get calendar activities for a specific production cycle
app.get('/api/enhanced-calendars/:id/activities', (req, res) => {
  try {
    const { id } = req.params;
    const { currentWeek, startWeek, endWeek } = req.query;
    
    // Find calendar in both data stores
    let calendar = agriculturalData['crop-calendar'].find(item => item.id === id) ||
                  agriculturalData['poultry-calendar'].find(item => item.id === id);
    
    if (!calendar) {
      return res.status(404).json({ 
        success: false,
        message: 'Calendar not found' 
      });
    }
    
    let activities = calendar.activities || [];
    let schedule = calendar.schedule || [];
    
    // Filter activities by week range for cycle calendars
    if (calendar.calendarType === 'cycle' && (currentWeek || startWeek || endWeek)) {
      const weekNum = parseInt(currentWeek);
      const startWeekNum = parseInt(startWeek);
      const endWeekNum = parseInt(endWeek);
      
      if (weekNum) {
        // Get activities for specific week
        schedule = schedule.filter(item => 
          item.periods && item.periods.some(period => 
            period.productionWeek === weekNum
          )
        );
      } else if (startWeekNum && endWeekNum) {
        // Get activities for week range
        schedule = schedule.filter(item => 
          item.periods && item.periods.some(period => 
            period.productionWeek >= startWeekNum && period.productionWeek <= endWeekNum
          )
        );
      }
    }
    
    res.json({
      success: true,
      data: {
        calendarId: calendar.id,
        calendarType: calendar.calendarType,
        commodity: calendar.commodity,
        activities: activities,
        schedule: schedule,
        timeline: calendar.timeline
      },
      filters: { currentWeek, startWeek, endWeek }
    });
    
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error retrieving activities',
      error: error.message 
    });
  }
});

// Get agricultural data (public access) - Legacy endpoint
app.get('/api/agricultural-data/:dataType', (req, res) => {
  try {
    const { dataType } = req.params;
    
    console.log('Get data request:', dataType);
    
    if (!['crop-calendar', 'agromet-advisory', 'poultry-calendar', 'poultry-advisory'].includes(dataType)) {
      return res.status(400).json({ message: 'Invalid data type' });
    }
    
    const data = agriculturalData[dataType] || [];
    
    // Apply filters if provided
    const { region, district, crop, regionCode, districtCode, commodityCode } = req.query;
    let filteredData = [...data];
    
    if (region) {
      filteredData = filteredData.filter(item => 
        item.region && item.region.toLowerCase().includes(region.toLowerCase())
      );
    }
    
    if (district) {
      filteredData = filteredData.filter(item => 
        item.district && item.district.toLowerCase().includes(district.toLowerCase())
      );
    }
    
    if (crop) {
      filteredData = filteredData.filter(item => 
        item.crop && item.crop.toLowerCase().includes(crop.toLowerCase())
      );
    }
    
    if (regionCode) {
      filteredData = filteredData.filter(item => item.regionCode === regionCode);
    }
    
    if (districtCode) {
      filteredData = filteredData.filter(item => item.districtCode === districtCode);
    }
    
    if (commodityCode) {
      filteredData = filteredData.filter(item => item.commodityCode === commodityCode);
    }
    
    console.log(`Returning ${filteredData.length} ${dataType} records`);
    
    res.json(filteredData);
    
  } catch (error) {
    console.error('Get data error:', error);
    res.status(500).json({ 
      message: 'Error retrieving data',
      error: error.message 
    });
  }
});

// Production cycle management for poultry
app.post('/api/production-cycles', authenticateToken, (req, res) => {
  try {
    const {
      calendarId,
      startDate,
      batchName,
      initialQuantity,
      notes
    } = req.body;
    
    if (!calendarId || !startDate) {
      return res.status(400).json({ 
        success: false,
        message: 'Calendar ID and start date are required' 
      });
    }
    
    // Find the calendar template
    const calendar = agriculturalData['poultry-calendar'].find(item => item.id === calendarId);
    if (!calendar) {
      return res.status(404).json({ 
        success: false,
        message: 'Calendar template not found' 
      });
    }
    
    if (calendar.calendarType !== 'cycle') {
      return res.status(400).json({ 
        success: false,
        message: 'Calendar must be cycle type for production cycles' 
      });
    }
    
    const productionCycle = {
      id: Date.now().toString(),
      calendarId: calendarId,
      userId: req.user.userId,
      
      // Cycle tracking
      startDate: new Date(startDate).toISOString().split('T')[0],
      currentWeek: 1,
      status: 'active',
      
      // Calculate expected end date
      expectedEndDate: new Date(
        new Date(startDate).getTime() + (calendar.cycleDuration || 8) * 7 * 24 * 60 * 60 * 1000
      ).toISOString().split('T')[0],
      totalDurationWeeks: calendar.cycleDuration || 8,
      
      // Production data
      batchName: batchName || `${calendar.commodity} Batch ${Date.now()}`,
      initialQuantity: parseInt(initialQuantity) || 100,
      currentQuantity: parseInt(initialQuantity) || 100,
      
      // Progress tracking
      completedActivities: [],
      notes: notes || '',
      
      // Calendar reference data
      commodity: calendar.commodity,
      breedType: calendar.breedType,
      regionCode: calendar.regionCode,
      districtCode: calendar.districtCode,
      
      // Timestamps
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString()
    };
    
    // Initialize user production cycles storage if not exists
    if (!agriculturalData['user-production-cycles']) {
      agriculturalData['user-production-cycles'] = [];
    }
    
    agriculturalData['user-production-cycles'].push(productionCycle);
    saveDataToFile();
    
    console.log('Production cycle created:', productionCycle.id);
    
    res.json({
      success: true,
      data: productionCycle,
      message: 'Production cycle created successfully'
    });
    
  } catch (error) {
    console.error('Create production cycle error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creating production cycle',
      error: error.message 
    });
  }
});

// Get user production cycles
app.get('/api/production-cycles', authenticateToken, (req, res) => {
  try {
    const { status, commodity, limit = 20 } = req.query;
    const userId = req.user.userId;
    
    if (!agriculturalData['user-production-cycles']) {
      agriculturalData['user-production-cycles'] = [];
    }
    
    let cycles = agriculturalData['user-production-cycles']
      .filter(cycle => cycle.userId === userId);
    
    // Apply filters
    if (status) {
      cycles = cycles.filter(cycle => cycle.status === status);
    }
    
    if (commodity) {
      cycles = cycles.filter(cycle => 
        cycle.commodity && cycle.commodity.toLowerCase().includes(commodity.toLowerCase())
      );
    }
    
    // Calculate current week for each cycle
    cycles = cycles.map(cycle => {
      const startDate = new Date(cycle.startDate);
      const currentDate = new Date();
      const daysElapsed = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));
      const calculatedWeek = Math.floor(daysElapsed / 7) + 1;
      
      return {
        ...cycle,
        currentWeek: Math.max(1, calculatedWeek),
        daysElapsed,
        progressPercent: Math.min(100, (calculatedWeek / cycle.totalDurationWeeks) * 100)
      };
    });
    
    // Sort by creation date (newest first)
    cycles.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
    
    // Apply limit
    const limitedCycles = cycles.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: limitedCycles,
      total: cycles.length,
      summary: {
        active: cycles.filter(c => c.status === 'active').length,
        completed: cycles.filter(c => c.status === 'completed').length,
        paused: cycles.filter(c => c.status === 'paused').length
      }
    });
    
  } catch (error) {
    console.error('Get production cycles error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error retrieving production cycles',
      error: error.message 
    });
  }
});

// Update production cycle
app.put('/api/production-cycles/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { status, currentQuantity, notes, completedActivities } = req.body;
    const userId = req.user.userId;
    
    if (!agriculturalData['user-production-cycles']) {
      return res.status(404).json({ 
        success: false,
        message: 'Production cycle not found' 
      });
    }
    
    const cycleIndex = agriculturalData['user-production-cycles']
      .findIndex(cycle => cycle.id === id && cycle.userId === userId);
    
    if (cycleIndex === -1) {
      return res.status(404).json({ 
        success: false,
        message: 'Production cycle not found' 
      });
    }
    
    const cycle = agriculturalData['user-production-cycles'][cycleIndex];
    
    // Update fields
    if (status) cycle.status = status;
    if (currentQuantity !== undefined) cycle.currentQuantity = parseInt(currentQuantity);
    if (notes !== undefined) cycle.notes = notes;
    if (completedActivities) cycle.completedActivities = completedActivities;
    
    // Set actual end date if completing
    if (status === 'completed' && !cycle.actualEndDate) {
      cycle.actualEndDate = new Date().toISOString().split('T')[0];
    }
    
    cycle.updatedDate = new Date().toISOString();
    
    agriculturalData['user-production-cycles'][cycleIndex] = cycle;
    saveDataToFile();
    
    console.log('Production cycle updated:', id);
    
    res.json({
      success: true,
      data: cycle,
      message: 'Production cycle updated successfully'
    });
    
  } catch (error) {
    console.error('Update production cycle error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating production cycle',
      error: error.message 
    });
  }
});

// Get current week activities for a production cycle
app.get('/api/production-cycles/:id/current-activities', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    if (!agriculturalData['user-production-cycles']) {
      return res.status(404).json({ 
        success: false,
        message: 'Production cycle not found' 
      });
    }
    
    const cycle = agriculturalData['user-production-cycles']
      .find(cycle => cycle.id === id && cycle.userId === userId);
    
    if (!cycle) {
      return res.status(404).json({ 
        success: false,
        message: 'Production cycle not found' 
      });
    }
    
    // Find the calendar template
    const calendar = agriculturalData['poultry-calendar'].find(item => item.id === cycle.calendarId);
    if (!calendar) {
      return res.status(404).json({ 
        success: false,
        message: 'Calendar template not found' 
      });
    }
    
    // Calculate current week
    const startDate = new Date(cycle.startDate);
    const currentDate = new Date();
    const daysElapsed = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));
    const currentWeek = Math.floor(daysElapsed / 7) + 1;
    
    // Get activities for current week
    const currentActivities = calendar.schedule?.filter(item => 
      item.periods && item.periods.some(period => 
        period.productionWeek === currentWeek
      )
    ) || [];
    
    res.json({
      success: true,
      data: {
        cycleId: cycle.id,
        currentWeek: currentWeek,
        daysElapsed: daysElapsed,
        totalWeeks: cycle.totalDurationWeeks,
        progressPercent: Math.min(100, (currentWeek / cycle.totalWeeks) * 100),
        activities: currentActivities,
        completedActivities: cycle.completedActivities || [],
        cycle: {
          batchName: cycle.batchName,
          commodity: cycle.commodity,
          currentQuantity: cycle.currentQuantity,
          status: cycle.status
        }
      }
    });
    
  } catch (error) {
    console.error('Get current activities error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error retrieving current activities',
      error: error.message 
    });
  }
});

// Delete agricultural data - Legacy endpoint
app.delete('/api/agricultural-data/:dataType/:id', authenticateToken, (req, res) => {
  try {
    const { dataType, id } = req.params;
    
    if (!['crop-calendar', 'agromet-advisory', 'poultry-calendar', 'poultry-advisory'].includes(dataType)) {
      return res.status(400).json({ message: 'Invalid data type' });
    }
    
    const dataArray = agriculturalData[dataType];
    const index = dataArray.findIndex(item => item.id === id);
    
    if (index === -1) {
      return res.status(404).json({ message: 'Record not found' });
    }
    
    dataArray.splice(index, 1);
    saveDataToFile();
    
    console.log(`Deleted ${dataType} record:`, id);
    
    res.json({ success: true, message: 'Record deleted successfully' });
    
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ 
      message: 'Error deleting record',
      error: error.message 
    });
  }
});

// =============================================================================
// AUTHENTICATION ENDPOINTS
// =============================================================================

// User Sign Up
app.post("/sign-up", async (req, res) => {
  try {
    const { name, email, password, organization, role } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "Name, email, and password are required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters long"
      });
    }

    // Check if user already exists
    if (users.has(email)) {
      return res.status(400).json({
        success: false,
        error: "User with this email already exists"
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const userId = Date.now().toString();
    const user = {
      id: userId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      organization: organization || '',
      role: role || 'user',
      createdAt: new Date().toISOString(),
      lastLogin: null
    };

    users.set(email, user);

    // Initialize user data collections
    userFiles.set(userId, []);
    userReports.set(userId, []);

    console.log(`✅ New user registered: ${email}`);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        organization: user.organization,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error("Sign-up error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error during registration"
    });
  }
});

// User Sign In
app.post("/sign-in", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required"
      });
    }

    // Find user
    const user = users.get(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password"
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password"
      });
    }

    // Update last login
    user.lastLogin = new Date().toISOString();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        name: user.name,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`✅ User logged in: ${email}`);

    res.json({
      success: true,
      message: "Login successful",
      accessToken: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        organization: user.organization,
        role: user.role,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error("Sign-in error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error during login"
    });
  }
});

// User Sign Out
app.post("/sign-out", authenticateToken, (req, res) => {
  console.log(`✅ User logged out: ${req.user.email}`);
  res.json({
    success: true,
    message: "Logged out successfully"
  });
});

// =============================================================================
// USER PROFILE ENDPOINTS
// =============================================================================

// Get User Profile
app.get("/user/profile", authenticateToken, (req, res) => {
  try {
    const user = users.get(req.user.email);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        organization: user.organization,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      error: "Error retrieving user profile"
    });
  }
});

// Update User Profile
app.put("/user/profile", authenticateToken, async (req, res) => {
  try {
    const { name, organization, role } = req.body;
    const user = users.get(req.user.email);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    // Update user data
    if (name) user.name = name.trim();
    if (organization !== undefined) user.organization = organization.trim();
    if (role) user.role = role;
    user.updatedAt = new Date().toISOString();

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        organization: user.organization,
        role: user.role,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      error: "Error updating user profile"
    });
  }
});

// =============================================================================
// FILE UPLOAD ENDPOINTS
// =============================================================================

// File Upload - Multiple endpoints for compatibility
const handleFileUpload = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file provided"
      });
    }

    const { reportType, title, description, tags } = req.body;
    const userId = req.user.userId;

    // Create file record
    const fileRecord = {
      id: Date.now().toString(),
      userId: userId,
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      reportType: reportType || 'General',
      title: title || req.file.originalname,
      description: description || '',
      tags: tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [],
      uploadedAt: new Date().toISOString()
    };

    // Store file record
    const files = userFiles.get(userId) || [];
    files.push(fileRecord);
    userFiles.set(userId, files);

    console.log(`✅ File uploaded: ${req.file.originalname} by user ${userId}`);

    res.json({
      success: true,
      message: "File uploaded successfully",
      data: {
        id: fileRecord.id,
        originalName: fileRecord.originalName,
        size: fileRecord.size,
        reportType: fileRecord.reportType,
        title: fileRecord.title,
        uploadedAt: fileRecord.uploadedAt
      }
    });
  } catch (error) {
    console.error("File upload error:", error);
    res.status(500).json({
      success: false,
      error: "Error uploading file"
    });
  }
};

// Multiple upload endpoints for compatibility
app.post("/user/files/upload", authenticateToken, upload.single('file'), handleFileUpload);
app.post("/files/upload", authenticateToken, upload.single('file'), handleFileUpload);
app.post("/upload", authenticateToken, upload.single('file'), handleFileUpload);

// Get User Files
app.get("/user/files", authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const files = userFiles.get(userId) || [];
    
    res.json({
      success: true,
      data: files.map(file => ({
        id: file.id,
        originalName: file.originalName,
        size: file.size,
        reportType: file.reportType,
        title: file.title,
        description: file.description,
        tags: file.tags,
        uploadedAt: file.uploadedAt
      }))
    });
  } catch (error) {
    console.error("Get files error:", error);
    res.status(500).json({
      success: false,
      error: "Error retrieving files"
    });
  }
});

// Delete File
app.delete("/user/files/:fileId", authenticateToken, (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.userId;
    const files = userFiles.get(userId) || [];
    
    const fileIndex = files.findIndex(f => f.id === fileId);
    if (fileIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "File not found"
      });
    }

    const file = files[fileIndex];
    
    // Delete physical file
    try {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } catch (err) {
      console.warn("Could not delete physical file:", err.message);
    }

    // Remove from records
    files.splice(fileIndex, 1);
    userFiles.set(userId, files);

    console.log(`✅ File deleted: ${file.originalName} by user ${userId}`);

    res.json({
      success: true,
      message: "File deleted successfully"
    });
  } catch (error) {
    console.error("Delete file error:", error);
    res.status(500).json({
      success: false,
      error: "Error deleting file"
    });
  }
});

// Download File
app.get("/user/files/:fileId/download", authenticateToken, (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.userId;
    const files = userFiles.get(userId) || [];
    
    const file = files.find(f => f.id === fileId);
    if (!file) {
      return res.status(404).json({
        success: false,
        error: "File not found"
      });
    }

    if (!fs.existsSync(file.path)) {
      return res.status(404).json({
        success: false,
        error: "File not found on disk"
      });
    }

    res.download(file.path, file.originalName);
  } catch (error) {
    console.error("Download file error:", error);
    res.status(500).json({
      success: false,
      error: "Error downloading file"
    });
  }
});

// =============================================================================
// DASHBOARD ENDPOINTS
// =============================================================================

// Get Dashboard Stats
app.get("/user/dashboard/stats", authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const files = userFiles.get(userId) || [];
    const reports = userReports.get(userId) || [];

    const stats = {
      totalFiles: files.length,
      totalReports: reports.length,
      pendingReports: reports.filter(r => r.status === 'pending').length,
      completedReports: reports.filter(r => r.status === 'completed').length,
      totalFileSize: files.reduce((sum, file) => sum + file.size, 0),
      lastActivity: Math.max(
        ...files.map(f => new Date(f.uploadedAt).getTime()),
        ...reports.map(r => new Date(r.createdAt).getTime()),
        0
      ),
      recentFiles: files
        .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
        .slice(0, 5)
        .map(f => ({
          id: f.id,
          name: f.originalName,
          uploadedAt: f.uploadedAt
        }))
    };

    if (stats.lastActivity > 0) {
      stats.lastActivity = new Date(stats.lastActivity).toISOString();
    } else {
      stats.lastActivity = new Date().toISOString();
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({
      success: false,
      error: "Error retrieving dashboard statistics"
    });
  }
});

// Get User Notifications (placeholder)
app.get("/user/notifications", authenticateToken, (req, res) => {
  try {
    // For now, return empty notifications
    // In a real app, you'd fetch from a notifications table/collection
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error("Notifications error:", error);
    res.status(500).json({
      success: false,
      error: "Error retrieving notifications"
    });
  }
});

// Claude API proxy endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message, conversationHistory = [], userContext = {} } = req.body;

    // Validate request
    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        error: "Message is required and must be a string",
      });
    }

    // Get Claude API key from environment
    const claudeApiKey = process.env.ANTHROPIC_API_KEY || process.env.VITE_CLAUDE_API_KEY;
    if (!claudeApiKey) {
      return res.status(500).json({
        success: false,
        error: "Claude API key not configured",
      });
    }

    // Build system prompt
    const getSystemPrompt = () => {
      return `You are AgriBot, Ghana's premier agricultural AI assistant with comprehensive expertise in Ghanaian farming practices. You provide precise, actionable advice tailored to Ghana's unique agricultural landscape.

## YOUR SPECIALIZED KNOWLEDGE:

### GHANA REGIONAL EXPERTISE:
- All 16 regions and 260+ districts with specific agricultural characteristics
- Agroecological zones: Sudan Savannah (far north), Guinea Savannah (middle belt), Forest Zone (south), Coastal Plains
- Regional crop suitability and climate patterns across Ghana
- District-specific farming recommendations and local varieties

### CROP SPECIALIZATION:

**MAIZE EXPERTISE:**
- Varieties: Abontem (80-90 days), Obaatampa (105-120 days)
- Optimal planting: March-April (major season), September-October (minor season)
- Fertilizer schedule: NPK 20:10:10 (2 bags/acre at 14 days), Urea (1 bag/acre at 6 weeks)
- Fall Armyworm control: Warrior, Super Viper, Bypel Attack pesticides
- Herbicides: Nico, Nomini Rice Pro for weed management

**RICE CULTIVATION:**
- Varieties: Jasmine, Nerica for optimal yield
- Nursery period: 21-30 days before transplanting
- Spacing: 20x20 cm for optimal growth
- Fertilizer: NPK 15:15:15 (2 bags/acre), followed by Urea applications
- Water management for lowland and upland systems

**ROOT CROPS:**
- Cassava: Esi Abaaya variety, year-round cultivation potential
- Yam: Puna variety, seasonal planting requirements
- Sweet potato: Regional adaptation strategies

**VEGETABLES:**
- Tomatoes: Black Cobra variety, pest and disease management
- Peppers: Multiple varieties (Anaheim, Black Cobra)
- Onions: Seasonal growing windows and storage techniques

### SEASONAL FARMING CALENDAR:
**Major Rainy Season (March-July):**
- Primary planting window for most crops
- Land preparation: February-March
- Peak growing period with optimal rainfall

**Minor Rainy Season (September-November):**
- Secondary planting window
- Shorter duration varieties recommended
- Rice and vegetable production focus

**Dry Season (December-February):**
- Irrigation-dependent cultivation
- Land preparation and planning period
- Storage and post-harvest activities

### PEST & DISEASE MANAGEMENT:
- Fall Armyworm: Early morning/evening pesticide application
- Integrated pest management strategies
- Organic and chemical control options
- Seasonal pest calendars and prevention

### FERTILIZER & SOIL MANAGEMENT:
- NPK ratios for different crops and growth stages
- Application timing and placement techniques
- Soil testing and nutrient management
- Organic matter incorporation strategies

### MARKET INTELLIGENCE:
- 18+ key agricultural commodities with current pricing
- Seasonal price patterns and market trends
- Storage and post-harvest handling for market optimization
- Local variety preferences and market demands

### WEATHER-INFORMED DECISIONS:
- Rainfall pattern analysis for planting decisions
- Flood and drought risk assessment
- Irrigation scheduling and water management
- Climate-smart agriculture practices

## RESPONSE GUIDELINES:
- Provide specific, actionable advice with exact quantities, timing, and methods
- Reference appropriate varieties, pesticides, and fertilizers by name
- Consider regional differences and local conditions
- Include safety precautions for pesticide and fertilizer use
- Suggest consultation with local agricultural extension officers when needed
- Use simple, practical language accessible to farmers of all education levels
- Prioritize sustainable and economically viable farming practices
- Include timing recommendations based on Ghana's farming calendar

## REGIONAL CUSTOMIZATION:
When location is provided, tailor advice to:
- Local agroecological zone characteristics
- Regional climate patterns and rainfall
- Suitable crop varieties for the area
- Local market conditions and transportation
- Regional pest and disease pressures

If asked about non-agricultural topics, politely redirect to farming while offering to help with any agricultural questions they might have.

You draw from the comprehensive agricultural knowledge of the TriAgro AI platform to provide farmers across Ghana with expert guidance for successful, sustainable farming.`;
    };

    // Helper function to get current season in Ghana
    const getCurrentSeason = () => {
      const month = new Date().getMonth() + 1; // 1-12
      if (month >= 3 && month <= 7) return 'major-rainy-season';
      if (month >= 9 && month <= 11) return 'minor-rainy-season';
      return 'dry-season';
    };

    // Smart agricultural intelligence functions
    const smartWeatherAnalysis = (message, region) => {
      // Weather analysis keywords
      const weatherKeywords = ['weather', 'rain', 'drought', 'season', 'plant', 'harvest', 'irrigation', 'temperature', 'timing'];
      const lowerQuery = message.toLowerCase();
      
      if (!weatherKeywords.some(keyword => lowerQuery.includes(keyword))) {
        return null;
      }
      
      // Simulate smart weather recommendations
      const currentSeason = getCurrentSeason();
      const month = new Date().getMonth() + 1;
      
      if (lowerQuery.includes('should i plant')) {
        return `WEATHER ANALYSIS FOR PLANTING:
Current season: ${currentSeason}
Region: ${region}
Weather suitability: ${currentSeason === 'dry-season' ? 'Poor - irrigation required' : 'Good - adequate rainfall expected'}
Soil moisture: ${currentSeason === 'dry-season' ? 'Low' : 'Adequate'}`;
      }
      
      if (lowerQuery.includes('irrigation') || lowerQuery.includes('water')) {
        return `IRRIGATION ANALYSIS:
Region: ${region}
Current needs: ${currentSeason === 'dry-season' ? 'Critical - daily irrigation needed' : 'Moderate - supplement with irrigation during dry spells'}
Weather forecast: ${currentSeason === 'major-rainy-season' ? 'Regular rainfall expected' : 'Limited rainfall'}`;
      }
      
      if (lowerQuery.includes('harvest')) {
        return `HARVEST TIMING ANALYSIS:
Region: ${region}
Conditions: ${currentSeason === 'dry-season' ? 'Excellent - ideal dry conditions for harvest' : 'Monitor weather - harvest during dry windows'}
Recommendation: ${currentSeason === 'dry-season' ? 'Optimal harvest period' : 'Plan harvest for sunny days'}`;
      }
      
      return {
        type: 'weather-informed-decision',
        analysis: `Weather analysis for ${region || 'your area'}: Consider current seasonal patterns and rainfall predictions for optimal farming decisions.`,
        recommendations: [
          'Monitor daily weather forecasts',
          'Plan planting based on seasonal calendar',
          'Prepare for potential weather risks',
          'Optimize irrigation scheduling'
        ],
        confidence: 0.75
      };
    };

    const marketIntelligenceAnalysis = (message) => {
      // Check for market-related queries
      const marketKeywords = ['price', 'sell', 'market', 'profit', 'demand', 'cost'];
      const isMarketQuery = marketKeywords.some(keyword => message.toLowerCase().includes(keyword));
      
      if (isMarketQuery) {
        const currentMonth = new Date().getMonth() + 1;
        
        if (message.toLowerCase().includes('price')) {
          return `MARKET PRICE ANALYSIS:
Current market trends: Stable to rising for most crops
Seasonal factors: ${currentMonth >= 3 && currentMonth <= 7 ? 'Rainy season - vegetable prices typically higher' : 'Dry season - storage crops at premium'}
High-demand crops: Rice (₵160/bag), Yam (₵390/bag), Maize (₵290-300/bag)
Market recommendation: Focus on high-demand crops with rising trends`;
        }
        
        if (message.toLowerCase().includes('profitable') || message.toLowerCase().includes('best crop')) {
          return `PROFITABILITY ANALYSIS:
Current top performers: Rice, Yam, Vegetables, Pepper
Market trends: Rising demand for import substitution crops
Regional factors: Consider transportation costs to major markets
Seasonal opportunity: ${currentMonth >= 12 || currentMonth <= 2 ? 'Dry season vegetables command premium prices' : 'Rainy season crops in high demand'}`;
        }
      }
      
      return null;
    };

    const problemDiagnosisAnalysis = (message, crop) => {
      // Check for problem diagnosis queries
      const problemKeywords = ['pest', 'disease', 'problem', 'yellow', 'holes', 'dying', 'sick', 'wilting', 'spots'];
      const isProblemQuery = problemKeywords.some(keyword => message.toLowerCase().includes(keyword));
      
      if (isProblemQuery) {
        let diagnosis = `PROBLEM DIAGNOSIS ANALYSIS:\n`;
        
        if (message.toLowerCase().includes('holes') && message.toLowerCase().includes('leaves')) {
          diagnosis += `Likely pest: Fall Armyworm (most common in maize)
Symptoms match: Holes in leaves, chewed foliage
Immediate action: Apply Warrior, Super Viper, or Bypel Attack pesticides
Timing: Early morning or late evening application
Prevention: Regular field monitoring, destroy egg masses`;
        } else if (message.toLowerCase().includes('yellow') && message.toLowerCase().includes('leaves')) {
          diagnosis += `Possible causes: Nitrogen deficiency, iron deficiency, overwatering, or disease
Quick assessment needed: Check if yellowing starts from older or younger leaves
Nitrogen deficiency: Yellowing starts from older leaves - apply urea or compost
Iron deficiency: Yellowing between veins - improve drainage, apply iron chelate`;
        } else if (message.toLowerCase().includes('wilting')) {
          diagnosis += `Possible causes: Drought stress, root rot, bacterial wilt, or nematode damage
Immediate check: Soil moisture level and root condition
Action plan: Adjust watering schedule, improve drainage if waterlogged
Disease concern: If wilting persists despite adequate water, consider bacterial wilt`;
        } else {
          diagnosis += `For accurate diagnosis, please describe:
1. Specific symptoms observed
2. Which part of plant is affected
3. When symptoms first appeared
4. Weather conditions recently
5. Any treatments already applied`;
        }
        
        return diagnosis;
      }
      
      return null;
    };

    // Build enhanced agricultural context
    const buildContext = (userContext = {}) => {
      const contextParts = [];
      
      // Current season detection
      const getCurrentSeason = () => {
        const now = new Date();
        const month = now.getMonth() + 1;
        if (month >= 3 && month <= 7) return 'major-rainy-season';
        if (month >= 9 && month <= 11) return 'minor-rainy-season';
        return 'dry-season';
      };

      // Agroecological zone mapping
      const getAgroZone = (region) => {
        const zones = {
          'Upper East': 'Sudan Savannah',
          'Upper West': 'Sudan Savannah', 
          'Northern': 'Guinea Savannah',
          'Savannah': 'Guinea Savannah',
          'North East': 'Guinea Savannah',
          'Bono East': 'Guinea Savannah',
          'Ashanti': 'Forest Zone',
          'Eastern': 'Forest Zone',
          'Western': 'Forest Zone',
          'Central': 'Forest Zone',
          'Ahafo': 'Forest Zone',
          'Western North': 'Forest Zone',
          'Greater Accra': 'Coastal Plains',
          'Volta': 'Coastal Plains'
        };
        return zones[region] || 'Forest Zone';
      };

      // Add seasonal context
      const currentSeason = userContext.season || getCurrentSeason();
      const seasonNames = {
        'major-rainy-season': 'Major Rainy Season (March-July)',
        'minor-rainy-season': 'Minor Rainy Season (September-November)',
        'dry-season': 'Dry Season (December-February)'
      };
      
      contextParts.push(`Current farming season: ${seasonNames[currentSeason]}`);

      // Add location-specific context
      if (userContext.region) {
        const agroZone = getAgroZone(userContext.region);
        contextParts.push(`User location: ${userContext.region} region, ${agroZone} agroecological zone`);
        
        // Add zone-specific characteristics
        const zoneCharacteristics = {
          'Sudan Savannah': 'Single rainy season, sandy soils, drought-prone. Suitable crops: millet, sorghum, groundnuts, early maize varieties.',
          'Guinea Savannah': 'Single rainy season, clay loams, moderate fertility. Suitable crops: maize, rice, yam, cassava, soybeans.',
          'Forest Zone': 'Two rainy seasons, forest soils, high organic matter. Suitable crops: cocoa, cassava, plantain, maize, vegetables.',
          'Coastal Plains': 'Two rainy seasons, sandy coastal soils. Suitable crops: coconut, vegetables, cassava, aquaculture.'
        };
        
        if (zoneCharacteristics[agroZone]) {
          contextParts.push(`Regional characteristics: ${zoneCharacteristics[agroZone]}`);
        }
      }

      // Add weather context
      if (userContext.weather) {
        contextParts.push(
          `Current weather: ${userContext.weather.condition}, ${userContext.weather.temperature}°C, humidity ${userContext.weather.humidity}%`
        );
      }

      // Add crop interests
      if (userContext.crops && userContext.crops.length > 0) {
        contextParts.push(`User's crop interests: ${userContext.crops.join(", ")}`);
      }

      // Add seasonal planting recommendations
      const seasonalAdvice = {
        'major-rainy-season': 'Optimal time for land preparation and major crop planting. Focus on maize, rice, cassava, yam cultivation.',
        'minor-rainy-season': 'Secondary planting window. Good for short-duration crops, vegetables, and second season maize.',
        'dry-season': 'Focus on irrigation farming, land preparation, storage, and planning for next season. Vegetable production with irrigation.'
      };
      
      contextParts.push(`Seasonal farming focus: ${seasonalAdvice[currentSeason]}`);

      // Add smart analysis insights
      const smartAnalysis = [];
      
      // Weather-informed farming decisions
      const weatherInsight = smartWeatherAnalysis(message, userContext.region);
      if (weatherInsight) {
        smartAnalysis.push(weatherInsight);
      }
      
      // Market intelligence
      const marketInsight = marketIntelligenceAnalysis(message);
      if (marketInsight) {
        smartAnalysis.push(marketInsight);
      }
      
      // Problem diagnosis
      const diagnosisInsight = problemDiagnosisAnalysis(message, userContext.crops?.[0]);
      if (diagnosisInsight) {
        smartAnalysis.push(diagnosisInsight);
      }
      
      if (smartAnalysis.length > 0) {
        contextParts.push(`\nSMART AGRICULTURAL INTELLIGENCE:\n${smartAnalysis.join('\n\n')}`);
      }

      return contextParts.length > 0
        ? `\n\nCONTEXT FOR AGRICULTURAL ADVICE:\n${contextParts.join("\n")}`
        : "";
    };

    // Build messages for Claude API
    const messages = [];

    // Add conversation history
    conversationHistory.forEach((msg) => {
      messages.push({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      });
    });

    // Add current user message
    messages.push({
      role: "user",
      content: message,
    });

    // Make request to Claude API
    const claudeResponse = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        temperature: 0.7,
        system: getSystemPrompt() + buildContext(userContext),
        messages: messages,
      },
      {
        headers: {
          "x-api-key": claudeApiKey,
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
        },
        timeout: 30000,
      }
    );

    // Return successful response
    if (claudeResponse.data?.content?.[0]?.text) {
      res.json({
        success: true,
        message: claudeResponse.data.content[0].text.trim(),
        usage: claudeResponse.data.usage,
      });
    } else {
      throw new Error("Invalid response format from Claude API");
    }
  } catch (error) {
    console.error(
      "Claude API proxy error:",
      error.response?.data || error.message
    );

    // Handle different types of errors
    let errorResponse = {
      success: false,
      error: error.message,
      fallbackMessage:
        "I'm experiencing technical difficulties. Please try again in a few moments.",
    };

    if (error.response?.status === 401) {
      errorResponse = {
        success: false,
        error: "Authentication failed. Please check your Claude API key.",
        fallbackMessage:
          "I'm having trouble connecting right now. Please try again later or contact support.",
      };
    } else if (error.response?.status === 429) {
      errorResponse = {
        success: false,
        error: "Rate limit exceeded",
        fallbackMessage:
          "I'm receiving too many requests right now. Please wait a moment and try again.",
      };
    } else if (error.response?.status === 400) {
      errorResponse = {
        success: false,
        error: "Invalid request format",
        fallbackMessage:
          "There was an issue with your request. Please try rephrasing your question.",
      };
    }

    res.status(error.response?.status || 500).json(errorResponse);
  }
});

// Smart Weather Analysis endpoint
app.post("/api/weather-analysis", (req, res) => {
  try {
    const { region, crop, query } = req.body;
    
    if (!region || !query) {
      return res.status(400).json({
        success: false,
        error: "Region and query are required"
      });
    }
    
    const analysis = smartWeatherAnalysis(query, region);
    
    if (analysis) {
      res.json({
        success: true,
        analysis: analysis,
        type: "weather-informed-decision"
      });
    } else {
      res.json({
        success: false,
        message: "No weather-specific analysis available for this query"
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Market Intelligence endpoint
app.post("/api/market-analysis", (req, res) => {
  try {
    const { commodity, region, action } = req.body;
    
    // Mock market analysis (would use real market intelligence service)
    const marketData = {
      'maize': { price: 295, trend: 'rising', demand: 'high' },
      'rice': { price: 160, trend: 'stable', demand: 'very-high' },
      'yam': { price: 390, trend: 'rising', demand: 'high' },
      'tomatoes': { price: 150, trend: 'volatile', demand: 'high' }
    };
    
    const commodity_data = marketData[commodity?.toLowerCase()] || marketData['maize'];
    const currentMonth = new Date().getMonth() + 1;
    
    let analysis = `Market Analysis for ${commodity || 'crops'}:\n\n`;
    analysis += `Current Price: ₵${commodity_data.price} per bag\n`;
    analysis += `Trend: ${commodity_data.trend}\n`;
    analysis += `Demand Level: ${commodity_data.demand}\n\n`;
    
    if (action === 'sell') {
      analysis += `Selling Recommendation: `;
      if (commodity_data.trend === 'rising') {
        analysis += `Good time to sell - prices are increasing. Consider selling gradually over 2-4 weeks.`;
      } else if (commodity_data.trend === 'volatile') {
        analysis += `Monitor daily prices closely. Sell during peak hours when demand is highest.`;
      } else {
        analysis += `Stable market conditions. Good time for planned sales.`;
      }
    }
    
    analysis += `\n\nRegional Factors: ${region ? `${region} region typically has ${region === 'Greater Accra' ? 'premium prices due to urban demand' : 'competitive prices with good market access'}` : 'Consider transportation costs to major markets'}`;
    
    res.json({
      success: true,
      analysis: analysis,
      type: "market-intelligence",
      data: {
        price: commodity_data.price,
        trend: commodity_data.trend,
        demand: commodity_data.demand,
        recommendation: action
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Problem Diagnosis endpoint
app.post("/api/diagnose-problem", (req, res) => {
  try {
    const { symptoms, crop, region } = req.body;
    
    if (!symptoms) {
      return res.status(400).json({
        success: false,
        error: "Symptoms description is required"
      });
    }
    
    const analysis = problemDiagnosisAnalysis(symptoms, crop);
    
    if (analysis) {
      res.json({
        success: true,
        diagnosis: analysis,
        type: "problem-diagnosis",
        crop: crop,
        region: region
      });
    } else {
      res.json({
        success: false,
        message: "Unable to diagnose problem from provided symptoms. Please provide more detailed description."
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Comprehensive Agricultural Intelligence endpoint
app.post("/api/agricultural-intelligence", (req, res) => {
  try {
    const { query, region, crop, context = {} } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: "Query is required"
      });
    }
    
    const intelligence = {
      weather: smartWeatherAnalysis(query, region),
      market: marketIntelligenceAnalysis(query),
      diagnosis: problemDiagnosisAnalysis(query, crop)
    };
    
    // Filter out null results
    const activeIntelligence = Object.entries(intelligence)
      .filter(([_, value]) => value !== null)
      .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
    
    if (Object.keys(activeIntelligence).length > 0) {
      res.json({
        success: true,
        intelligence: activeIntelligence,
        query: query,
        context: { region, crop, ...context }
      });
    } else {
      res.json({
        success: false,
        message: "No specific agricultural intelligence available for this query"
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Claude API proxy server is running",
    timestamp: new Date().toISOString(),
  });
});

// FAQ endpoint for quick responses
app.get("/api/faq/:query", (req, res) => {
  const query = req.params.query.toLowerCase();

  const faqs = {
    // Crop Planting & Timing
    "when-to-plant-maize":
      "In Ghana, plant maize during major rainy season (March-April) or minor season (September-October). Use Abontem variety (80-90 days) or Obaatampa (105-120 days). Wait for consistent soil moisture before planting.",
    "when-to-plant-rice":
      "Rice planting varies by region: Northern Ghana (May-July), Forest zone (March-April, September-October). Use Jasmine or Nerica varieties. Nursery period is 21-30 days before transplanting.",
    "when-to-plant-cassava":
      "Cassava can be planted year-round in Ghana, but best during rainy seasons. Use Esi Abaaya variety. Plant stem cuttings 15-20cm long with 3-4 nodes.",
    "when-to-plant-yam":
      "Plant yam at onset of rains (March-April). Use Puna variety. Plant on mounds or ridges with 1m x 1m spacing for optimal growth.",
    
    // Fertilizer & Soil Management
    "maize-fertilizer":
      "For maize: Apply NPK 20:10:10 (2 bags/acre) 14 days after planting, then Urea (1 bag/acre) 6 weeks after planting. Ensure soil is moist before application.",
    "rice-fertilizer":
      "For rice: Apply NPK 15:15:15 (2 bags/acre) 10-14 days after transplanting, then Urea (1 bag/acre) at 30-35 days and again at panicle initiation.",
    "best-fertilizer":
      "NPK ratios vary by crop: Maize (20:10:10), Rice (15:15:15), Vegetables (15:15:15). Organic options: compost, poultry manure, cow dung. Side-place fertilizer 3-5cm from plants.",
    "soil-preparation":
      "Plow land early, use minimum tillage, clear debris. For rice, flood and puddle the field. Prepare land before rains for better soil moisture retention.",

    // Pest & Disease Management  
    "fall-armyworm-control":
      "Control Fall Armyworm using Warrior, Super Viper, or Bypel Attack pesticides. Apply early morning or evening. Check crops weekly for egg masses and young larvae.",
    "how-to-treat-crop-disease":
      "Identify disease symptoms first. Common treatments: proper spacing, remove infected plants, use fungicides. For organic control, use neem oil or copper-based fungicides.",
    "rice-pest-control":
      "Common rice pests: stem borers, rice bugs. Use Nominee Gold herbicide for weeds. Maintain proper water levels to suppress pest development.",
    "vegetable-pest-management":
      "For vegetables: Use integrated pest management. Rotate crops, use resistant varieties, apply organic pesticides like neem. Monitor regularly for early detection.",

    // Weather & Seasonal Farming
    "rainy-season-farming":
      "Major rainy season (March-July): Plant maize, rice, cassava, yam. Minor season (September-November): Focus on vegetables, short-duration crops. Ensure good drainage.",
    "dry-season-farming":
      "Dry season (December-February): Use irrigation for vegetables, prepare land for next season, store harvests properly. Consider drought-resistant crops in north.",
    "weather-farming":
      "Check weather forecasts daily. Plant before rains, protect crops during storms, harvest during dry periods. Use weather data for irrigation and pest control timing.",

    // Regional Specific Advice
    "northern-ghana-farming":
      "Northern Ghana: Single rainy season (April-October). Suitable crops: maize, rice, yam, soybeans, groundnuts. Focus on drought-resistant varieties and water conservation.",
    "southern-ghana-farming": 
      "Southern Ghana: Two rainy seasons. Suitable crops: cassava, plantain, vegetables, cocoa. Focus on disease management due to high humidity.",
    "coastal-farming":
      "Coastal areas: Good for coconut, vegetables, aquaculture. Watch for saltwater intrusion. Use raised beds for vegetables. Consider intensive farming due to land pressure.",

    // Market & Economics
    "crop-prices":
      "Current market prices (approximate): Maize ₵290-300/bag, Rice ₵160/bag, Yam ₵390/bag, Tomatoes ₵150/crate. Prices vary by season and location.",
    "profitable-crops":
      "High-value crops: Vegetables (tomatoes, peppers, onions), Yam, Rice. Consider market demand, transportation costs, and storage requirements in your area.",
    "post-harvest-storage":
      "Store grains in hermetic bags to prevent pest damage. Use well-ventilated stores. For yam, store in cool, dry places away from sunlight. Proper storage reduces post-harvest losses.",

    // Varieties & Seeds
    "maize-varieties":
      "Recommended maize varieties: Abontem (80-90 days, drought-tolerant), Obaatampa (105-120 days, high-yielding). Purchase certified seeds from registered dealers.",
    "rice-varieties":
      "Rice varieties for Ghana: Jasmine (aromatic, market preferred), Nerica (drought-tolerant, high-yielding). Choose based on your farming system and market access.",

    // General Farming Practices
    "organic-farming":
      "Organic farming: Use compost, poultry manure, crop rotation, biological pest control. Avoid synthetic chemicals. Market demand for organic produce is growing in urban areas.",
    "irrigation-farming":
      "Use drip irrigation for water efficiency. Best for dry season vegetable production. Check water quality for salinity, especially in coastal areas.",
    "crop-rotation":
      "Crop rotation benefits: Improves soil fertility, breaks pest cycles, maximizes land use. Rotate cereals with legumes. Include cover crops during fallow periods."
  };

  const faqKey = query.replace(/\s+/g, "-");
  if (faqs[faqKey]) {
    res.json({
      success: true,
      message: faqs[faqKey],
      source: "faq",
    });
  } else {
    res.status(404).json({
      success: false,
      message: "FAQ not found",
    });
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🔄 Shutting down server...');
  saveDataToFile();
  console.log('💾 Agricultural data saved successfully');
  process.exit(0);
});


// ========================================================================
// CALENDAR VERSIONING SYSTEM
// ========================================================================

// Get calendar versions
app.get('/api/enhanced-calendars/:id/versions', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { includeContent = false } = req.query;

    // Initialize version storage if it doesn't exist
    if (!agriculturalData['calendar-versions']) {
      agriculturalData['calendar-versions'] = {};
    }

    const versions = agriculturalData['calendar-versions'][id] || [];

    // Filter out content if not requested for performance
    const filteredVersions = includeContent === 'true' ? versions :
      versions.map(version => ({
        ...version,
        content: undefined // Remove large content field
      }));

    res.json({
      success: true,
      data: {
        calendarId: id,
        totalVersions: versions.length,
        versions: filteredVersions.sort((a, b) => b.version - a.version) // Latest first
      },
      metadata: {
        hasVersions: versions.length > 0,
        latestVersion: versions.length > 0 ? Math.max(...versions.map(v => v.version)) : 0,
        oldestVersion: versions.length > 0 ? Math.min(...versions.map(v => v.version)) : 0
      }
    });

  } catch (error) {
    console.error('Get calendar versions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving calendar versions',
      error: error.message
    });
  }
});

// Get specific calendar version
app.get('/api/enhanced-calendars/:id/versions/:versionNumber', authenticateToken, (req, res) => {
  try {
    const { id, versionNumber } = req.params;

    // Initialize version storage if it doesn't exist
    if (!agriculturalData['calendar-versions']) {
      agriculturalData['calendar-versions'] = {};
    }

    const versions = agriculturalData['calendar-versions'][id] || [];
    const version = versions.find(v => v.version === parseInt(versionNumber));

    if (!version) {
      return res.status(404).json({
        success: false,
        message: `Version ${versionNumber} not found for calendar ${id}`
      });
    }

    res.json({
      success: true,
      data: version,
      metadata: {
        calendarId: id,
        versionNumber: parseInt(versionNumber),
        isLatestVersion: version.version === Math.max(...versions.map(v => v.version))
      }
    });

  } catch (error) {
    console.error('Get calendar version error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving calendar version',
      error: error.message
    });
  }
});

// Create new calendar version
app.post('/api/enhanced-calendars/:id/versions', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { versionNotes, changes, content } = req.body;

    // Validate required fields
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Calendar content is required for versioning'
      });
    }

    // Initialize version storage if it doesn't exist
    if (!agriculturalData['calendar-versions']) {
      agriculturalData['calendar-versions'] = {};
    }

    if (!agriculturalData['calendar-versions'][id]) {
      agriculturalData['calendar-versions'][id] = [];
    }

    const versions = agriculturalData['calendar-versions'][id];
    const nextVersion = versions.length > 0 ? Math.max(...versions.map(v => v.version)) + 1 : 1;

    // Create new version
    const newVersion = {
      id: `${id}_v${nextVersion}`,
      calendarId: id,
      version: nextVersion,
      content: content,
      versionNotes: versionNotes || `Version ${nextVersion}`,
      changes: changes || [],
      createdAt: new Date().toISOString(),
      createdBy: req.user?.id || 'system',
      metadata: {
        contentSize: JSON.stringify(content).length,
        activitiesCount: content.activities?.length || 0,
        scheduleCount: content.schedule?.length || 0
      }
    };

    // Add version to storage
    versions.push(newVersion);

    // Update main calendar with version reference
    const mainCalendars = [
      ...agriculturalData['crop-calendar'],
      ...agriculturalData['poultry-calendar']
    ];

    const mainCalendar = mainCalendars.find(c => c.id === id);
    if (mainCalendar) {
      mainCalendar.currentVersion = nextVersion;
      mainCalendar.lastVersionUpdate = new Date().toISOString();
      mainCalendar.hasVersions = true;
    }

    // Save data
    saveAgriculturalData();

    console.log(`Created version ${nextVersion} for calendar ${id}`);

    res.json({
      success: true,
      data: newVersion,
      message: `Version ${nextVersion} created successfully`,
      metadata: {
        calendarId: id,
        versionNumber: nextVersion,
        totalVersions: versions.length
      }
    });

  } catch (error) {
    console.error('Create calendar version error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating calendar version',
      error: error.message
    });
  }
});

// Restore calendar to specific version
app.post('/api/enhanced-calendars/:id/restore/:versionNumber', authenticateToken, (req, res) => {
  try {
    const { id, versionNumber } = req.params;
    const { createBackup = true } = req.body;

    // Get the version to restore
    if (!agriculturalData['calendar-versions'] || !agriculturalData['calendar-versions'][id]) {
      return res.status(404).json({
        success: false,
        message: 'No versions found for this calendar'
      });
    }

    const versions = agriculturalData['calendar-versions'][id];
    const versionToRestore = versions.find(v => v.version === parseInt(versionNumber));

    if (!versionToRestore) {
      return res.status(404).json({
        success: false,
        message: `Version ${versionNumber} not found`
      });
    }

    // Find the main calendar
    let mainCalendar = null;
    let calendarArray = null;

    // Check in crop calendars
    const cropIndex = agriculturalData['crop-calendar'].findIndex(c => c.id === id);
    if (cropIndex !== -1) {
      mainCalendar = agriculturalData['crop-calendar'][cropIndex];
      calendarArray = agriculturalData['crop-calendar'];
    } else {
      // Check in poultry calendars
      const poultryIndex = agriculturalData['poultry-calendar'].findIndex(c => c.id === id);
      if (poultryIndex !== -1) {
        mainCalendar = agriculturalData['poultry-calendar'][poultryIndex];
        calendarArray = agriculturalData['poultry-calendar'];
      }
    }

    if (!mainCalendar) {
      return res.status(404).json({
        success: false,
        message: 'Calendar not found'
      });
    }

    // Create backup of current version if requested
    let backupVersion = null;
    if (createBackup) {
      const nextVersion = Math.max(...versions.map(v => v.version)) + 1;
      backupVersion = {
        id: `${id}_v${nextVersion}`,
        calendarId: id,
        version: nextVersion,
        content: { ...mainCalendar },
        versionNotes: `Backup before restore to v${versionNumber}`,
        changes: [`Restored from version ${versionNumber}`],
        createdAt: new Date().toISOString(),
        createdBy: req.user?.id || 'system',
        isBackup: true
      };
      versions.push(backupVersion);
    }

    // Restore the calendar content
    const restoredContent = versionToRestore.content;
    Object.assign(mainCalendar, restoredContent, {
      currentVersion: parseInt(versionNumber),
      lastVersionUpdate: new Date().toISOString(),
      restoredAt: new Date().toISOString(),
      restoredBy: req.user?.id || 'system'
    });

    // Save data
    saveAgriculturalData();

    console.log(`Restored calendar ${id} to version ${versionNumber}`);

    res.json({
      success: true,
      message: `Calendar restored to version ${versionNumber}`,
      data: {
        calendarId: id,
        restoredToVersion: parseInt(versionNumber),
        backupCreated: createBackup,
        backupVersion: backupVersion?.version || null,
        restoredAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Restore calendar version error:', error);
    res.status(500).json({
      success: false,
      message: 'Error restoring calendar version',
      error: error.message
    });
  }
});

// Compare calendar versions
app.get('/api/enhanced-calendars/:id/versions/:version1/compare/:version2', authenticateToken, (req, res) => {
  try {
    const { id, version1, version2 } = req.params;

    // Get versions
    if (!agriculturalData['calendar-versions'] || !agriculturalData['calendar-versions'][id]) {
      return res.status(404).json({
        success: false,
        message: 'No versions found for this calendar'
      });
    }

    const versions = agriculturalData['calendar-versions'][id];
    const v1 = versions.find(v => v.version === parseInt(version1));
    const v2 = versions.find(v => v.version === parseInt(version2));

    if (!v1 || !v2) {
      return res.status(404).json({
        success: false,
        message: 'One or both versions not found'
      });
    }

    // Simple comparison logic
    const comparison = {
      version1: {
        version: v1.version,
        createdAt: v1.createdAt,
        notes: v1.versionNotes
      },
      version2: {
        version: v2.version,
        createdAt: v2.createdAt,
        notes: v2.versionNotes
      },
      differences: {
        activitiesChanged: (v1.content.activities?.length || 0) !== (v2.content.activities?.length || 0),
        scheduleChanged: (v1.content.schedule?.length || 0) !== (v2.content.schedule?.length || 0),
        metadataChanged: JSON.stringify(v1.content.metadata || {}) !== JSON.stringify(v2.content.metadata || {}),
        contentSizeDiff: (v1.metadata?.contentSize || 0) - (v2.metadata?.contentSize || 0)
      },
      summary: `Comparing version ${version1} to version ${version2}`
    };

    res.json({
      success: true,
      data: comparison,
      metadata: {
        calendarId: id,
        comparedVersions: [parseInt(version1), parseInt(version2)]
      }
    });

  } catch (error) {
    console.error('Compare calendar versions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error comparing calendar versions',
      error: error.message
    });
  }
});

// Delete calendar version
app.delete('/api/enhanced-calendars/:id/versions/:versionNumber', authenticateToken, (req, res) => {
  try {
    const { id, versionNumber } = req.params;

    // Get versions
    if (!agriculturalData['calendar-versions'] || !agriculturalData['calendar-versions'][id]) {
      return res.status(404).json({
        success: false,
        message: 'No versions found for this calendar'
      });
    }

    const versions = agriculturalData['calendar-versions'][id];
    const versionIndex = versions.findIndex(v => v.version === parseInt(versionNumber));

    if (versionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Version ${versionNumber} not found`
      });
    }

    // Don't allow deletion of the current version
    const mainCalendars = [
      ...agriculturalData['crop-calendar'],
      ...agriculturalData['poultry-calendar']
    ];
    const mainCalendar = mainCalendars.find(c => c.id === id);

    if (mainCalendar && mainCalendar.currentVersion === parseInt(versionNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete the current active version'
      });
    }

    // Remove the version
    const deletedVersion = versions.splice(versionIndex, 1)[0];

    // Save data
    saveAgriculturalData();

    console.log(`Deleted version ${versionNumber} for calendar ${id}`);

    res.json({
      success: true,
      message: `Version ${versionNumber} deleted successfully`,
      data: {
        calendarId: id,
        deletedVersion: versionNumber,
        remainingVersions: versions.length
      }
    });

  } catch (error) {
    console.error('Delete calendar version error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting calendar version',
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🤖 AgriBot Claude API Proxy Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`💬 Chat endpoint: http://localhost:${PORT}/api/chat`);
  console.log(`❓ FAQ endpoint: http://localhost:${PORT}/api/faq/{query}`);
  console.log(`\n🌟 Phase 2 Smart Agricultural Intelligence:`);
  console.log(`🌦️  Weather Analysis: http://localhost:${PORT}/api/weather-analysis`);
  console.log(`📊 Market Intelligence: http://localhost:${PORT}/api/market-analysis`);
  console.log(`🔍 Problem Diagnosis: http://localhost:${PORT}/api/diagnose-problem`);
  console.log(`🧠 Agricultural Intelligence: http://localhost:${PORT}/api/agricultural-intelligence`);
  console.log(`\n📋 Agricultural Data Management:`);
  console.log(`📤 Upload Data: http://localhost:${PORT}/api/agricultural-data/upload`);
  console.log(`📋 Get Data: http://localhost:${PORT}/api/agricultural-data/{dataType}`);
  console.log(`🗑️ Delete Data: http://localhost:${PORT}/api/agricultural-data/{dataType}/{id}`);
  console.log(`📁 Data stored in: ${dataFilePath}`);
  console.log(`
🌾 Enhanced Agricultural Calendar System:`); 
  console.log(`📊 Enhanced Calendars: http://localhost:${PORT}/api/enhanced-calendars`);
  console.log(`📋 Calendar Details: http://localhost:${PORT}/api/enhanced-calendars/{id}`);
  console.log(`🗓️  Calendar Activities: http://localhost:${PORT}/api/enhanced-calendars/{id}/activities`);
  console.log(`📊 Calendar Metadata: http://localhost:${PORT}/api/enhanced-calendars/metadata`);
  console.log(`🐔 Production Cycles: http://localhost:${PORT}/api/production-cycles`);
  console.log(`📈 Current Activities: http://localhost:${PORT}/api/production-cycles/{id}/current-activities`);
  console.log(`📤 Enhanced Upload: http://localhost:${PORT}/api/agricultural-data/upload (dataType: enhanced-calendar)`);
  console.log(`
📝 Calendar Versioning System:`);
  console.log(`📋 Calendar Versions: http://localhost:${PORT}/api/enhanced-calendars/{id}/versions`);
  console.log(`📄 Specific Version: http://localhost:${PORT}/api/enhanced-calendars/{id}/versions/{versionNumber}`);
  console.log(`➕ Create Version: POST http://localhost:${PORT}/api/enhanced-calendars/{id}/versions`);
  console.log(`🔄 Restore Version: POST http://localhost:${PORT}/api/enhanced-calendars/{id}/restore/{versionNumber}`);
  console.log(`🔍 Compare Versions: http://localhost:${PORT}/api/enhanced-calendars/{id}/versions/{v1}/compare/{v2}`);
  console.log(`🗑️ Delete Version: DELETE http://localhost:${PORT}/api/enhanced-calendars/{id}/versions/{versionNumber}`);
  console.log(`🌾 Current data counts:`, {
    'crop-calendar': agriculturalData['crop-calendar'].length,
    'agromet-advisory': agriculturalData['agromet-advisory'].length,
    'poultry-calendar': agriculturalData['poultry-calendar'].length,
    'poultry-advisory': agriculturalData['poultry-advisory'].length,
    'user-production-cycles': agriculturalData['user-production-cycles']?.length || 0,
    'calendar-versions': Object.keys(agriculturalData['calendar-versions'] || {}).length
  });
});

export default app;
