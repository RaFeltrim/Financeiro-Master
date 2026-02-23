const assert = require('assert');
const ExpenseService = require('../../src/services/expenseService');
const Expense = require('../../src/models/Expense');

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
    console.log('\n=== Expense Service Unit Tests ===\n');
    
    let passed = 0;
    let total = 0;
    
    // Test createExpense with valid data
    total++;
    if (test('should create expense via service', () => {
        const service = new ExpenseService();
        const expense = service.createExpense({
            value: 75.25,
            date: new Date(),
            category: 'Transporte',
            description: 'Uber para o trabalho'
        });
        
        assert.strictEqual(expense.value, 75.25);
        assert.strictEqual(expense.category, 'Transporte');
        assert.strictEqual(expense.description, 'Uber para o trabalho');
        assert(expense.id !== undefined);
        assert(expense.id > 0);
    })) passed++;
    
    // Test createExpense with invalid data (negative value)
    total++;
    if (test('should reject invalid expense (negative value)', () => {
        const service = new ExpenseService();
        
        assert.throws(() => {
            service.createExpense({
                value: -20,
                date: new Date(),
                category: 'Lazer',
                description: 'Cinema'
            });
        }, /Expense value must be greater than zero/);
    })) passed++;
    
    // Test createExpense with invalid data (future date)
    total++;
    if (test('should reject invalid expense (future date)', () => {
        const service = new ExpenseService();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 2);
        
        assert.throws(() => {
            service.createExpense({
                value: 50,
                date: futureDate,
                category: 'Lazer',
                description: 'Show'
            });
        }, /Expense date cannot be in the future/);
    })) passed++;
    
    // Test getExpenseById
    total++;
    if (test('should retrieve expense by ID', () => {
        const service = new ExpenseService();
        const expense = service.createExpense({
            value: 100,
            date: new Date(),
            category: 'Alimentação',
            description: 'Supermercado'
        });
        
        const retrieved = service.getExpenseById(expense.id);
        assert.notStrictEqual(retrieved, null);
        assert.strictEqual(retrieved.id, expense.id);
        assert.strictEqual(retrieved.value, 100);
    })) passed++;
    
    // Test getExpenseById with non-existent ID
    total++;
    if (test('should return null for non-existent ID', () => {
        const service = new ExpenseService();
        
        const retrieved = service.getExpenseById(999);
        assert.strictEqual(retrieved, null);
    })) passed++;
    
    // Test updateExpense
    total++;
    if (test('should update expense', () => {
        const service = new ExpenseService();
        const expense = service.createExpense({
            value: 100,
            date: new Date(),
            category: 'Alimentação',
            description: 'Original'
        });
        
        const updated = service.updateExpense(expense.id, {
            value: 150,
            description: 'Atualizado'
        });
        
        assert.strictEqual(updated.value, 150);
        assert.strictEqual(updated.description, 'Atualizado');
    })) passed++;
    
    // Test updateExpense with invalid data
    total++;
    if (test('should reject update with invalid data', () => {
        const service = new ExpenseService();
        const expense = service.createExpense({
            value: 100,
            date: new Date(),
            category: 'Alimentação',
            description: 'Original'
        });
        
        assert.throws(() => {
            service.updateExpense(expense.id, {
                value: -50
            });
        }, /Expense value must be greater than zero/);
    })) passed++;
    
    // Test deleteExpense
    total++;
    if (test('should delete expense', () => {
        const service = new ExpenseService();
        const expense = service.createExpense({
            value: 100,
            date: new Date(),
            category: 'Alimentação',
            description: 'Para deletar'
        });
        
        const deleted = service.deleteExpense(expense.id);
        assert.strictEqual(deleted, true);
        
        const retrieved = service.getExpenseById(expense.id);
        assert.strictEqual(retrieved, null);
    })) passed++;
    
    // Test deleteExpense with non-existent ID
    total++;
    if (test('should return false when deleting non-existent expense', () => {
        const service = new ExpenseService();
        
        const deleted = service.deleteExpense(999);
        assert.strictEqual(deleted, false);
    })) passed++;
    
    // Test getAllExpenses
    total++;
    if (test('should get all expenses', () => {
        const service = new ExpenseService();
        service.createExpense({
            value: 50,
            date: new Date(),
            category: 'Transporte',
            description: 'Test 1'
        });
        service.createExpense({
            value: 75,
            date: new Date(),
            category: 'Alimentação',
            description: 'Test 2'
        });
        
        const allExpenses = service.getAllExpenses();
        assert(Array.isArray(allExpenses));
        assert(allExpenses.length >= 2);
    })) passed++;
    
    // Test getExpensesByCategory
    total++;
    if (test('should filter expenses by category', () => {
        const service = new ExpenseService();
        service.createExpense({
            value: 50,
            date: new Date(),
            category: 'Transporte',
            description: 'Test 1'
        });
        service.createExpense({
            value: 75,
            date: new Date(),
            category: 'Alimentação',
            description: 'Test 2'
        });
        
        const transporteExpenses = service.getExpensesByCategory('Transporte');
        assert(Array.isArray(transporteExpenses));
        assert(transporteExpenses.length >= 1);
        transporteExpenses.forEach(expense => {
            assert.strictEqual(expense.category, 'Transporte');
        });
    })) passed++;
    
    // Test getExpensesByDateRange
    total++;
    if (test('should filter expenses by date range', () => {
        const service = new ExpenseService();
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        
        service.createExpense({
            value: 50,
            date: today,
            category: 'Transporte',
            description: 'Today'
        });
        service.createExpense({
            value: 75,
            date: yesterday,
            category: 'Alimentação',
            description: 'Yesterday'
        });
        
        const rangeExpenses = service.getExpensesByDateRange(yesterday, today);
        assert(Array.isArray(rangeExpenses));
        assert(rangeExpenses.length >= 2);
    })) passed++;
    
    // Test getTotalExpenses
    total++;
    if (test('should calculate total expenses', () => {
        const service = new ExpenseService();
        service.createExpense({
            value: 50,
            date: new Date(),
            category: 'Transporte',
            description: 'Test 1'
        });
        service.createExpense({
            value: 75,
            date: new Date(),
            category: 'Alimentação',
            description: 'Test 2'
        });
        
        const total = service.getTotalExpenses();
        assert.strictEqual(total, 125);
    })) passed++;
    
    console.log(`\n=== Expense Service Tests Summary: ${passed}/${total} passed ===`);
    return { passed, total };
}

if (require.main === module) {
    runTests();
}

module.exports = { test, runTests };