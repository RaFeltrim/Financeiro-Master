/**
 * Demo: Excel Integration for Expense Tracking
 * This script demonstrates how to import data from Caixinha.xlsx and Mercado_2p_final.xlsx
 */

const ExpenseService = require('./src/services/expenseService');
const ExcelController = require('./src/controllers/excelController');

async function runExcelIntegrationDemo() {
  console.log('=== Excel Integration Demo for Expense Tracking ===\n');

  // Create instances
  const expenseService = new ExpenseService();
  const excelController = new ExcelController(expenseService);

  // Define the paths to the Excel files
  const caixinhaPath = 'c:/Users/Rafael Feltrim/Downloads/controle-de-gastos-main/Caixinha.xlsx';
  const mercadoPath = 'c:/Users/Rafael Feltrim/Downloads/controle-de-gastos-main/Mercado_2p_final (1).xlsx';

  console.log('Attempting to import from Excel files...');

  // Import from Caixinha.xlsx
  console.log(`\n1. Importing from Caixinha.xlsx...`);
  try {
    const caixinhaResult = await excelController.importExpensesFromExcel(caixinhaPath);
    console.log(`   Result: ${caixinhaResult.message}`);

    if (!caixinhaResult.success) {
      console.log(`   Error: ${caixinhaResult.error}`);
    }
  } catch (error) {
    console.log(`   Error importing Caixinha.xlsx: ${error.message}`);
    console.log('   Note: This is expected if the file path is not accessible from this environment.');
  }

  // Import from Mercado_2p_final.xlsx
  console.log(`\n2. Importing from Mercado_2p_final (1).xlsx...`);
  try {
    const mercadoResult = await excelController.importExpensesFromExcel(mercadoPath);
    console.log(`   Result: ${mercadoResult.message}`);

    if (!mercadoResult.success) {
      console.log(`   Error: ${mercadoResult.error}`);
    }
  } catch (error) {
    console.log(`   Error importing Mercado_2p_final (1).xlsx: ${error.message}`);
    console.log('   Note: This is expected if the file path is not accessible from this environment.');
  }

  // Show current statistics after attempted imports
  console.log('\n3. Current expense statistics:');
  try {
    const statsResult = await excelController.getExpenseStatistics();
    if (statsResult.success) {
      const stats = statsResult.data;
      console.log(`   Total Expenses: ${stats.totalExpenses}`);
      console.log(`   Total Value: R$ ${stats.totalValue.toFixed(2)}`);

      if (Object.keys(stats.byCategory).length > 0) {
        console.log('   By Category:');
        for (const [category, data] of Object.entries(stats.byCategory)) {
          console.log(`     - ${category}: ${data.count} items, R$ ${data.totalValue.toFixed(2)}`);
        }
      }

      if (stats.totalExpenses > 0) {
        console.log('\n   Sample of current expenses:');
        const allExpenses = await excelController.getAllExpenses();
        if (allExpenses.success) {
          const sample = allExpenses.data.slice(0, 5); // Show first 5 expenses
          sample.forEach(expense => {
            console.log(`     #${expense.id}: R$ ${expense.value.toFixed(2)} | ${expense.category} | ${expense.description} | ${expense.date.toLocaleDateString()}`);
          });

          if (allExpenses.data.length > 5) {
            console.log(`     ... and ${allExpenses.data.length - 5} more expenses`);
          }
        }
      }
    } else {
      console.log(`   Could not retrieve statistics: ${statsResult.message}`);
    }
  } catch (error) {
    console.log(`   Error getting statistics: ${error.message}`);
  }

  console.log('\n=== Excel Integration Demo Completed ===');
  console.log('\nNote: To run this with actual files, ensure:');
  console.log('1. The Excel files are accessible at the specified paths');
  console.log('2. The files contain columns for value/amount, date, and category');
  console.log('3. Column names may vary (e.g., "valor", "data", "categoria", "value", "date", "category")');
  console.log('4. The system will automatically map common column names to expense properties');
}

// Run the demo
if (require.main === module) {
  runExcelIntegrationDemo().catch(console.error);
}

module.exports = { runExcelIntegrationDemo };