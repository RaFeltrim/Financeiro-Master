/**
 * Script to analyze the structure of Excel files to understand their column names
 * This will help us improve the mapping logic for the specific files
 */

const XLSX = require('xlsx');

function analyzeExcelStructure(filePath) {
  try {
    console.log(`Analyzing Excel file: ${filePath}`);
    
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // Use the first sheet
    const worksheet = workbook.Sheets[sheetName];
    
    // Get the range of the data
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    console.log(`Sheet name: ${sheetName}`);
    console.log(`Data range: ${worksheet['!ref']}`);
    
    // Get first few rows to understand structure
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: `A1:${range.e.c > 10 ? XLSX.utils.encode_col(range.e.c) : 'J'}${Math.min(10, range.e.r + 1)}` });
    
    if (jsonData.length > 0) {
      const headers = jsonData[0];
      console.log(`Headers found: ${JSON.stringify(headers)}`);
      
      // Show first few data rows
      for (let i = 1; i < Math.min(6, jsonData.length); i++) {
        console.log(`Row ${i}: ${JSON.stringify(jsonData[i])}`);
      }
    }
    
    // Also get data as objects to see how it maps
    const objectData = XLSX.utils.sheet_to_json(worksheet);
    if (objectData.length > 0) {
      console.log('\nFirst row as object:', JSON.stringify(objectData[0], null, 2));
      console.log('\nAvailable keys in first row:', Object.keys(objectData[0]));
    }
    
    return { headers: jsonData[0], sampleData: objectData.slice(0, 3), totalRows: objectData.length };
  } catch (error) {
    console.error(`Error analyzing Excel file ${filePath}:`, error.message);
    return null;
  }
}

// Analyze both Excel files
console.log('=== Analyzing Excel File Structures ===\n');

const caixinhaPath = 'c:/Users/Rafael Feltrim/Downloads/controle-de-gastos-main/Caixinha.xlsx';
const mercadoPath = 'c:/Users/Rafael Feltrim/Downloads/controle-de-gastos-main/Mercado_2p_final (1).xlsx';

console.log('1. Analyzing Caixinha.xlsx:');
const caixinhaAnalysis = analyzeExcelStructure(caixinhaPath);
console.log('');

console.log('2. Analyzing Mercado_2p_final.xlsx:');
const mercadoAnalysis = analyzeExcelStructure(mercadoPath);

console.log('\n=== Analysis Complete ===');