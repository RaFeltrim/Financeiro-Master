const Expense = require('../src/models/Expense');
const ExpenseService = require('../src/services/expenseService');
const ExpenseValidator = require('../src/utils/expenseValidator');

console.log('=== Expense Entity Validation Tests ===\n');

// Test the Expense entity directly
console.log('1. Testing successful expense creation:');
try {
  const expense = new Expense(
    100.50,                    // value > 0
    new Date(),               // today's date (valid)
    'Alimentação',            // category
    'Compra de supermercado'  // description (optional)
  );
  console.log('✓ Expense created successfully:', expense.toJSON());
} catch (error) {
  console.log('✗ Error creating expense:', error.message);
}

console.log('\n2. Testing validation failures (expected errors):');

// Test case 1: Zero value
console.log('- Testing zero value (should fail):');
try {
  const invalidExpense1 = new Expense(
    0,                        // zero value (invalid)
    new Date(),               // valid date
    'Alimentação'             // valid category
  );
  console.log('✗ Expense with zero value was incorrectly accepted');
} catch (error) {
  console.log('✓ Correctly rejected zero value:', error.message);
}

// Test case 2: Negative value
console.log('- Testing negative value (should fail):');
try {
  const invalidExpense2 = new Expense(
    -50,                      // negative value (invalid)
    new Date(),               // valid date
    'Alimentação'             // valid category
  );
  console.log('✗ Expense with negative value was incorrectly accepted');
} catch (error) {
  console.log('✓ Correctly rejected negative value:', error.message);
}

// Test case 3: Future date
console.log('- Testing future date (should fail):');
try {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1); // Tomorrow's date
  
  const invalidExpense3 = new Expense(
    100,                      // valid value
    tomorrow,                 // future date (invalid)
    'Alimentação'             // valid category
  );
  console.log('✗ Expense with future date was incorrectly accepted');
} catch (error) {
  console.log('✓ Correctly rejected future date:', error.message);
}

// Test case 4: Missing category
console.log('- Testing missing category (should fail):');
try {
  const invalidExpense4 = new Expense(
    100,                      // valid value
    new Date(),               // valid date
    ''                        // empty category (invalid)
  );
  console.log('✗ Expense with empty category was incorrectly accepted');
} catch (error) {
  console.log('✓ Correctly rejected empty category:', error.message);
}

// Test case 5: Missing date
console.log('- Testing missing date (should fail):');
try {
  const invalidExpense5 = new Expense(
    100,                      // valid value
    null,                     // missing date (invalid)
    'Alimentação'             // valid category
  );
  console.log('✗ Expense with missing date was incorrectly accepted');
} catch (error) {
  console.log('✓ Correctly rejected missing date:', error.message);
}

console.log('\n3. Testing Expense Service:');

// Test the service layer
const expenseService = new ExpenseService();

// Valid expense creation via service
console.log('- Creating expense via service:');
try {
  const serviceExpense = expenseService.createExpense({
    value: 75.25,
    date: new Date(),
    category: 'Transporte',
    description: 'Uber para o trabalho'
  });
  console.log('✓ Expense created via service:', serviceExpense.toJSON());
} catch (error) {
  console.log('✗ Error creating expense via service:', error.message);
}

// Invalid expense creation via service (negative value)
console.log('- Testing invalid expense creation via service (negative value):');
try {
  const invalidServiceExpense = expenseService.createExpense({
    value: -20,
    date: new Date(),
    category: 'Lazer',
    description: 'Cinema'
  });
  console.log('✗ Invalid expense was incorrectly accepted by service');
} catch (error) {
  console.log('✓ Service correctly rejected invalid expense:', error.message);
}

// Invalid expense creation via service (future date)
console.log('- Testing invalid expense creation via service (future date):');
try {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 2);
  
  const invalidServiceExpense2 = expenseService.createExpense({
    value: 50,
    date: futureDate,
    category: 'Lazer',
    description: 'Show'
  });
  console.log('✗ Invalid expense with future date was incorrectly accepted by service');
} catch (error) {
  console.log('✓ Service correctly rejected expense with future date:', error.message);
}

console.log('\n4. Testing Expense Validator directly:');

// Test the validator directly
console.log('- Testing validator with valid data:');
try {
  ExpenseValidator.validateAll({
    value: 100,
    date: new Date(),
    category: 'Saúde',
    description: 'Consulta médica'
  });
  console.log('✓ Validator accepted valid data');
} catch (error) {
  console.log('✗ Validator rejected valid data:', error.message);
}

console.log('- Testing validator with invalid value:');
try {
  ExpenseValidator.validateAll({
    value: -10,
    date: new Date(),
    category: 'Saúde'
  });
  console.log('✗ Validator accepted invalid value');
} catch (error) {
  console.log('✓ Validator rejected invalid value:', error.message);
}

console.log('\n=== All Tests Completed ===');