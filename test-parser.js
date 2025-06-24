import agriculturalDataParser from './services/agriculturalDataParser.js';

async function testParser() {
  try {
    console.log('🧪 Testing parser with BIAKOYE RICE ADVISORY.xlsx...');
    
    const result = await agriculturalDataParser.parseFile(
      './BIAKOYE RICE ADVISORY.xlsx',
      'excel',
      'BIAKOYE RICE ADVISORY.xlsx'
    );
    
    console.log('✅ Parser result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Parser error:', error);
  }
}

testParser();