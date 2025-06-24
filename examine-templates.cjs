const XLSX = require('xlsx');
const fs = require('fs');

function examineExcelFile(filePath) {
  console.log(`\n📊 EXAMINING: ${filePath}`);
  console.log('='.repeat(80));
  
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;
    
    console.log(`📋 Number of sheets: ${sheetNames.length}`);
    console.log(`📄 Sheet names: ${sheetNames.join(', ')}`);
    
    sheetNames.forEach((sheetName, index) => {
      console.log(`\n🏷️ SHEET ${index + 1}: "${sheetName}"`);
      console.log('-'.repeat(50));
      
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
      
      if (jsonData.length === 0) {
        console.log('   (Empty sheet)');
        return;
      }
      
      // Show headers (first row)
      console.log('📑 Headers:');
      if (jsonData[0]) {
        jsonData[0].forEach((header, i) => {
          if (header) console.log(`   ${i + 1}. ${header}`);
        });
      }
      
      // Show first few data rows
      console.log('\n📝 Sample Data:');
      for (let i = 0; i < Math.min(5, jsonData.length); i++) {
        const row = jsonData[i];
        if (row && row.some(cell => cell !== '')) {
          console.log(`   Row ${i + 1}: [${row.slice(0, 5).map(cell => cell || 'EMPTY').join(' | ')}]`);
        }
      }
      
      console.log(`\n📊 Total rows: ${jsonData.length}`);
    });
    
  } catch (error) {
    console.error(`❌ Error reading ${filePath}:`, error.message);
  }
}

// Examine all template files
console.log('🔍 EXAMINING AGRICULTURAL TEMPLATE FILES');
console.log('='.repeat(80));

examineExcelFile('./tomato_agrometerologicalforcast.xlsx');
examineExcelFile('./BIAKOYE CALENDAR FOR MAIZE.xlsx');
examineExcelFile('./BIAKOYE CALENDAR FOR RICE.xlsx');

console.log('\n✅ TEMPLATE EXAMINATION COMPLETE');