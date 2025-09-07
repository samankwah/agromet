import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';

// Database and models
import { testConnection } from './config/database.js';
import User from './models/User.js';
import File from './models/File.js';
import AgriculturalRecord from './models/AgriculturalRecord.js';
import ReferenceData from './models/ReferenceData.js';

// Services
import agriculturalDataParser from './services/agriculturalDataParserV2.js';
import dataValidationEngine from './services/dataValidationEngine.js';

// ES6 module path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.AUTH_PORT || 3002;

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'triagro-ai-secret-key-2025';

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
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(403).json({ error: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Middleware
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://localhost:5177",
    "http://localhost:5178",
    "http://localhost:3000",
  ],
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));

// Initialize database connection
const initializeDatabase = async () => {
  try {
    const connected = await testConnection();
    if (connected) {
      console.log('🟢 TriAgro AI Auth Server v2 - Database Ready');
      return true;
    } else {
      console.error('🔴 Database connection failed. Server will use fallback mode.');
      return false;
    }
  } catch (error) {
    console.error('🔴 Database initialization error:', error.message);
    return false;
  }
};

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
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "User with this email already exists"
      });
    }

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      organization: organization || null,
      role: role || 'user'
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: user.toJSON(),
      token
    });

  } catch (error) {
    console.error('Sign up error:', error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error"
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
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password"
      });
    }

    // Verify password
    const validPassword = await user.verifyPassword(password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password"
      });
    }

    // Update last login
    await user.updateLastLogin();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: "Login successful",
      user: user.toJSON(),
      token
    });

  } catch (error) {
    console.error('Sign in error:', error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

// Get User Profile
app.get("/user/profile", authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user.toJSON()
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

// Update User Profile
app.put("/user/profile", authenticateToken, async (req, res) => {
  try {
    const { name, organization } = req.body;
    
    const updatedUser = await req.user.update({
      name: name?.trim(),
      organization: organization?.trim()
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser.toJSON()
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error"
    });
  }
});

// =============================================================================
// FILE UPLOAD ENDPOINTS
// =============================================================================

// Handle file upload with agricultural data processing
const handleFileUpload = async (req, res) => {
  let fileRecord = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded"
      });
    }

    const { originalname, filename, path: filePath, size, mimetype } = req.file;
    const userId = req.user.id;

    console.log(`📁 Processing upload: ${originalname} (${size} bytes)`);

    // Create file record in database
    fileRecord = await File.create({
      userId,
      originalName: originalname,
      storedFilename: filename,
      filePath,
      fileSize: size,
      mimeType: mimetype
    });

    // Check if this is an agricultural data file
    const isAgriculturalFile = (
      mimetype.includes('csv') ||
      mimetype.includes('sheet') ||
      originalname.toLowerCase().includes('calendar') ||
      originalname.toLowerCase().includes('advisory') ||
      originalname.toLowerCase().includes('agromet')
    );

    let agriculturalData = null;

    if (isAgriculturalFile) {
      try {
        // Mark file as processing
        await fileRecord.markAsProcessing('Analyzing agricultural data...');

        // Determine file type for parser
        const fileType = mimetype.includes('csv') ? 'csv' : 'excel';
        
        // Parse agricultural data
        console.log(`🔍 Parsing ${fileType} file for agricultural data...`);
        const parseResult = await agriculturalDataParser.parseFile(filePath, fileType, originalname);
        
        if (parseResult && parseResult.data && parseResult.data.length > 0) {
          console.log(`📊 Found ${parseResult.data.length} agricultural records`);
          
          // Process and store agricultural records
          const records = [];
          for (const rawRecord of parseResult.data) {
            try {
              // Map raw record to database structure
              const recordData = await mapRawRecordToDatabase(rawRecord, parseResult.contentType, fileRecord.id, userId);
              records.push(recordData);
            } catch (mappingError) {
              console.warn(`⚠️ Skipping record due to mapping error: ${mappingError.message}`);
            }
          }

          if (records.length > 0) {
            // Validate records before creation
            console.log(`🔍 Validating ${records.length} records...`);
            const validationResults = await dataValidationEngine.validateBatch(records, parseResult.contentType);
            
            // Filter valid records
            const validRecords = records.filter((_, index) => validationResults.results[index].isValid);
            const invalidRecords = records.filter((_, index) => !validationResults.results[index].isValid);
            
            console.log(`📊 Validation: ${validRecords.length} valid, ${invalidRecords.length} invalid`);
            
            // Create valid records in batch
            let createdRecords = [];
            if (validRecords.length > 0) {
              createdRecords = await AgriculturalRecord.createBatch(validRecords);
            }
            
            // Mark file as processed with validation info
            await fileRecord.markAsProcessed(
              parseResult.contentType,
              {
                ...parseResult.metadata,
                recordsCreated: createdRecords.length,
                recordsSkipped: parseResult.data.length - createdRecords.length,
                validationResults: {
                  totalValidated: validationResults.summary.total,
                  validRecords: validationResults.summary.valid,
                  invalidRecords: validationResults.summary.invalid,
                  averageScore: validationResults.summary.averageScore
                }
              },
              `Successfully processed ${createdRecords.length} valid records (${invalidRecords.length} skipped due to validation)`
            );

            agriculturalData = {
              contentType: parseResult.contentType,
              recordCount: createdRecords.length,
              metadata: parseResult.metadata
            };

            console.log(`✅ Successfully processed ${createdRecords.length} agricultural records`);
          } else {
            await fileRecord.markAsFailed('No valid records could be processed from the file');
          }
        } else {
          await fileRecord.markAsFailed('No agricultural data found in file');
        }
      } catch (parseError) {
        console.error('❌ Agricultural data processing error:', parseError);
        await fileRecord.markAsFailed(`Processing failed: ${parseError.message}`);
      }
    }

    // Get user statistics
    const userStats = await req.user.getStatistics();

    res.json({
      success: true,
      message: "File uploaded successfully",
      file: {
        id: fileRecord.id,
        originalName: fileRecord.originalName,
        size: fileRecord.fileSize,
        mimeType: fileRecord.mimeType,
        status: fileRecord.status,
        uploadedAt: fileRecord.uploadedAt,
        processed: fileRecord.status === 'processed',
        agriculturalData
      },
      userStats
    });

  } catch (error) {
    console.error('❌ File upload error:', error);
    
    // Clean up file if database operation failed
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('File cleanup error:', cleanupError);
      }
    }

    // Mark file as failed if record exists
    if (fileRecord) {
      try {
        await fileRecord.markAsFailed(error.message);
      } catch (updateError) {
        console.error('Error updating file status:', updateError);
      }
    }

    res.status(500).json({
      success: false,
      error: error.message || "File upload failed"
    });
  }
};

