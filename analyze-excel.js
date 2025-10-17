import XLSX from 'xlsx';
import fs from 'fs';

const filePath = 'c:\\Users\\CRAFT\\Documents\\All folders\\seasonal fcst\\FSRP_2025\\Central & Western Region\\Western\\Maize exceltemplate.xlsx';

console.log('📊 ANALYZING EXCEL FILE: Maize exceltemplate.xlsx\n');
console.log('='.repeat(80));

try {
  // Read workbook with cell styles
  const workbook = XLSX.readFile(filePath, {
    cellStyles: true,
    sheetStubs: true,
    raw: false
  });

  console.log(`\n📁 WORKBOOK OVERVIEW`);
  console.log(`   Total Sheets: ${workbook.SheetNames.length}`);
  console.log(`   Sheet Names: ${workbook.SheetNames.join(', ')}`);
  console.log('='.repeat(80));

  // Analyze each worksheet
  workbook.SheetNames.forEach((sheetName, sheetIndex) => {
    console.log(`\n📄 SHEET ${sheetIndex + 1}: "${sheetName}"`);
    console.log('-'.repeat(80));

    const worksheet = workbook.Sheets[sheetName];

    // Get sheet range
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    const numRows = range.e.r + 1;
    const numCols = range.e.c + 1;

    console.log(`   📐 Dimensions: ${numRows} rows × ${numCols} columns`);
    console.log(`   📍 Range: ${worksheet['!ref']}`);

    // Convert to array format
    const data = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      raw: false
    });

    // Find headers
    console.log(`\n   🔍 STRUCTURE ANALYSIS:`);

    let headerRow = -1;
    let activityCol = -1;
    let monthCols = [];
    let weekCols = [];

    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

    // Scan first 10 rows for headers
    for (let rowIndex = 0; rowIndex < Math.min(10, data.length); rowIndex++) {
      const row = data[rowIndex];
      if (!Array.isArray(row)) continue;

      row.forEach((cell, colIndex) => {
        if (!cell) return;
        const cellStr = String(cell).toLowerCase().trim();

        // Find activity column
        if (cellStr.includes('activity') || cellStr.includes('stage')) {
          activityCol = colIndex;
          headerRow = rowIndex;
        }

        // Find month columns
        if (months.some(month => cellStr === month || cellStr === month.toUpperCase())) {
          monthCols.push({ col: colIndex, month: cellStr.toUpperCase(), row: rowIndex });
        }

        // Find week columns
        if (cellStr.includes('week') || cellStr.includes('wk')) {
          weekCols.push({ col: colIndex, label: cell, row: rowIndex });
        }
      });
    }

    if (headerRow !== -1) {
      console.log(`   ✅ Header Row: ${headerRow + 1}`);
    }
    if (activityCol !== -1) {
      console.log(`   ✅ Activity Column: ${String.fromCharCode(65 + activityCol)} (index ${activityCol})`);
    }
    if (monthCols.length > 0) {
      console.log(`   ✅ Month Columns: ${monthCols.length} found - ${monthCols.map(m => m.month).join(', ')}`);
    }
    if (weekCols.length > 0) {
      console.log(`   ✅ Week Columns: ${weekCols.length} found`);
    }

    // Display first 10 rows
    console.log(`\n   📋 FIRST 10 ROWS:`);
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      const rowPreview = row.slice(0, 10).map(cell => {
        const str = String(cell || '').trim();
        return str.length > 15 ? str.substring(0, 12) + '...' : str;
      });

      console.log(`   Row ${String(i + 1).padStart(2)}: [${rowPreview.join(' | ')}]`);
    }

    // Analyze cell colors in activity rows
    console.log(`\n   🎨 COLOR ANALYSIS:`);
    let coloredCells = 0;
    let colorPalette = new Set();
    let activityColors = [];

    if (activityCol !== -1 && headerRow !== -1) {
      // Check rows after header for colors
      for (let rowIndex = headerRow + 1; rowIndex < Math.min(headerRow + 15, numRows); rowIndex++) {
        const activityCellRef = XLSX.utils.encode_cell({ r: rowIndex, c: activityCol });
        const activityCell = worksheet[activityCellRef];

        if (activityCell && activityCell.v) {
          const activityName = String(activityCell.v).trim();

          // Check for colors in this row
          let rowColors = [];
          for (let colIndex = activityCol + 1; colIndex < Math.min(numCols, activityCol + 20); colIndex++) {
            const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
            const cell = worksheet[cellRef];

            if (cell && cell.s && cell.s.fill) {
              const bgColor = cell.s.fill.bgColor;
              const fgColor = cell.s.fill.fgColor;

              let color = null;
              if (bgColor && bgColor.rgb) {
                color = bgColor.rgb.length === 8 ? bgColor.rgb.substring(2) : bgColor.rgb;
                color = '#' + color.toUpperCase();
              } else if (bgColor && bgColor.indexed !== undefined) {
                color = `Indexed:${bgColor.indexed}`;
              } else if (fgColor && fgColor.rgb) {
                color = fgColor.rgb.length === 8 ? fgColor.rgb.substring(2) : fgColor.rgb;
                color = '#' + color.toUpperCase();
              }

              if (color && color !== '#FFFFFF') {
                coloredCells++;
                colorPalette.add(color);
                rowColors.push({ col: colIndex, color });
              }
            }
          }

          if (rowColors.length > 0) {
            const uniqueColors = [...new Set(rowColors.map(c => c.color))];
            activityColors.push({
              row: rowIndex + 1,
              activity: activityName,
              colorCount: rowColors.length,
              colors: uniqueColors
            });
          }
        }
      }
    }

    console.log(`   📊 Colored Cells: ${coloredCells}`);
    console.log(`   🌈 Unique Colors: ${colorPalette.size}`);
    if (colorPalette.size > 0) {
      console.log(`   🎨 Color Palette: ${Array.from(colorPalette).slice(0, 10).join(', ')}`);
    }

    if (activityColors.length > 0) {
      console.log(`\n   🎯 ACTIVITIES WITH COLORS:`);
      activityColors.forEach(ac => {
        console.log(`      Row ${ac.row}: "${ac.activity}" - ${ac.colorCount} cells, Colors: ${ac.colors.join(', ')}`);
      });
    }

    console.log('='.repeat(80));
  });

  console.log(`\n✅ Analysis Complete!\n`);

} catch (error) {
  console.error('❌ Error analyzing Excel file:', error);
  console.error(error.stack);
}
