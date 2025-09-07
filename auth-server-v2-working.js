import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { testConnection, query } from './config/database.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.AUTH_PORT || 3002;
const JWT_SECRET = process.env.JWT_SECRET || 'triagro-ai-secret-key-2025';

console.log('🚀 Starting TriAgro AI Auth Server v2...');

// Test database connection on startup
testConnection().then(connected => {
  if (connected) {
    console.log('🟢 Database connected successfully');
  } else {
    console.error('🔴 Database connection failed');
    process.exit(1);
  }
});

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'TriAgro AI Auth Server v2 - Database Ready',
    timestamp: new Date().toISOString(),
    database: 'PostgreSQL'
  });
});

// Test database endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await query('SELECT COUNT(*) as total_regions FROM regions');
    const regionCount = result.rows[0].total_regions;
    
    const result2 = await query('SELECT COUNT(*) as total_commodities FROM commodities');
    const commodityCount = result2.rows[0].total_commodities;
    
    res.json({
      status: 'success',
      database: 'connected',
      data: {
        regions: parseInt(regionCount),
        commodities: parseInt(commodityCount)
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database query failed',
      error: error.message
    });
  }
});

// Get regions endpoint
app.get('/api/regions', async (req, res) => {
  try {
    const result = await query('SELECT code, name, zone FROM regions ORDER BY name');
    res.json({
      status: 'success',
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch regions',
      error: error.message
    });
  }
});

// Get commodities endpoint  
app.get('/api/commodities', async (req, res) => {
  try {
    const result = await query('SELECT code, name, category FROM commodities ORDER BY category, name');
    res.json({
      status: 'success',
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch commodities',
      error: error.message
    });
  }
});

// Get districts endpoint
app.get('/api/districts-detailed', async (req, res) => {
  try {
    const result = await query(`
      SELECT d.code, d.name, d.capital, r.name as region_name, r.code as region_code
      FROM districts d
      JOIN regions r ON d.region_id = r.id
      ORDER BY r.name, d.name
    `);
    res.json({
      status: 'success',
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch districts',
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('🟢 TriAgro AI Auth Server v2 - Database Ready');
  console.log(`🚀 TriAgro AI Auth Server v2 running on port ${PORT}`);
  console.log('📊 Database: PostgreSQL');
  console.log('🔐 JWT Auth: Enabled');
  console.log('🌐 CORS: Enabled for local development');
  
  console.log('\n🎯 Available Endpoints:');
  console.log('   GET  /health - Health check');
  console.log('   GET  /api/test-db - Database connectivity test');
  console.log('   GET  /api/regions - Get all regions');
  console.log('   GET  /api/commodities - Get all commodities');
  console.log('   GET  /api/districts-detailed - Get all districts with region info');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  process.exit(0);
});