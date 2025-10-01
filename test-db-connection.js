import { testConnection, query } from './config/database.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Testing database connection...');

async function testDatabase() {
  try {
    // Test basic connection
    console.log('📡 Testing PostgreSQL connection...');
    const connected = await testConnection();
    
    if (connected) {
      console.log('✅ Database connection successful!');
      
      // Test a simple query
      const result = await query('SELECT version()');
      console.log('📊 PostgreSQL version:', result.rows[0].version);
      
      // Check if tables exist
      const tableCheck = await query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      
      console.log('📋 Existing tables:', tableCheck.rows.map(row => row.table_name));
      
      return true;
    } else {
      console.error('❌ Database connection failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Database test error:', error.message);
    console.error('Full error:', error);
    return false;
  }
}

testDatabase()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });