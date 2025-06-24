import XLSX from 'xlsx';

try {
  const workbook = XLSX.readFile('./Codes.xlsx');
  const worksheet = workbook.Sheets['Sheet1'];
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  console.log('🔍 Looking for Biakoye district and rice commodity codes...\n');
  
  // Find Biakoye district
  const biakoyeRecords = data.filter(record => 
    record.DISTRICT_NAME && record.DISTRICT_NAME.toLowerCase().includes('biakoye')
  );
  
  console.log('📍 Biakoye District Records:');
  biakoyeRecords.forEach(record => {
    console.log(`${record.REGION_CODE}/${record.REGION_NAME} -> ${record.DISTRICT_CODE}/${record.DISTRICT_NAME} -> ${record.C_CODE}/${record.C_NAME}`);
  });
  
  // Find rice commodity codes
  console.log('\n🌾 Rice Commodity Records:');
  const riceRecords = data.filter(record => 
    record.C_NAME && record.C_NAME.toLowerCase().includes('rice')
  );
  
  riceRecords.slice(0, 10).forEach(record => {
    console.log(`${record.C_CODE}/${record.C_NAME} in ${record.DISTRICT_NAME} (${record.REGION_NAME})`);
  });
  
  // Find Oti region codes
  console.log('\n🗺️ Oti Region Records:');
  const otiRecords = data.filter(record => 
    record.REGION_NAME && record.REGION_NAME.toLowerCase().includes('oti')
  );
  
  otiRecords.slice(0, 10).forEach(record => {
    console.log(`${record.REGION_CODE}/${record.REGION_NAME} -> ${record.DISTRICT_CODE}/${record.DISTRICT_NAME} -> ${record.C_CODE}/${record.C_NAME}`);
  });
  
  // Show commodity codes
  console.log('\n🏷️ Unique Commodity Codes:');
  const uniqueCommodities = [...new Set(data.map(record => `${record.C_CODE}|${record.C_NAME}`))];
  uniqueCommodities.slice(0, 15).forEach(combo => {
    const [code, name] = combo.split('|');
    console.log(`${code}: ${name}`);
  });
  
} catch (error) {
  console.error('Error reading Excel file:', error);
}