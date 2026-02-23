const assert = require('assert');
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
    console.log('\n=== Expense Model Unit Tests ===\n');
    
    let passed = 0;
    let total = 0;
    
    // Test Constructor with valid data
    total++;
    if (test('should create an expense with valid data', () => {
        const expense = new Expense(100.50, new Date(), 'Alimentação', 'Compra de supermercado');
        
        assert.strictEqual(expense.value, 100.50);
        assert.strictEqual(expense.category, 'Alimentação');
        assert.strictEqual(expense.description, 'Compra de supermercado');
        assert(expense.date instanceof Date);
        assert(expense.createdAt instanceof Date);
    })) passed++;
    
    // Test Constructor with negative value
    total++;
    if (test('should throw error for negative value', () => {
        assert.throws(() => {
            new Expense(-50, new Date(), 'Alimentação');
        }, /Expense value must be greater than zero/);
    })) passed++;
    
    // Test Constructor with zero value
    total++;
    if (test('should throw error for zero value', () => {
        assert.throws(() => {
            new Expense(0, new Date(), 'Alimentação');
        }, /Expense value must be greater than zero/);
    })) passed++;
    
    // Test Constructor with future date
    total++;
    if (test('should throw error for future date', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1);
        
        assert.throws(() => {
            new Expense(100, futureDate, 'Alimentação');
        }, /Expense date cannot be in the future/);
    })) passed++;
    
    // Test Constructor with missing category
    total++;
    if (test('should throw error for missing category', () => {
        assert.throws(() => {
            new Expense(100, new Date(), '');
        }, /Expense category is required/);
        
        assert.throws(() => {
            new Expense(100, new Date(), null);
        }, /Expense category is required/);
        
        assert.throws(() => {
            new Expense(100, new Date(), undefined);
        }, /Expense category is required/);
    })) passed++;
    
    // Test Update Method
    total++;
    if (test('should update expense properties', () => {
        const expense = new Expense(100, new Date(), 'Alimentação', 'Original');
        const newValue = 150;
        const newDescription = 'Atualizado';
        
        expense.update({
            value: newValue,
            description: newDescription
        });
        
        assert.strictEqual(expense.value, newValue);
        assert.strictEqual(expense.description, newDescription);
        assert(expense.updatedAt instanceof Date);
    })) passed++;
    
    // Test Update with invalid value
    total++;
    if (test('should throw error when updating with invalid value', () => {
        const expense = new Expense(100, new Date(), 'Alimentação');
        
        assert.throws(() => {
            expense.update({ value: -50 });
        }, /Expense value must be a number greater than zero/);
    })) passed++;
    
    // Test Update with future date
    total++;
    if (test('should throw error when updating with future date', () => {
        const expense = new Expense(100, new Date(), 'Alimentação');
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1);
        
        assert.throws(() => {
            expense.update({ date: futureDate });
        }, /Expense date cannot be in the future/);
    })) passed++;
    
    // Test Validation Methods
    total++;
    if (test('should validate valid expense', () => {
        const expense = new Expense(100, new Date(), 'Alimentação');
        assert.strictEqual(expense.isValid(), true);
    })) passed++;
    
    // Test Validation with negative value
    total++;
    if (test('should invalidate expense with negative value', () => {
        const expense = new Expense(100, new Date(), 'Alimentação');
        expense.value = -50;
        assert.strictEqual(expense.isValid(), false);
    })) passed++;
    
    // Test toJSON Method
    total++;
    if (test('should return proper JSON representation', () => {
        const expense = new Expense(100, new Date('2023-01-01'), 'Alimentação', 'Test');
        expense.id = 1;
        
        const json = expense.toJSON();
        
        assert.strictEqual(json.id, 1);
        assert.strictEqual(json.value, 100);
        assert.strictEqual(typeof json.date, 'string');
        assert.strictEqual(json.category, 'Alimentação');
        assert.strictEqual(json.description, 'Test');
        assert.strictEqual(typeof json.createdAt, 'string');
    })) passed++;
    
    console.log(`\n=== Expense Model Tests Summary: ${passed}/${total} passed ===`);
    return { passed, total };
}

if (require.main === module) {
    runTests();
}

module.exports = { test, runTests };