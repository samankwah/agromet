import XLSX from 'xlsx';

try {
  const workbook = XLSX.readFile('./Codes.xlsx');
  
  console.log('📊 Excel File Analysis: Codes.xlsx');
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
      
      // Show first 5 data rows
      if (data.length > 1) {
        console.log('\nFirst 5 Data Rows:');
        for (let i = 1; i <= Math.min(5, data.length - 1); i++) {
          console.log(`Row ${i + 1}:`, data[i]);
        }
      }
    }
    
    // Convert to JSON format for analysis
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    if (jsonData.length > 0) {
      console.log('\nJSON Structure (First 3 Records):');
      jsonData.slice(0, 3).forEach((record, index) => {
        console.log(`Record ${index + 1}:`, JSON.stringify(record, null, 2));
      });
    }
  });
  
} catch (error) {
  console.error('Error reading Excel file:', error);
}