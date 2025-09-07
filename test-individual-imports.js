console.log('🧪 Testing individual imports...');

try {
  console.log('1️⃣ Testing agriculturalDataParserV2...');
  import('./services/agriculturalDataParserV2.js')
    .then((module) => {
      console.log('✅ agriculturalDataParserV2 imported successfully');
      console.log('   Default export type:', typeof module.default);
      
      console.log('2️⃣ Testing dataValidationEngine...');
      return import('./services/dataValidationEngine.js');
    })
    .then((module) => {
      console.log('✅ dataValidationEngine imported successfully');
      console.log('   Default export type:', typeof module.default);
      
      console.log('🎉 All service imports successful!');
    })
    .catch((error) => {
      console.error('❌ Service import failed:', error.message);
      console.error('Stack:', error.stack);
    });
} catch (error) {
  console.error('❌ Immediate error:', error.message);
}