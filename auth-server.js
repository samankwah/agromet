import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import agriculturalDataParser from './services/agriculturalDataParser.js';

// ES6 module path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.AUTH_PORT || 3002;

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'triagro-ai-secret-key-2025';

// In-memory storage for demo (in production, use a proper database)
const users = new Map();
const userFiles = new Map();

// Agricultural data storage
const agriculturalData = {
  cropCalendars: new Map(),
  productionCalendars: new Map(),
  agrometAdvisories: new Map(),
  poultryCalendars: new Map(),
  commodityAdvisories: new Map()
};

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

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

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
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

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

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
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5178",
    "http://localhost:3000",
  ],
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));

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
    if (users.has(email.toLowerCase())) {
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

    users.set(email.toLowerCase(), user);
    userFiles.set(userId, []);

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

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required"
      });
    }

    const user = users.get(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password"
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password"
      });
    }

    user.lastLogin = new Date().toISOString();

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

// =============================================================================
// FILE UPLOAD ENDPOINTS
// =============================================================================

// File Upload Handler with Agricultural Data Processing
const handleFileUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file provided"
      });
    }

    const { reportType, title, description, tags } = req.body;
    const userId = req.user.userId;

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
      uploadedAt: new Date().toISOString(),
      processed: false,
      agriculturalData: null
    };

    // Check if file is agricultural data (CSV or Excel)
    const isAgriculturalFile = (
      req.file.mimetype.includes('csv') || 
      req.file.mimetype.includes('sheet') ||
      req.file.originalname.toLowerCase().includes('calendar') ||
      req.file.originalname.toLowerCase().includes('advisory') ||
      req.file.originalname.toLowerCase().includes('agromet')
    );

    let agriculturalProcessingResult = null;

    if (isAgriculturalFile) {
      try {
        console.log(`🌾 Processing agricultural data file: ${req.file.originalname}`);
        
        // Determine file type
        const fileType = req.file.mimetype.includes('csv') ? 'csv' : 'excel';
        
        // Parse agricultural data
        agriculturalProcessingResult = await agriculturalDataParser.parseFile(
          req.file.path,
          fileType,
          req.file.originalname
        );

        // Store the parsed data in appropriate storage
        const { contentType, data, metadata } = agriculturalProcessingResult;
        
        switch (contentType) {
          case 'crop_calendar':
            data.forEach(record => {
              agriculturalData.cropCalendars.set(record.id, {
                ...record,
                uploadedBy: userId,
                fileId: fileRecord.id
              });
            });
            console.log(`✅ Stored ${data.length} crop calendar records`);
            break;
            
          case 'production_calendar':
            data.forEach(record => {
              agriculturalData.productionCalendars.set(record.id, {
                ...record,
                uploadedBy: userId,
                fileId: fileRecord.id
              });
            });
            console.log(`✅ Stored ${data.length} production calendar records`);
            break;
            
          case 'agromet_advisory':
            data.forEach(record => {
              agriculturalData.agrometAdvisories.set(record.id, {
                ...record,
                uploadedBy: userId,
                fileId: fileRecord.id
              });
            });
            console.log(`✅ Stored ${data.length} agromet advisory records`);
            break;
            
          case 'poultry_calendar':
            data.forEach(record => {
              agriculturalData.poultryCalendars.set(record.id, {
                ...record,
                uploadedBy: userId,
                fileId: fileRecord.id
              });
            });
            console.log(`✅ Stored ${data.length} poultry calendar records`);
            break;
            
          case 'commodity_advisory':
            data.forEach(record => {
              agriculturalData.commodityAdvisories.set(record.id, {
                ...record,
                uploadedBy: userId,
                fileId: fileRecord.id
              });
            });
            console.log(`✅ Stored ${data.length} commodity advisory records`);
            break;
        }

        fileRecord.processed = true;
        fileRecord.agriculturalData = {
          contentType,
          recordCount: data.length,
          metadata
        };

      } catch (parseError) {
        console.error(`❌ Failed to process agricultural data: ${parseError.message}`);
        fileRecord.agriculturalData = {
          error: parseError.message,
          processed: false
        };
      }
    }

    // Store file record
    const files = userFiles.get(userId) || [];
    files.push(fileRecord);
    userFiles.set(userId, files);

    console.log(`✅ File uploaded: ${req.file.originalname} by user ${userId}`);

    res.json({
      success: true,
      message: isAgriculturalFile ? 
        "Agricultural data file uploaded and processed successfully" : 
        "File uploaded successfully",
      data: {
        id: fileRecord.id,
        originalName: fileRecord.originalName,
        size: fileRecord.size,
        reportType: fileRecord.reportType,
        title: fileRecord.title,
        uploadedAt: fileRecord.uploadedAt,
        processed: fileRecord.processed,
        agriculturalData: fileRecord.agriculturalData
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

// Dashboard Stats
app.get("/user/dashboard/stats", authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const files = userFiles.get(userId) || [];

    const stats = {
      totalFiles: files.length,
      totalReports: files.length,
      pendingReports: 0,
      completedReports: files.length,
      totalFileSize: files.reduce((sum, file) => sum + file.size, 0),
      lastActivity: files.length > 0 
        ? Math.max(...files.map(f => new Date(f.uploadedAt).getTime()))
        : Date.now(),
      recentFiles: files
        .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
        .slice(0, 5)
        .map(f => ({
          id: f.id,
          name: f.originalName,
          uploadedAt: f.uploadedAt
        }))
    };

    stats.lastActivity = new Date(stats.lastActivity).toISOString();

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

// Notifications (empty for now)
app.get("/user/notifications", authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: []
  });
});

// =============================================================================
// PUBLIC API ENDPOINTS FOR FRONTEND CONSUMPTION
// =============================================================================

// Get Crop Calendar Data
app.get("/api/crop-calendar", (req, res) => {
  try {
    const { district, crop, season, year } = req.query;
    let data = Array.from(agriculturalData.cropCalendars.values());

    // Apply filters
    if (district) {
      data = data.filter(record => 
        record.district.toLowerCase().includes(district.toLowerCase())
      );
    }
    if (crop) {
      data = data.filter(record => 
        record.crop.toLowerCase().includes(crop.toLowerCase())
      );
    }
    if (season) {
      data = data.filter(record => 
        record.season.toLowerCase().includes(season.toLowerCase())
      );
    }
    if (year) {
      data = data.filter(record => record.year === parseInt(year));
    }

    res.json({
      success: true,
      data: data.map(record => ({
        id: record.id,
        district: record.district,
        crop: record.crop,
        plantingStart: record.plantingStart,
        plantingEnd: record.plantingEnd,
        harvestStart: record.harvestStart,
        harvestEnd: record.harvestEnd,
        season: record.season,
        year: record.year,
        variety: record.variety,
        notes: record.notes
      })),
      total: data.length,
      filters: { district, crop, season, year }
    });
  } catch (error) {
    console.error("Crop calendar API error:", error);
    res.status(500).json({
      success: false,
      error: "Error retrieving crop calendar data"
    });
  }
});

// Get Production Calendar Data
app.get("/api/production-calendar", (req, res) => {
  try {
    const { district, month, crop, activity } = req.query;
    let data = Array.from(agriculturalData.productionCalendars.values());

    // Apply filters
    if (district) {
      data = data.filter(record => 
        record.district.toLowerCase().includes(district.toLowerCase())
      );
    }
    if (month) {
      data = data.filter(record => 
        record.month.toLowerCase().includes(month.toLowerCase())
      );
    }
    if (crop) {
      data = data.filter(record => 
        record.crop.toLowerCase().includes(crop.toLowerCase())
      );
    }
    if (activity) {
      data = data.filter(record => 
        record.activity.toLowerCase().includes(activity.toLowerCase())
      );
    }

    res.json({
      success: true,
      data: data.map(record => ({
        id: record.id,
        district: record.district,
        activity: record.activity,
        month: record.month,
        week: record.week,
        crop: record.crop,
        description: record.description,
        tools: record.tools,
        season: record.season,
        priority: record.priority,
        duration: record.duration
      })),
      total: data.length,
      filters: { district, month, crop, activity }
    });
  } catch (error) {
    console.error("Production calendar API error:", error);
    res.status(500).json({
      success: false,
      error: "Error retrieving production calendar data"
    });
  }
});

// Get Agromet Advisory Data
app.get("/api/agromet-advisory", (req, res) => {
  try {
    const { district, crop, category, priority, date_from, date_to } = req.query;
    let data = Array.from(agriculturalData.agrometAdvisories.values());

    // Apply filters
    if (district) {
      data = data.filter(record => 
        record.district.toLowerCase().includes(district.toLowerCase())
      );
    }
    if (crop) {
      data = data.filter(record => 
        record.crop.toLowerCase().includes(crop.toLowerCase())
      );
    }
    if (category) {
      data = data.filter(record => 
        record.category.toLowerCase().includes(category.toLowerCase())
      );
    }
    if (priority) {
      data = data.filter(record => 
        record.priority.toLowerCase().includes(priority.toLowerCase())
      );
    }
    if (date_from) {
      data = data.filter(record => record.date >= date_from);
    }
    if (date_to) {
      data = data.filter(record => record.date <= date_to);
    }

    // Sort by date (newest first)
    data.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      success: true,
      data: data.map(record => ({
        id: record.id,
        district: record.district,
        date: record.date,
        weatherCondition: record.weatherCondition,
        advisory: record.advisory,
        crop: record.crop,
        action: record.action,
        priority: record.priority,
        validFrom: record.validFrom,
        validTo: record.validTo,
        temperature: record.temperature,
        rainfall: record.rainfall,
        humidity: record.humidity,
        category: record.category
      })),
      total: data.length,
      filters: { district, crop, category, priority, date_from, date_to }
    });
  } catch (error) {
    console.error("Agromet advisory API error:", error);
    res.status(500).json({
      success: false,
      error: "Error retrieving agromet advisory data"
    });
  }
});