// Map raw parsed record to database structure
const mapRawRecordToDatabase = async (rawRecord, contentType, fileId, userId) => {
  const recordData = {
    fileId,
    userId,
    contentType,
    rawData: rawRecord
  };

  // Helper function to resolve reference data
  const resolveRegion = async (regionIdentifier) => {
    if (!regionIdentifier) return null;
    
    // Try by code first, then by name
    let region = await ReferenceData.getRegionByCode(regionIdentifier);
    if (!region) {
      region = await ReferenceData.getRegionByName(regionIdentifier);
    }
    return region?.id || null;
  };

  const resolveDistrict = async (districtIdentifier, regionCode = null) => {
    if (!districtIdentifier) return null;
    
    let district = await ReferenceData.getDistrictByCode(districtIdentifier);
    if (!district) {
      district = await ReferenceData.getDistrictByName(districtIdentifier, regionCode);
    }
    return district?.id || null;
  };

  const resolveCommodity = async (commodityIdentifier) => {
    if (!commodityIdentifier) return null;
    
    let commodity = await ReferenceData.getCommodityByCode(commodityIdentifier);
    if (!commodity) {
      commodity = await ReferenceData.getCommodityByName(commodityIdentifier);
    }
    return commodity?.id || null;
  };

  const resolveProductionStage = async (stageName) => {
    if (!stageName) return null;
    
    const stage = await ReferenceData.getProductionStageByName(stageName);
    return stage?.id || null;
  };

  try {
    // Extract region information
    if (rawRecord.region || rawRecord['[REGION]']) {
      const regionStr = rawRecord.region || rawRecord['[REGION]'];
      recordData.regionId = await resolveRegion(regionStr);
    }

    // Extract district information
    if (rawRecord.district || rawRecord['[DISTRICT]']) {
      const districtStr = rawRecord.district || rawRecord['[DISTRICT]'];
      recordData.districtId = await resolveDistrict(districtStr);
    }

    // Extract commodity information
    if (rawRecord.crop || rawRecord['[CROP]']) {
      const cropStr = rawRecord.crop || rawRecord['[CROP]'];
      recordData.commodityId = await resolveCommodity(cropStr);
    }

    // Extract zone
    if (rawRecord.zone || rawRecord['[ZONE]']) {
      recordData.zone = rawRecord.zone || rawRecord['[ZONE]'];
    }

    // Extract time information
    if (rawRecord.season) recordData.season = rawRecord.season;
    if (rawRecord.year) recordData.year = parseInt(rawRecord.year);
    if (rawRecord.monthYear || rawRecord['[MONTH/YEAR]']) {
      recordData.monthYear = rawRecord.monthYear || rawRecord['[MONTH/YEAR]'];
    }
    if (rawRecord.weekRange || rawRecord['[WEEK]']) {
      recordData.weekRange = rawRecord.weekRange || rawRecord['[WEEK]'];
    }

    // Extract dates
    if (rawRecord.startDate || rawRecord['[START DATE]']) {
      const startDateValue = rawRecord.startDate || rawRecord['[START DATE]'];
      recordData.startDate = parseExcelDate(startDateValue);
    }
    if (rawRecord.endDate || rawRecord['[END DATE]']) {
      const endDateValue = rawRecord.endDate || rawRecord['[END DATE]'];
      recordData.endDate = parseExcelDate(endDateValue);
    }

    // Content-type specific mapping
    switch (contentType) {
      case 'crop_calendar':
        recordData.plantingStart = rawRecord.plantingStart;
        recordData.plantingEnd = rawRecord.plantingEnd;
        recordData.harvestStart = rawRecord.harvestStart;
        recordData.harvestEnd = rawRecord.harvestEnd;
        recordData.variety = rawRecord.variety;
        recordData.notes = rawRecord.notes;
        break;

      case 'production_calendar':
        recordData.activity = rawRecord.activity;
        recordData.toolsRequired = rawRecord.tools;
        recordData.durationDays = rawRecord.duration ? parseInt(rawRecord.duration) : null;
        recordData.priority = rawRecord.priority;
        break;

      case 'agromet_advisory':
        recordData.weatherCondition = rawRecord.weatherCondition;
        recordData.temperatureRange = rawRecord.temperature;
        recordData.rainfallInfo = rawRecord.rainfall;
        recordData.humidityInfo = rawRecord.humidity;
        recordData.advisoryText = rawRecord.advisory;
        recordData.priority = rawRecord.priority;
        break;

      case 'commodity_advisory':
        // Resolve production stage
        if (rawRecord.stage) {
          recordData.productionStageId = await resolveProductionStage(rawRecord.stage);
          recordData.productionStageName = rawRecord.stage;
        }
        recordData.activityDescription = rawRecord.activity || rawRecord.description;
        break;

      case 'poultry_calendar':
        recordData.activity = rawRecord.activity;
        recordData.priority = rawRecord.priority;
        recordData.notes = rawRecord.notes;
        break;
    }

    return recordData;
  } catch (error) {
    console.error('Record mapping error:', error);
    throw new Error(`Failed to map record: ${error.message}`);
  }
};

