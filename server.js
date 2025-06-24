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

// ES6 module path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

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

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000",
    ],
    credentials: true,
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

// Upload agricultural data
app.post('/api/agricultural-data/upload', authenticateToken, uploadMemory.single('file'), (req, res) => {
  try {
    const { dataType } = req.body;
    const file = req.file;
    
    console.log('Upload request received:', { dataType, hasFile: !!file });
    
    if (!dataType) {
      return res.status(400).json({ message: 'Data type is required' });
    }
    
    if (!['crop-calendar', 'agromet-advisory', 'poultry-calendar', 'poultry-advisory'].includes(dataType)) {
      return res.status(400).json({ message: 'Invalid data type' });
    }
    
    // Handle different upload types
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

// Get agricultural data
app.get('/api/agricultural-data/:dataType', authenticateToken, (req, res) => {
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

// Delete agricultural data
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
  console.log(`🌾 Current data counts:`, {
    'crop-calendar': agriculturalData['crop-calendar'].length,
    'agromet-advisory': agriculturalData['agromet-advisory'].length,
    'poultry-calendar': agriculturalData['poultry-calendar'].length,
    'poultry-advisory': agriculturalData['poultry-advisory'].length
  });
});

export default app;