// Get Poultry Calendar Data
app.get("/api/poultry-calendar", (req, res) => {
  try {
    const { district, poultryType, activity, season, year } = req.query;
    let data = Array.from(agriculturalData.poultryCalendars.values());

    // Apply filters
    if (district) {
      data = data.filter(record => 
        record.district.toLowerCase().includes(district.toLowerCase())
      );
    }
    if (poultryType) {
      data = data.filter(record => 
        record.poultryType.toLowerCase().includes(poultryType.toLowerCase())
      );
    }
    if (activity) {
      data = data.filter(record => 
        record.activity.toLowerCase().includes(activity.toLowerCase())
      );
    }
    if (season) {
      data = data.filter(record => 
        record.season.toLowerCase().includes(season.toLowerCase())
      );
    }
    if (year) {
      data = data.filter(record => record.year === parseInt(year));
    }

    // Sort by start week
    data.sort((a, b) => a.startWeek - b.startWeek);

    res.json({
      success: true,
      data: data.map(record => ({
        id: record.id,
        district: record.district,
        poultryType: record.poultryType,
        activity: record.activity,
        startWeek: record.startWeek,
        endWeek: record.endWeek,
        season: record.season,
        year: record.year,
        advisory: record.advisory,
        color: record.color,
        priority: record.priority,
        duration: record.duration,
        notes: record.notes
      })),
      total: data.length,
      filters: { district, poultryType, activity, season, year }
    });
  } catch (error) {
    console.error("Poultry calendar API error:", error);
    res.status(500).json({
      success: false,
      error: "Error retrieving poultry calendar data"
    });
  }
});

