const assert = require('assert');
const ExpenseService = require('../../src/services/expenseService');
const ExpenseValidator = require('../../src/utils/expenseValidator');

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
    console.log('\n=== Expense Integration Tests ===\n');

    let passed = 0;
    let total = 0;
    const service = new ExpenseService();

    // Test full workflow: create, retrieve, update, delete
    total++;
    let success = await test('should complete full expense workflow', async () => {
        // Create expense
        const expenseData = {
            value: 100.50,
            date: new Date(),
            category: 'Alimentação',
            description: 'Compra de supermercado'
        };

        const createdExpense = await service.createExpense(expenseData);
        assert.notStrictEqual(createdExpense, null);
        assert.strictEqual(createdExpense.value, 100.50);
        assert.strictEqual(createdExpense.category, 'Alimentação');

        // Retrieve expense
        const retrievedExpense = await service.getExpenseById(createdExpense.id);
        assert.notStrictEqual(retrievedExpense, null);
        assert.strictEqual(retrievedExpense.id, createdExpense.id);

        // Update expense
        const updatedExpense = await service.updateExpense(createdExpense.id, {
            value: 150.75,
            description: 'Compra atualizada'
        });
        assert.strictEqual(updatedExpense.value, 150.75);
        assert.strictEqual(updatedExpense.description, 'Compra atualizada');

        // Verify update persisted
        const verifiedExpense = await service.getExpenseById(createdExpense.id);
        assert.strictEqual(verifiedExpense.value, 150.75);
        assert.strictEqual(verifiedExpense.description, 'Compra atualizada');

        // Delete expense
        const deleted = await service.deleteExpense(createdExpense.id);
        assert.strictEqual(deleted, true);

        // Verify deletion
        const postDeleteExpense = await service.getExpenseById(createdExpense.id);
        assert.strictEqual(postDeleteExpense, null);
    });
    if (success) passed++;

    // Test validation integration
    total++;
    success = await test('should validate data before creating expense', async () => {
        await service.prisma.expense.deleteMany();

        // Try to create invalid expense (negative value)
        try {
            await service.createExpense({
                value: -50,
                date: new Date(),
                category: 'Alimentação',
                description: 'Invalid expense'
            });
            assert.fail('Expected error to be thrown');
        } catch (err) {
            assert(err.message.includes('greater than zero'));
        }

        // Verify no expense was created
        const allExpenses = await service.getAllExpenses();
        assert.strictEqual(allExpenses.length, 0);
    });
    if (success) passed++;

    // Test multiple expenses workflow
    total++;
    success = await test('should handle multiple expenses correctly', async () => {
        await service.prisma.expense.deleteMany();

        // Create multiple expenses
        const expense1 = await service.createExpense({
            value: 50,
            date: new Date(),
            category: 'Transporte',
            description: 'Uber'
        });

        const expense2 = await service.createExpense({
            value: 75,
            date: new Date(),
            category: 'Alimentação',
            description: 'Supermercado'
        });

        const expense3 = await service.createExpense({
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
        const allExpenses = await service.getAllExpenses();
        assert.strictEqual(allExpenses.length, 3);

        // Verify totals
        const totalValue = await service.getTotalExpenses();
        assert.strictEqual(totalValue, 155); // 50 + 75 + 30

        // Filter by category
        const transporteExpenses = await service.getExpensesByCategory('Transporte');
        assert.strictEqual(transporteExpenses.length, 1);
        assert.strictEqual(transporteExpenses[0].id, expense1.id);

        // Delete one expense
        await service.deleteExpense(expense2.id);

        // Verify remaining expenses
        const remainingExpenses = await service.getAllExpenses();
        assert.strictEqual(remainingExpenses.length, 2);

        const remainingTotal = await service.getTotalExpenses();
        assert.strictEqual(remainingTotal, 80); // 50 + 30
    });
    if (success) passed++;

    // Test date range filtering
    total++;
    success = await test('should filter expenses by date range', async () => {
        await service.prisma.expense.deleteMany();

        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(today.getDate() - 2);

        // Create expenses with different dates
        await service.createExpense({
            value: 10,
            date: today,
            category: 'Test',
            description: 'Today'
        });

        await service.createExpense({
            value: 20,
            date: yesterday,
            category: 'Test',
            description: 'Yesterday'
        });

        await service.createExpense({
            value: 30,
            date: twoDaysAgo,
            category: 'Test',
            description: 'Two days ago'
        });

        // Filter by date range (yesterday and today)
        const recentExpenses = await service.getExpensesByDateRange(yesterday, today);
        assert.strictEqual(recentExpenses.length, 2);

        const recentTotal = recentExpenses.reduce((sum, exp) => sum + exp.value, 0);
        assert.strictEqual(recentTotal, 30); // 10 + 20
    });
    if (success) passed++;

    // Test service-validator integration
    total++;
    success = await test('should integrate service with validator', async () => {
        await service.prisma.expense.deleteMany();

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
        const expense = await service.createExpense(validData);
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
        try {
            await service.createExpense(invalidData);
            assert.fail('Expected error');
        } catch (err) {
            assert(err.message.includes('greater than zero'));
        }
    });
    if (success) passed++;

    console.log(`\n=== Expense Integration Tests Summary: ${passed}/${total} passed ===`);
    return { passed, total };
}

if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { test, runTests };