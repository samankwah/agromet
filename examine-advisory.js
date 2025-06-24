import XLSX from 'xlsx';
import fs from 'fs';

try {
  const workbook = XLSX.readFile('./BIAKOYE RICE ADVISORY.xlsx');
  
  console.log('📊 Excel File Analysis: BIAKOYE RICE ADVISORY.xlsx');
  console.log('='.repeat(50));
  
  console.log('📋 Sheet Names:');
  workbook.SheetNames.forEach((name, index) => {
    console.log(`  ${index + 1}. ${name}`);
  });
  
  console.log('\n' + '='.repeat(50));
  
  // Examine each sheet
  workbook.SheetNames.forEach((sheetName, index) => {
    console.log(`\n📑 Sheet ${index + 1}: "${sheetName}"`);
    console.log('-'.repeat(30));
    
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log(`Rows: ${data.length}`);
    
    if (data.length > 0) {
      console.log('Headers (Row 1):');
      console.log(data[0]);
      
      if (data.length > 1) {
        console.log('\nSample Data (Row 2):');
        console.log(data[1]);
      }
      
      if (data.length > 2) {
        console.log('\nSample Data (Row 3):');
        console.log(data[2]);
      }
    }
    
    // Convert to JSON format for analysis
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    if (jsonData.length > 0) {
      console.log('\nJSON Structure (First Record):');
      console.log(JSON.stringify(jsonData[0], null, 2));
    }
  });
  
} catch (error) {
  console.error('Error reading Excel file:', error);
}