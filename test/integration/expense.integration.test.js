const assert = require('assert');
const ExpenseService = require('../../src/services/expenseService');
const Expense = require('../../src/models/Expense');
const ExpenseValidator = require('../../src/utils/expenseValidator');

function test(description, testFn) {
    try {
        testFn();
        console.log(`✓ ${description}`);
        return true;
    } catch (error) {
        console.log(`✗ ${description}: ${error.message}`);
        return false;
    }
}

function runTests() {
    console.log('\n=== Expense Integration Tests ===\n');
    
    let passed = 0;
    let total = 0;
    
    // Test full workflow: create, retrieve, update, delete
    total++;
    if (test('should complete full expense workflow', () => {
        const service = new ExpenseService();
        
        // Create expense
        const expenseData = {
            value: 100.50,
            date: new Date(),
            category: 'Alimentação',
            description: 'Compra de supermercado'
        };
        
        const createdExpense = service.createExpense(expenseData);
        assert.notStrictEqual(createdExpense, null);
        assert.strictEqual(createdExpense.value, 100.50);
        assert.strictEqual(createdExpense.category, 'Alimentação');
        
        // Retrieve expense
        const retrievedExpense = service.getExpenseById(createdExpense.id);
        assert.notStrictEqual(retrievedExpense, null);
        assert.strictEqual(retrievedExpense.id, createdExpense.id);
        
        // Update expense
        const updatedExpense = service.updateExpense(createdExpense.id, {
            value: 150.75,
            description: 'Compra atualizada'
        });
        assert.strictEqual(updatedExpense.value, 150.75);
        assert.strictEqual(updatedExpense.description, 'Compra atualizada');
        
        // Verify update persisted
        const verifiedExpense = service.getExpenseById(createdExpense.id);
        assert.strictEqual(verifiedExpense.value, 150.75);
        assert.strictEqual(verifiedExpense.description, 'Compra atualizada');
        
        // Delete expense
        const deleted = service.deleteExpense(createdExpense.id);
        assert.strictEqual(deleted, true);
        
        // Verify deletion
        const postDeleteExpense = service.getExpenseById(createdExpense.id);
        assert.strictEqual(postDeleteExpense, null);
    })) passed++;
    
    // Test validation integration
    total++;
    if (test('should validate data before creating expense', () => {
        const service = new ExpenseService();
        
        // Try to create invalid expense (negative value)
        assert.throws(() => {
            service.createExpense({
                value: -50,
                date: new Date(),
                category: 'Alimentação',
                description: 'Invalid expense'
            });
        }, /Expense value must be greater than zero/);
        
        // Verify no expense was created
        const allExpenses = service.getAllExpenses();
        assert.strictEqual(allExpenses.length, 0);
    })) passed++;
    
    // Test multiple expenses workflow
    total++;
    if (test('should handle multiple expenses correctly', () => {
        const service = new ExpenseService();
        
        // Create multiple expenses
        const expense1 = service.createExpense({
            value: 50,
            date: new Date(),
            category: 'Transporte',
            description: 'Uber'
        });
        
        const expense2 = service.createExpense({
            value: 75,
            date: new Date(),
            category: 'Alimentação',
            description: 'Supermercado'
        });
        
        const expense3 = service.createExpense({
            value: 30,
            date: new Date(),
            category: 'Lazer',
            description: 'Cinema'
        });
        
        // Verify all were created with different IDs
        assert.notStrictEqual(expense1.id, expense2.id);
        assert.notStrictEqual(expense2.id, expense3.id);
        assert.notStrictEqual(expense1.id, expense3.id);
        
        // Verify all exist in the system
        const allExpenses = service.getAllExpenses();
        assert.strictEqual(allExpenses.length, 3);
        
        // Verify totals
        const totalValue = service.getTotalExpenses();
        assert.strictEqual(totalValue, 155); // 50 + 75 + 30
        
        // Filter by category
        const transporteExpenses = service.getExpensesByCategory('Transporte');
        assert.strictEqual(transporteExpenses.length, 1);
        assert.strictEqual(transporteExpenses[0].id, expense1.id);
        
        // Delete one expense
        service.deleteExpense(expense2.id);
        
        // Verify remaining expenses
        const remainingExpenses = service.getAllExpenses();
        assert.strictEqual(remainingExpenses.length, 2);
        
        const remainingTotal = service.getTotalExpenses();
        assert.strictEqual(remainingTotal, 80); // 50 + 30
    })) passed++;
    
    // Test date range filtering
    total++;
    if (test('should filter expenses by date range', () => {
        const service = new ExpenseService();
        
        // Clear any existing expenses
        const allExpenses = service.getAllExpenses();
        allExpenses.forEach(expense => service.deleteExpense(expense.id));
        
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(today.getDate() - 2);
        
        // Create expenses with different dates
        service.createExpense({
            value: 10,
            date: today,
            category: 'Test',
            description: 'Today'
        });
        
        service.createExpense({
            value: 20,
            date: yesterday,
            category: 'Test',
            description: 'Yesterday'
        });
        
        service.createExpense({
            value: 30,
            date: twoDaysAgo,
            category: 'Test',
            description: 'Two days ago'
        });
        
        // Filter by date range (yesterday and today)
        const recentExpenses = service.getExpensesByDateRange(yesterday, today);
        assert.strictEqual(recentExpenses.length, 2);
        
        const recentTotal = recentExpenses.reduce((sum, exp) => sum + exp.value, 0);
        assert.strictEqual(recentTotal, 30); // 10 + 20
    })) passed++;
    
    // Test service-validator integration
    total++;
    if (test('should integrate service with validator', () => {
        const service = new ExpenseService();
        
        // Use validator directly to verify same validation rules
        const validData = {
            value: 100,
            date: new Date(),
            category: 'Alimentação',
            description: 'Valid'
        };
        
        // Validate should pass
        assert.doesNotThrow(() => {
            ExpenseValidator.validateAll(validData);
        });
        
        // Service should also accept the same data
        const expense = service.createExpense(validData);
        assert.notStrictEqual(expense, null);
        assert.strictEqual(expense.value, 100);
        
        // Now test invalid data
        const invalidData = {
            value: -50,
            date: new Date(),
            category: 'Alimentação'
        };
        
        // Validator should reject
        assert.throws(() => {
            ExpenseValidator.validateAll(invalidData);
        }, /Expense value must be greater than zero/);
        
        // Service should also reject
        assert.throws(() => {
            service.createExpense(invalidData);
        }, /Expense value must be greater than zero/);
    })) passed++;
    
    console.log(`\n=== Expense Integration Tests Summary: ${passed}/${total} passed ===`);
    return { passed, total };
}

if (require.main === module) {
    runTests();
}

module.exports = { test, runTests };