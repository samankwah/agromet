import { testConnection } from './config/database.js';

console.log('🧪 Testing model imports...');

async function testModels() {
  try {
    // Test database connection first
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }
    
    console.log('📋 Testing User model...');
    const User = await import('./models/User.js');
    console.log('✅ User model imported successfully');
    
    console.log('📋 Testing File model...');
    const File = await import('./models/File.js');
    console.log('✅ File model imported successfully');
    
    console.log('📋 Testing AgriculturalRecord model...');
    const AgriculturalRecord = await import('./models/AgriculturalRecord.js');
    console.log('✅ AgriculturalRecord model imported successfully');
    
    console.log('📋 Testing ReferenceData model...');
    const ReferenceData = await import('./models/ReferenceData.js');
    console.log('✅ ReferenceData model imported successfully');
    
    console.log('📋 Testing agriculturalDataParserV2 service...');
    const agriculturalDataParser = await import('./services/agriculturalDataParserV2.js');
    console.log('✅ agriculturalDataParserV2 service imported successfully');
    
    console.log('📋 Testing dataValidationEngine service...');
    const dataValidationEngine = await import('./services/dataValidationEngine.js');
    console.log('✅ dataValidationEngine service imported successfully');
    
    console.log('🎉 All models and services imported successfully!');
    
  } catch (error) {
    console.error('❌ Model test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testModels();