// Get Commodity Advisory Data
app.get("/api/commodity-advisory", (req, res) => {
  try {
    const { district, crop, stage, commodityCode, region, zone, week } = req.query;
    let data = Array.from(agriculturalData.commodityAdvisories.values());

    // Apply filters
    if (district) {
      data = data.filter(record => 
        record.district.toLowerCase().includes(district.toLowerCase())
      );
    }
    if (crop) {
      data = data.filter(record => 
        record.crop.toLowerCase().includes(crop.toLowerCase())
      );
    }
    if (stage) {
      data = data.filter(record => 
        record.stage.toLowerCase().includes(stage.toLowerCase())
      );
    }
    if (commodityCode) {
      data = data.filter(record => record.commodityCode === commodityCode);
    }
    if (region) {
      data = data.filter(record => 
        record.region.toLowerCase().includes(region.toLowerCase())
      );
    }
    if (zone) {
      data = data.filter(record => 
        record.zone.toLowerCase().includes(zone.toLowerCase())
      );
    }
    if (week) {
      const weekNum = parseInt(week);
      data = data.filter(record => 
        weekNum >= record.startWeek && weekNum <= record.endWeek
      );
    }

    // Sort by start week, then by stage
    data.sort((a, b) => {
      if (a.startWeek !== b.startWeek) {
        return a.startWeek - b.startWeek;
      }
      return a.stage.localeCompare(b.stage);
    });

    res.json({
      success: true,
      data: data.map(record => ({
        id: record.id,
        commodityCode: record.commodityCode,
        crop: record.crop,
        regionCode: record.regionCode,
        region: record.region,
        districtCode: record.districtCode,
        district: record.district,
        zone: record.zone,
        stage: record.stage,
        activity: record.activity,
        monthYear: record.monthYear,
        week: record.week,
        startWeek: record.startWeek,
        endWeek: record.endWeek,
        startDate: record.startDate,
        endDate: record.endDate,
        advisory: record.advisory,
        priority: record.priority,
        category: record.category
      })),
      total: data.length,
      filters: { district, crop, stage, commodityCode, region, zone, week }
    });
  } catch (error) {
    console.error("Commodity advisory API error:", error);
    res.status(500).json({
      success: false,
      error: "Error retrieving commodity advisory data"
    });
  }
});

// Get Available Districts
app.get("/api/districts", (req, res) => {
  try {
    const districts = new Set();
    
    // Collect districts from all agricultural data
    Array.from(agriculturalData.cropCalendars.values()).forEach(record => districts.add(record.district));
    Array.from(agriculturalData.productionCalendars.values()).forEach(record => districts.add(record.district));
    Array.from(agriculturalData.agrometAdvisories.values()).forEach(record => districts.add(record.district));
    Array.from(agriculturalData.poultryCalendars.values()).forEach(record => districts.add(record.district));
    Array.from(agriculturalData.commodityAdvisories.values()).forEach(record => districts.add(record.district));

    res.json({
      success: true,
      data: Array.from(districts).sort()
    });
  } catch (error) {
    console.error("Districts API error:", error);
    res.status(500).json({
      success: false,
      error: "Error retrieving districts data"
    });
  }
});

// Get Available Crops
app.get("/api/crops", (req, res) => {
  try {
    const crops = new Set();
    
    // Collect crops from all agricultural data
    Array.from(agriculturalData.cropCalendars.values()).forEach(record => crops.add(record.crop));
    Array.from(agriculturalData.productionCalendars.values()).forEach(record => {
      if (record.crop) crops.add(record.crop);
    });
    Array.from(agriculturalData.agrometAdvisories.values()).forEach(record => {
      if (record.crop && record.crop !== 'General') crops.add(record.crop);
    });

    res.json({
      success: true,
      data: Array.from(crops).sort()
    });
  } catch (error) {
    console.error("Crops API error:", error);
    res.status(500).json({
      success: false,
      error: "Error retrieving crops data"
    });
  }
});

// Get Data Statistics
app.get("/api/statistics", (req, res) => {
  try {
    const stats = {
      cropCalendars: agriculturalData.cropCalendars.size,
      productionCalendars: agriculturalData.productionCalendars.size,
      agrometAdvisories: agriculturalData.agrometAdvisories.size,
      poultryCalendars: agriculturalData.poultryCalendars.size,
      commodityAdvisories: agriculturalData.commodityAdvisories.size,
      totalRecords: agriculturalData.cropCalendars.size + 
                   agriculturalData.productionCalendars.size + 
                   agriculturalData.agrometAdvisories.size +
                   agriculturalData.poultryCalendars.size +
                   agriculturalData.commodityAdvisories.size,
      lastUpdated: null
    };

    // Find most recent update
    const allRecords = [
      ...Array.from(agriculturalData.cropCalendars.values()),
      ...Array.from(agriculturalData.productionCalendars.values()),
      ...Array.from(agriculturalData.agrometAdvisories.values()),
      ...Array.from(agriculturalData.poultryCalendars.values()),
      ...Array.from(agriculturalData.commodityAdvisories.values())
    ];

    if (allRecords.length > 0) {
      stats.lastUpdated = allRecords
        .map(record => new Date(record.createdAt))
        .sort((a, b) => b - a)[0]
        .toISOString();
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error("Statistics API error:", error);
    res.status(500).json({
      success: false,
      error: "Error retrieving statistics"
    });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "TriAgro AI Authentication Server",
    timestamp: new Date().toISOString(),
    users: users.size,
    totalFiles: Array.from(userFiles.values()).reduce((total, files) => total + files.length, 0),
    agriculturalData: {
      cropCalendars: agriculturalData.cropCalendars.size,
      productionCalendars: agriculturalData.productionCalendars.size,
      agrometAdvisories: agriculturalData.agrometAdvisories.size,
      poultryCalendars: agriculturalData.poultryCalendars.size,
      commodityAdvisories: agriculturalData.commodityAdvisories.size
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🔐 TriAgro AI Authentication Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`👤 Sign up: POST http://localhost:${PORT}/sign-up`);
  console.log(`🔑 Sign in: POST http://localhost:${PORT}/sign-in`);
  console.log(`📁 File upload: POST http://localhost:${PORT}/upload`);
  console.log(`📊 Dashboard: GET http://localhost:${PORT}/user/dashboard/stats`);
});