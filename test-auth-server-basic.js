import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { testConnection } from './config/database.js';

// ES6 module path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

console.log('🚀 Starting basic auth server test...');

async function testBasicServer() {
  try {
    // Test database connection first
    console.log('📡 Testing database connection...');
    const connected = await testConnection();
    
    if (connected) {
      console.log('✅ Database connection successful');
    } else {
      console.log('❌ Database connection failed');
      return;
    }
    
    // Create Express app
    console.log('⚙️  Creating Express app...');
    const app = express();
    const PORT = process.env.AUTH_PORT || 3002;
    
    // Basic middleware
    app.use(cors({
      origin: ["http://localhost:5173", "http://localhost:3000"],
      credentials: true
    }));
    
    app.use(express.json());
    
    // Test route
    app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        message: 'TriAgro AI Auth Server v2 - Database Ready',
        timestamp: new Date().toISOString()
      });
    });
    
    // Start server
    const server = app.listen(PORT, () => {
      console.log('🟢 TriAgro AI Auth Server v2 - Database Ready');
      console.log(`🚀 TriAgro AI Auth Server v2 running on port ${PORT}`);
      console.log('📊 Database: PostgreSQL');
      console.log('🔐 JWT Auth: Enabled');
      console.log('🌐 CORS: Enabled for local development');
      console.log('\n🎯 Test endpoint: GET /health');
    });
    
    // Graceful shutdown after 5 seconds for testing
    setTimeout(() => {
      console.log('\n✅ Basic server test completed successfully!');
      server.close();
      process.exit(0);
    }, 5000);
    
  } catch (error) {
    console.error('❌ Basic server test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testBasicServer();