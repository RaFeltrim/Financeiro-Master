const assert = require('assert');
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
    console.log('\n=== Expense Validator Unit Tests ===\n');
    
    let passed = 0;
    let total = 0;
    
    // Test validateValue with valid data
    total++;
    if (test('should validate valid value', () => {
        assert.strictEqual(ExpenseValidator.validateValue(100.50), true);
        assert.strictEqual(ExpenseValidator.validateValue(0.01), true);
        assert.strictEqual(ExpenseValidator.validateValue(1000000), true);
    })) passed++;
    
    // Test validateValue with invalid data
    total++;
    if (test('should reject invalid value (negative)', () => {
        assert.throws(() => {
            ExpenseValidator.validateValue(-50);
        }, /Expense value must be greater than zero/);
    })) passed++;
    
    total++;
    if (test('should reject invalid value (zero)', () => {
        assert.throws(() => {
            ExpenseValidator.validateValue(0);
        }, /Expense value must be greater than zero/);
    })) passed++;
    
    total++;
    if (test('should reject invalid value (non-number)', () => {
        assert.throws(() => {
            ExpenseValidator.validateValue('not a number');
        }, /Expense value must be a valid number/);
        
        assert.throws(() => {
            ExpenseValidator.validateValue(null);
        }, /Expense value must be a valid number/);
        
        assert.throws(() => {
            ExpenseValidator.validateValue(NaN);
        }, /Expense value must be a valid number/);
    })) passed++;
    
    // Test validateDate with valid data
    total++;
    if (test('should validate valid date', () => {
        assert.strictEqual(ExpenseValidator.validateDate(new Date()), true);
        assert.strictEqual(ExpenseValidator.validateDate(new Date('2023-01-01')), true);
        assert.strictEqual(ExpenseValidator.validateDate('2023-01-01'), true);
    })) passed++;
    
    // Test validateDate with future date
    total++;
    if (test('should reject future date', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1);
        
        assert.throws(() => {
            ExpenseValidator.validateDate(futureDate);
        }, /Expense date cannot be in the future/);
    })) passed++;
    
    // Test validateDate with invalid data
    total++;
    if (test('should reject invalid date', () => {
        assert.throws(() => {
            ExpenseValidator.validateDate('invalid date');
        }, /Expense date must be a valid date/);
        
        assert.throws(() => {
            ExpenseValidator.validateDate(null);
        }, /Expense date is required/);
        
        assert.throws(() => {
            ExpenseValidator.validateDate(undefined);
        }, /Expense date is required/);
    })) passed++;
    
    // Test validateCategory with valid data
    total++;
    if (test('should validate valid category', () => {
        assert.strictEqual(ExpenseValidator.validateCategory('Alimentação'), true);
        assert.strictEqual(ExpenseValidator.validateCategory('Transporte'), true);
        assert.strictEqual(ExpenseValidator.validateCategory('   Espaços   '), true);
    })) passed++;
    
    // Test validateCategory with invalid data
    total++;
    if (test('should reject invalid category', () => {
        assert.throws(() => {
            ExpenseValidator.validateCategory('');
        }, /Expense category is required/);
        
        assert.throws(() => {
            ExpenseValidator.validateCategory('   ');
        }, /Expense category is required/);
        
        assert.throws(() => {
            ExpenseValidator.validateCategory(null);
        }, /Expense category is required/);
        
        assert.throws(() => {
            ExpenseValidator.validateCategory(undefined);
        }, /Expense category is required/);
        
        assert.throws(() => {
            ExpenseValidator.validateCategory(123);
        }, /Expense category is required/);
    })) passed++;
    
    // Test validateDescription with valid data
    total++;
    if (test('should validate valid description', () => {
        assert.strictEqual(ExpenseValidator.validateDescription('Valid description'), true);
        assert.strictEqual(ExpenseValidator.validateDescription(''), true);
        assert.strictEqual(ExpenseValidator.validateDescription(null), true);
        assert.strictEqual(ExpenseValidator.validateDescription(undefined), true);
        assert.strictEqual(ExpenseValidator.validateDescription('   '), true);
    })) passed++;
    
    // Test validateDescription with invalid data
    total++;
    if (test('should reject invalid description', () => {
        assert.throws(() => {
            ExpenseValidator.validateDescription(123);
        }, /Expense description must be a string/);
        
        assert.throws(() => {
            ExpenseValidator.validateDescription({});
        }, /Expense description must be a string/);
    })) passed++;
    
    // Test validateAll with valid data
    total++;
    if (test('should validate all fields with valid data', () => {
        const validData = {
            value: 100,
            date: new Date(),
            category: 'Alimentação',
            description: 'Valid description'
        };
        
        assert.strictEqual(ExpenseValidator.validateAll(validData), true);
    })) passed++;
    
    // Test validateAll with invalid data
    total++;
    if (test('should reject invalid data in validateAll', () => {
        const invalidData = {
            value: -50,
            date: new Date(),
            category: 'Alimentação',
            description: 'Valid description'
        };
        
        assert.throws(() => {
            ExpenseValidator.validateAll(invalidData);
        }, /Expense value must be greater than zero/);
    })) passed++;
    
    // Test sanitize function
    total++;
    if (test('should sanitize expense data', () => {
        const rawData = {
            value: 100,
            date: new Date(),
            category: '  Alimentação  ',
            description: '  Description with spaces  '
        };
        
        const sanitized = ExpenseValidator.sanitize(rawData);
        
        assert.strictEqual(sanitized.category, 'Alimentação');
        assert.strictEqual(sanitized.description, 'Description with spaces');
        assert.strictEqual(sanitized.value, 100);
    })) passed++;
    
    // Test sanitize with undefined description
    total++;
    if (test('should handle undefined description in sanitize', () => {
        const rawData = {
            value: 100,
            date: new Date(),
            category: '  Alimentação  '
        };
        
        const sanitized = ExpenseValidator.sanitize(rawData);
        
        assert.strictEqual(sanitized.category, 'Alimentação');
        assert.strictEqual(sanitized.description, undefined);
        assert.strictEqual(sanitized.value, 100);
    })) passed++;
    
    console.log(`\n=== Expense Validator Tests Summary: ${passed}/${total} passed ===`);
    return { passed, total };
}

if (require.main === module) {
    runTests();
}

module.exports = { test, runTests };