// Helper function to parse Excel date values
const parseExcelDate = (dateValue) => {
  if (!dateValue) return null;
  
  // If it's already a valid date string, return it
  if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateValue;
  }
  
  // If it's an Excel serial number
  if (typeof dateValue === 'number' && dateValue > 25568) { // Excel epoch starts at Jan 1, 1900
    const excelEpoch = new Date(1900, 0, 1);
    const jsDate = new Date(excelEpoch.getTime() + (dateValue - 2) * 24 * 60 * 60 * 1000);
    return jsDate.toISOString().split('T')[0];
  }
  
  // Try to parse as a regular date
  try {
    const parsed = new Date(dateValue);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  } catch (e) {
    // Ignore parsing errors
  }
  
  return null;
};

// Handle batch file upload (multiple files)
const handleBatchFileUpload = async (req, res) => {
  let processedFiles = [];
  let failedFiles = [];
  
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No files uploaded"
      });
    }

    const userId = req.user.id;
    const uploadResults = [];

    console.log(`📁 Processing batch upload: ${req.files.length} files`);

    // Process each file
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const { originalname, filename, path: filePath, size, mimetype } = file;
      
      console.log(`  📄 Processing file ${i + 1}/${req.files.length}: ${originalname}`);

      let fileRecord = null;
      try {
        // Create file record in database
        fileRecord = await File.create({
          userId,
          originalName: originalname,
          storedFilename: filename,
          filePath,
          fileSize: size,
          mimeType: mimetype
        });

        // Check if this is an agricultural data file
        const isAgriculturalFile = (
          mimetype.includes('csv') ||
          mimetype.includes('sheet') ||
          originalname.toLowerCase().includes('calendar') ||
          originalname.toLowerCase().includes('advisory') ||
          originalname.toLowerCase().includes('agromet')
        );

        let agriculturalData = null;

        if (isAgriculturalFile) {
          try {
            // Mark file as processing
            await fileRecord.markAsProcessing(`Processing file ${i + 1}/${req.files.length}...`);

            // Determine file type for parser
            const fileType = mimetype.includes('csv') ? 'csv' : 'excel';
            
            // Parse agricultural data
            const parseResult = await agriculturalDataParser.parseFile(filePath, fileType, originalname);
            
            if (parseResult && parseResult.data && parseResult.data.length > 0) {
              // Process and store agricultural records
              const records = [];
              for (const rawRecord of parseResult.data) {
                try {
                  const recordData = await mapRawRecordToDatabase(rawRecord, parseResult.contentType, fileRecord.id, userId);
                  records.push(recordData);
                } catch (mappingError) {
                  console.warn(`    ⚠️ Skipping record due to mapping error: ${mappingError.message}`);
                }
              }

              if (records.length > 0) {
                // Validate records before creation (batch upload)
                console.log(`    🔍 Validating ${records.length} records for ${originalname}...`);
                const validationResults = await dataValidationEngine.validateBatch(records, parseResult.contentType);
                
                // Filter valid records
                const validRecords = records.filter((_, index) => validationResults.results[index].isValid);
                const invalidRecords = records.filter((_, index) => !validationResults.results[index].isValid);
                
                console.log(`    📊 Validation: ${validRecords.length} valid, ${invalidRecords.length} invalid`);
                
                // Create valid records in batch
                let createdRecords = [];
                if (validRecords.length > 0) {
                  createdRecords = await AgriculturalRecord.createBatch(validRecords);
                }
                
                await fileRecord.markAsProcessed(
                  parseResult.contentType,
                  {
                    ...parseResult.metadata,
                    recordsCreated: createdRecords.length,
                    recordsSkipped: parseResult.data.length - createdRecords.length,
                    validationResults: {
                      totalValidated: validationResults.summary.total,
                      validRecords: validationResults.summary.valid,
                      invalidRecords: validationResults.summary.invalid,
                      averageScore: validationResults.summary.averageScore
                    }
                  },
                  `Successfully processed ${createdRecords.length} valid records (${invalidRecords.length} skipped)`
                );

                agriculturalData = {
                  contentType: parseResult.contentType,
                  recordCount: createdRecords.length,
                  metadata: parseResult.metadata
                };
              } else {
                await fileRecord.markAsFailed('No valid records could be processed from the file');
              }
            } else {
              await fileRecord.markAsFailed('No agricultural data found in file');
            }
          } catch (parseError) {
            console.error(`    ❌ Processing error for ${originalname}:`, parseError.message);
            await fileRecord.markAsFailed(`Processing failed: ${parseError.message}`);
          }
        }

        const uploadResult = {
          success: true,
          file: {
            id: fileRecord.id,
            originalName: fileRecord.originalName,
            size: fileRecord.fileSize,
            mimeType: fileRecord.mimeType,
            status: fileRecord.status,
            uploadedAt: fileRecord.uploadedAt,
            processed: fileRecord.status === 'processed',
            agriculturalData
          }
        };

        uploadResults.push(uploadResult);
        processedFiles.push(originalname);

        console.log(`    ✅ Successfully processed: ${originalname}`);

      } catch (fileError) {
        console.error(`    ❌ Error processing ${originalname}:`, fileError.message);
        
        // Clean up physical file
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (cleanupError) {
            console.error('    File cleanup error:', cleanupError.message);
          }
        }

        // Mark file as failed if record exists
        if (fileRecord) {
          try {
            await fileRecord.markAsFailed(fileError.message);
          } catch (updateError) {
            console.error('    Error updating file status:', updateError.message);
          }
        }

        const errorResult = {
          success: false,
          file: {
            originalName: originalname,
            size: size,
            error: fileError.message
          }
        };

        uploadResults.push(errorResult);
        failedFiles.push(originalname);
      }
    }

    // Get updated user statistics
    const userStats = await req.user.getStatistics();

    const successCount = processedFiles.length;
    const failureCount = failedFiles.length;

    console.log(`📊 Batch upload completed: ${successCount} succeeded, ${failureCount} failed`);

    res.json({
      success: true,
      message: `Batch upload completed: ${successCount} files processed successfully${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
      summary: {
        totalFiles: req.files.length,
        successful: successCount,
        failed: failureCount,
        processedFiles,
        failedFiles
      },
      results: uploadResults,
      userStats
    });

  } catch (error) {
    console.error('❌ Batch file upload error:', error);
    
    // Clean up any uploaded files on general failure
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          try {
            fs.unlinkSync(file.path);
          } catch (cleanupError) {
            console.error('File cleanup error:', cleanupError.message);
          }
        }
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || "Batch file upload failed",
      summary: {
        totalFiles: req.files ? req.files.length : 0,
        successful: processedFiles.length,
        failed: failedFiles.length,
        processedFiles,
        failedFiles
      }
    });
  }
};

// Multiple upload endpoints for compatibility (single file)
app.post("/user/files/upload", authenticateToken, upload.single('file'), handleFileUpload);
app.post("/files/upload", authenticateToken, upload.single('file'), handleFileUpload);
app.post("/upload", authenticateToken, upload.single('file'), handleFileUpload);

// Batch file upload endpoints (multiple files)
app.post("/user/files/upload-batch", authenticateToken, upload.array('files', 10), handleBatchFileUpload);
app.post("/files/upload-batch", authenticateToken, upload.array('files', 10), handleBatchFileUpload);
app.post("/upload-batch", authenticateToken, upload.array('files', 10), handleBatchFileUpload);

// Get user files
app.get("/user/files", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, contentType, search } = req.query;
    
    const result = await req.user.getFiles({
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      contentType,
      search
    });

    res.json({
      success: true,
      files: result
    });
  } catch (error) {
    console.error('Get user files error:', error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get files"
    });
  }
});

// Delete user file
app.delete("/user/files/:fileId", authenticateToken, async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({
        success: false,
        error: "File not found"
      });
    }

    // Check ownership
    if (file.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: "Access denied"
      });
    }

    await file.delete();

    res.json({
      success: true,
      message: "File deleted successfully"
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to delete file"
    });
  }
});

// =============================================================================
// AGRICULTURAL DATA API ENDPOINTS
// =============================================================================

// Get crop calendar data
app.get("/api/crop-calendar", async (req, res) => {
  try {
    const { district, crop, season, year, page = 1, limit = 50 } = req.query;
    
    const result = await AgriculturalRecord.getCropCalendar({
      district,
      commodity: crop,
      season,
      year: year ? parseInt(year) : null,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: result.records,
      total: result.pagination.totalCount,
      filters: { district, crop, season, year }
    });
  } catch (error) {
    console.error('Get crop calendar error:', error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get crop calendar data"
    });
  }
});

// Get production calendar data
app.get("/api/production-calendar", async (req, res) => {
  try {
    const { district, month, crop, activity, page = 1, limit = 50 } = req.query;
    
    const result = await AgriculturalRecord.getProductionCalendar({
      district,
      monthYear: month,
      commodity: crop,
      activity,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: result.records,
      total: result.pagination.totalCount,
      filters: { district, month, crop, activity }
    });
  } catch (error) {
    console.error('Get production calendar error:', error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get production calendar data"
    });
  }
});

// Get agromet advisory data
app.get("/api/agromet-advisory", async (req, res) => {
  try {
    const { district, crop, category, priority, date_from, date_to, page = 1, limit = 50 } = req.query;
    
    const result = await AgriculturalRecord.getAgrometAdvisory({
      district,
      commodity: crop,
      priority,
      startDate: date_from,
      endDate: date_to,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: result.records,
      total: result.pagination.totalCount,
      filters: { district, crop, category, priority, date_from, date_to }
    });
  } catch (error) {
    console.error('Get agromet advisory error:', error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get agromet advisory data"
    });
  }
});

// Get poultry calendar data
app.get("/api/poultry-calendar", async (req, res) => {
  try {
    const { district, poultryType, activity, season, year, page = 1, limit = 50 } = req.query;
    
    const result = await AgriculturalRecord.getPoultryCalendar({
      district,
      commodity: poultryType,
      activity,
      season,
      year: year ? parseInt(year) : null,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: result.records,
      total: result.pagination.totalCount,
      filters: { district, poultryType, activity, season, year }
    });
  } catch (error) {
    console.error('Get poultry calendar error:', error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get poultry calendar data"
    });
  }
});

// Get commodity advisory data
app.get("/api/commodity-advisory", async (req, res) => {
  try {
    const { district, crop, stage, commodityCode, region, zone, week, page = 1, limit = 50 } = req.query;
    
    const result = await AgriculturalRecord.getCommodityAdvisory({
      district,
      commodity: crop,
      activity: stage,
      region,
      zone,
      weekRange: week,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: result.records,
      total: result.pagination.totalCount,
      filters: { district, crop, stage, commodityCode, region, zone, week }
    });
  } catch (error) {
    console.error('Get commodity advisory error:', error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get commodity advisory data"
    });
  }
});

// Get available filter values
app.get("/api/districts", async (req, res) => {
  try {
    const districts = await AgriculturalRecord.getFilterValues('districts');
    res.json({
      success: true,
      data: districts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get districts"
    });
  }
});

app.get("/api/crops", async (req, res) => {
  try {
    const crops = await AgriculturalRecord.getFilterValues('commodities');
    res.json({
      success: true,
      data: crops
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get crops"
    });
  }
});

// Get statistics
app.get("/api/statistics", async (req, res) => {
  try {
    const stats = await AgriculturalRecord.getStatistics();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get statistics"
    });
  }
});

// =============================================================================
// ADMIN ENDPOINTS
// =============================================================================

// Get all users (admin only)
app.get("/admin/users", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    
    const result = await User.getAll({
      page: parseInt(page),
      limit: parseInt(limit),
      role,
      search
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get users"
    });
  }
});

// Get all files (admin only)
app.get("/admin/files", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, contentType, search } = req.query;
    
    const result = await File.findWithDetails({
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      contentType,
      search
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get files"
    });
  }
});

// =============================================================================
// REFERENCE DATA ENDPOINTS
// =============================================================================

// Get regions
app.get("/api/regions", async (req, res) => {
  try {
    const { search, zone } = req.query;
    const regions = await ReferenceData.getRegions({ search, zone });
    
    res.json({
      success: true,
      data: regions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get regions"
    });
  }
});

// Get districts
app.get("/api/districts-detailed", async (req, res) => {
  try {
    const { search, regionId, regionCode } = req.query;
    const districts = await ReferenceData.getDistricts({ search, regionId, regionCode });
    
    res.json({
      success: true,
      data: districts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get districts"
    });
  }
});

// Get commodities
app.get("/api/commodities", async (req, res) => {
  try {
    const { search, category } = req.query;
    const commodities = await ReferenceData.getCommodities({ search, category });
    
    res.json({
      success: true,
      data: commodities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get commodities"
    });
  }
});

// Global search across reference data
app.get("/api/search", async (req, res) => {
  try {
    const { q, limit = 50 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: "Search query must be at least 2 characters"
      });
    }

    const results = await ReferenceData.globalSearch(q.trim(), parseInt(limit));
    
    res.json({
      success: true,
      data: results,
      query: q.trim()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || "Search failed"
    });
  }
});

// =============================================================================
// ERROR HANDLING
// =============================================================================

// File upload error handling
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File size too large. Maximum size is 10MB.'
      });
    }
  }
  
  res.status(500).json({
    success: false,
    error: error.message || 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// =============================================================================
// SERVER STARTUP
// =============================================================================

const startServer = async () => {
  try {
    // Initialize database
    const dbReady = await initializeDatabase();
    
    if (!dbReady) {
      console.error('🔴 Cannot start server without database connection');
      process.exit(1);
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 TriAgro AI Auth Server v2 running on port ${PORT}`);
      console.log(`📊 Database: PostgreSQL`);
      console.log(`🔐 JWT Auth: Enabled`);
      console.log(`📁 File Upload: ${uploadsDir}`);
      console.log(`🌐 CORS: Enabled for local development`);
      console.log(`\n🎯 Endpoints:`);
      console.log(`   Authentication: POST /sign-in, POST /sign-up`);
      console.log(`   File Upload: POST /upload, /files/upload, /user/files/upload`);
      console.log(`   Agricultural Data: GET /api/crop-calendar, /api/production-calendar, etc.`);
      console.log(`   Admin: GET /admin/users, /admin/files`);
      console.log(`   Reference: GET /api/regions, /api/districts-detailed, /api/commodities`);
    });

  } catch (error) {
    console.error('🔴 Server startup failed:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  // Close database connections and cleanup
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Server terminated...');
  process.exit(0);
});

// Start the server
startServer();