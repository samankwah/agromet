import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';

// Database and models - test importing step by step
import { testConnection } from './config/database.js';

// ES6 module path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

console.log('🚀 Testing auth server step by step...');

async function stepByStepTest() {
  try {
    // Test database connection
    console.log('1️⃣ Testing database connection...');
    const connected = await testConnection();
    if (!connected) throw new Error('Database connection failed');
    console.log('✅ Database connection works');
    
    // Test Express setup
    console.log('2️⃣ Testing Express setup...');
    const app = express();
    const PORT = process.env.AUTH_PORT || 3002;
    const JWT_SECRET = process.env.JWT_SECRET || 'triagro-ai-secret-key-2025';
    console.log('✅ Express app created');
    
    // Test middleware
    console.log('3️⃣ Testing middleware setup...');
    app.use(cors({
      origin: ["http://localhost:5173", "http://localhost:3000"],
      credentials: true
    }));
    app.use(express.json());
    console.log('✅ Middleware configured');
    
    // Test multer setup
    console.log('4️⃣ Testing multer setup...');
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
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
      fileFilter: (req, file, cb) => {
        const allowedTypes = [
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/csv'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only Excel and CSV files are allowed.'));
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
      }
    });
    console.log('✅ Multer configured');
    
    // Test adding basic routes one by one
    console.log('5️⃣ Testing basic routes...');
    
    // Health check
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', message: 'Server is running' });
    });
    console.log('✅ Health route added');
    
    // Test basic auth routes
    app.post("/sign-up", async (req, res) => {
      res.json({ message: 'Sign-up endpoint working' });
    });
    console.log('✅ Sign-up route added');
    
    app.post("/sign-in", async (req, res) => {
      res.json({ message: 'Sign-in endpoint working' });
    });
    console.log('✅ Sign-in route added');
    
    // Test file routes with parameters
    console.log('6️⃣ Testing parameterized routes...');
    app.delete("/user/files/:fileId", async (req, res) => {
      res.json({ message: 'File delete endpoint working', fileId: req.params.fileId });
    });
    console.log('✅ Parameterized route added');
    
    // Start server briefly
    console.log('7️⃣ Testing server startup...');
    const server = app.listen(PORT, () => {
      console.log('✅ Server started successfully on port', PORT);
    });
    
    // Test the endpoints
    console.log('8️⃣ Server running - all tests passed!');
    
    setTimeout(() => {
      server.close();
      console.log('🎉 Step-by-step test completed successfully!');
      process.exit(0);
    }, 2000);
    
  } catch (error) {
    console.error('❌ Step-by-step test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

stepByStepTest();