const assert = require('assert');
const ExpenseService = require('../../src/services/expenseService');

async function test(description, testFn) {
    try {
        await testFn();
        console.log(`✓ ${description}`);
        return true;
    } catch (error) {
        console.log(`✗ ${description}: ${error.message}`);
        return false;
    }
}

async function runTests() {
    console.log('\n=== Expense Service Unit Tests ===\n');

    let passed = 0;
    let total = 0;
    const service = new ExpenseService();

    // Test createExpense with valid data
    total++;
    let success = await test('should create expense via service', async () => {
        const expense = await service.createExpense({
            value: 75.25,
            date: new Date(),
            category: 'Transporte',
            description: 'Uber para o trabalho'
        });

        assert.strictEqual(expense.value, 75.25);
        assert.strictEqual(expense.category, 'Transporte');
        assert.strictEqual(expense.description, 'Uber para o trabalho');
        assert(expense.id !== undefined);

        // cleanup for next tests
        await service.deleteExpense(expense.id);
    });
    if (success) passed++;

    // Test createExpense with invalid data (negative value)
    total++;
    success = await test('should reject invalid expense (negative value)', async () => {
        try {
            await service.createExpense({
                value: -20,
                date: new Date(),
                category: 'Lazer',
                description: 'Cinema'
            });
            assert.fail('Expected error was not thrown');
        } catch (err) {
            assert(err.message.includes('Expense value must be greater than zero') || err.message.includes('greater than zero'));
        }
    });
    if (success) passed++;

    // Test createExpense with invalid data (future date)
    total++;
    success = await test('should reject invalid expense (future date)', async () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 2);

        try {
            await service.createExpense({
                value: 50,
                date: futureDate,
                category: 'Lazer',
                description: 'Show'
            });
            assert.fail('Expected error was not thrown');
        } catch (err) {
            assert(err.message.includes('Expense date cannot be in the future') || err.message.includes('future'));
        }
    });
    if (success) passed++;

    // Test getExpenseById
    total++;
    success = await test('should retrieve expense by ID', async () => {
        const expense = await service.createExpense({
            value: 100,
            date: new Date(),
            category: 'Alimentação',
            description: 'Supermercado'
        });

        const retrieved = await service.getExpenseById(expense.id);
        assert.notStrictEqual(retrieved, null);
        assert.strictEqual(retrieved.id, expense.id);
        assert.strictEqual(retrieved.value, 100);

        await service.deleteExpense(expense.id);
    });
    if (success) passed++;

    // Test getExpenseById with non-existent ID
    total++;
    success = await test('should return null for non-existent ID', async () => {
        const retrieved = await service.getExpenseById('00000000-0000-0000-0000-000000000000');
        assert.strictEqual(retrieved, null);
    });
    if (success) passed++;

    // Test updateExpense
    total++;
    success = await test('should update expense', async () => {
        const expense = await service.createExpense({
            value: 100,
            date: new Date(),
            category: 'Alimentação',
            description: 'Original'
        });

        const updated = await service.updateExpense(expense.id, {
            value: 150,
            description: 'Atualizado'
        });

        assert.strictEqual(updated.value, 150);
        assert.strictEqual(updated.description, 'Atualizado');

        await service.deleteExpense(expense.id);
    });
    if (success) passed++;

    // Test updateExpense with invalid data
    total++;
    success = await test('should reject update with invalid data', async () => {
        const expense = await service.createExpense({
            value: 100,
            date: new Date(),
            category: 'Alimentação',
            description: 'Original'
        });

        try {
            await service.updateExpense(expense.id, {
                value: -50
            });
            assert.fail('Expected error not thrown');
        } catch (err) {
            assert(err.message.includes('greater than zero'));
        }

        await service.deleteExpense(expense.id);
    });
    if (success) passed++;

    // Test deleteExpense
    total++;
    success = await test('should delete expense', async () => {
        const expense = await service.createExpense({
            value: 100,
            date: new Date(),
            category: 'Alimentação',
            description: 'Para deletar'
        });

        const deleted = await service.deleteExpense(expense.id);
        assert.strictEqual(deleted, true);

        const retrieved = await service.getExpenseById(expense.id);
        assert.strictEqual(retrieved, null);
    });
    if (success) passed++;

    // Test deleteExpense with non-existent ID
    total++;
    success = await test('should return false when deleting non-existent expense', async () => {
        const deleted = await service.deleteExpense('00000000-0000-0000-0000-000000000000');
        assert.strictEqual(deleted, false);
    });
    if (success) passed++;

    // Test getAllExpenses
    total++;
    success = await test('should get all expenses', async () => {
        await service.prisma.expense.deleteMany(); // clean for exact count

        await service.createExpense({
            value: 50,
            date: new Date(),
            category: 'Transporte',
            description: 'Test 1'
        });
        await service.createExpense({
            value: 75,
            date: new Date(),
            category: 'Alimentação',
            description: 'Test 2'
        });

        const allExpenses = await service.getAllExpenses();
        assert(Array.isArray(allExpenses));
        assert(allExpenses.length >= 2);
    });
    if (success) passed++;

    // Test getExpensesByCategory
    total++;
    success = await test('should filter expenses by category', async () => {
        await service.prisma.expense.deleteMany();
        await service.createExpense({
            value: 50,
            date: new Date(),
            category: 'Transporte',
            description: 'Test 1'
        });
        await service.createExpense({
            value: 75,
            date: new Date(),
            category: 'Alimentação',
            description: 'Test 2'
        });

        const transporteExpenses = await service.getExpensesByCategory('Transporte');
        assert(Array.isArray(transporteExpenses));
        assert(transporteExpenses.length >= 1);
        transporteExpenses.forEach(expense => {
            assert.strictEqual(expense.category, 'Transporte');
        });
    });
    if (success) passed++;

    // Test getExpensesByDateRange
    total++;
    success = await test('should filter expenses by date range', async () => {
        await service.prisma.expense.deleteMany();
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        await service.createExpense({
            value: 50,
            date: today,
            category: 'Transporte',
            description: 'Today'
        });
        await service.createExpense({
            value: 75,
            date: yesterday,
            category: 'Alimentação',
            description: 'Yesterday'
        });

        const rangeExpenses = await service.getExpensesByDateRange(yesterday, today);
        assert(Array.isArray(rangeExpenses));
        assert(rangeExpenses.length >= 2);
    });
    if (success) passed++;

    // Test getTotalExpenses
    total++;
    success = await test('should calculate total expenses', async () => {
        await service.prisma.expense.deleteMany();
        await service.createExpense({
            value: 50,
            date: new Date(),
            category: 'Transporte',
            description: 'Test 1'
        });
        await service.createExpense({
            value: 75,
            date: new Date(),
            category: 'Alimentação',
            description: 'Test 2'
        });

        const _total = await service.getTotalExpenses();
        assert.strictEqual(_total, 125);
    });
    if (success) passed++;

    console.log(`\n=== Expense Service Tests Summary: ${passed}/${total} passed ===`);
    return { passed, total };
}

if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { test, runTests };