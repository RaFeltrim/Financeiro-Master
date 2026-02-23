/**
 * Entry point for the Expense Tracking Application
 * Demonstrates the usage of the Expense entity and service
 */

const Expense = require('./src/models/Expense');
const ExpenseService = require('./src/services/expenseService');

console.log('=== Expense Tracking Application ===\n');

// Create an instance of the expense service
const expenseService = new ExpenseService();

// Example: Creating valid expenses
console.log('Creating sample expenses...\n');

try {
  // Create first expense
  const expense1 = expenseService.createExpense({
    value: 150.75,
    date: new Date(), // Today's date
    category: 'Alimentação',
    description: 'Compra de supermercado'
  });
  
  console.log(`✓ Created expense #${expense1.id}: ${expense1.description} - R$ ${expense1.value.toFixed(2)}\n`);

  // Create second expense
  const expense2 = expenseService.createExpense({
    value: 45.30,
    date: new Date(Date.now() - 86400000), // Yesterday's date
    category: 'Transporte',
    description: 'Gasolina'
  });
  
  console.log(`✓ Created expense #${expense2.id}: ${expense2.description} - R$ ${expense2.value.toFixed(2)}\n`);

  // Create third expense
  const expense3 = expenseService.createExpense({
    value: 120.00,
    date: '2026-02-20', // Past date as string
    category: 'Lazer',
    description: 'Cinema'
  });
  
  console.log(`✓ Created expense #${expense3.id}: ${expense3.description} - R$ ${expense3.value.toFixed(2)}\n`);

  // Display all expenses
  console.log('All expenses:');
  const allExpenses = expenseService.getAllExpenses();
  allExpenses.forEach(expense => {
    console.log(`  #${expense.id}: R$ ${expense.value.toFixed(2)} | ${expense.category} | ${expense.description} | ${expense.date.toLocaleDateString()}`);
  });

  console.log(`\nTotal expenses: R$ ${expenseService.getTotalExpenses().toFixed(2)}\n`);

  // Example: Filter by category
  console.log('Expenses in "Alimentação" category:');
  const foodExpenses = expenseService.getExpensesByCategory('Alimentação');
  foodExpenses.forEach(expense => {
    console.log(`  #${expense.id}: R$ ${expense.value.toFixed(2)} | ${expense.description}`);
  });

  // Example: Update an expense
  console.log('\nUpdating expense #1...');
  const updatedExpense = expenseService.updateExpense(expense1.id, {
    value: 165.80,
    description: 'Compra de supermercado - mês atual'
  });
  
  console.log(`✓ Updated expense #${updatedExpense.id}: ${updatedExpense.description} - R$ ${updatedExpense.value.toFixed(2)}`);

  console.log(`\nNew total expenses after update: R$ ${expenseService.getTotalExpenses().toFixed(2)}\n`);

} catch (error) {
  console.error('Error in application:', error.message);
}

// Example: Handling invalid expenses
console.log('Testing validation with invalid data...\n');

try {
  // Attempt to create an invalid expense (negative value)
  expenseService.createExpense({
    value: -50,
    date: new Date(),
    category: 'Teste'
  });
} catch (error) {
  console.log(`✓ Correctly caught validation error: ${error.message}\n`);
}

try {
  // Attempt to create an invalid expense (future date)
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 5);
  
  expenseService.createExpense({
    value: 100,
    date: futureDate,
    category: 'Teste'
  });
} catch (error) {
  console.log(`✓ Correctly caught validation error: ${error.message}\n`);
}

// Example: Excel Integration
console.log('=== Excel Integration Demo ===\n');

try {
  const ExcelController = require('./src/controllers/excelController');
  const excelController = new ExcelController(expenseService);
  
  // List Excel files in the current directory
  const excelFilesResult = excelController.listExcelFiles('../..'); // Looking in Downloads folder
  if (excelFilesResult.success) {
    console.log(`Found ${excelFilesResult.count} Excel files in directory:`);
    excelFilesResult.data.forEach(file => {
      console.log(`  - ${file}`);
    });
    
    // If we find the specific files mentioned, demonstrate import
    const targetFiles = excelFilesResult.data.filter(file => 
      file.includes('Caixinha') || file.includes('Mercado_2p_final')
    );
    
    if (targetFiles.length > 0) {
      console.log('\nDemonstrating import from found Excel files:');
      
      for (const file of targetFiles) {
        console.log(`\nAttempting to import from: ${file}`);
        
        // Note: In a real scenario, we would actually import the files
        // For demo purposes, we'll just show the file was found
        console.log(`Would import expenses from: ${file.split('\\').pop()}`);
      }
    } else {
      console.log('\nNote: The specific Excel files (Caixinha.xlsx, Mercado_2p_final.xlsx) were not found in the scanned directory.');
      console.log('In a real implementation, you would specify the exact path to these files for import.');
    }
  } else {
    console.log('Could not list Excel files:', excelFilesResult.message);
  }
} catch (error) {
  console.log('Excel functionality error (this is expected if files are not accessible):', error.message);
}

console.log('\n=== Application execution completed ===');