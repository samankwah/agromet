import agriculturalDataParser from './services/agriculturalDataParser.js';

async function simpleTest() {
  try {
    console.log('🧪 Testing BIAKOYE RICE ADVISORY upload and parsing...');
    
    const result = await agriculturalDataParser.parseFile(
      './BIAKOYE RICE ADVISORY.xlsx',
      'excel',
      'BIAKOYE RICE ADVISORY.xlsx'
    );
    
    console.log(`✅ Successfully parsed ${result.data.length} records of type: ${result.contentType}`);
    
    // Filter for records specific to Biakoye district and rice
    const biakoyeRiceRecords = result.data.filter(record => 
      record.district && record.district.toLowerCase().includes('biakoye') &&
      record.crop && record.crop.toLowerCase() === 'rice' &&
      record.commodityCode === 'CT0000000008'
    );
    
    console.log(`🌾 Found ${biakoyeRiceRecords.length} records for Biakoye rice (CT0000000008)`);
    
    // Show production stages
    const stages = [...new Set(biakoyeRiceRecords.map(r => r.stage))];
    console.log('📋 Production Stages Found:');
    stages.forEach((stage, index) => {
      const stageRecords = biakoyeRiceRecords.filter(r => r.stage === stage);
      const weekRange = stageRecords.length > 0 ? `Week ${stageRecords[0].startWeek}-${stageRecords[0].endWeek}` : '';
      console.log(`  ${index + 1}. ${stage} ${weekRange}`);
    });
    
    console.log('\n🎯 Sample Records:');
    biakoyeRiceRecords.slice(0, 3).forEach((record, index) => {
      console.log(`${index + 1}. ${record.stage} (Week ${record.startWeek}-${record.endWeek}) in ${record.district}, ${record.region}`);
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

simpleTest();