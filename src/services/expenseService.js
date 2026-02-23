const Expense = require('../models/Expense');
const ExpenseValidator = require('../utils/expenseValidator');

class ExpenseService {
  constructor() {
    this.expenses = [];
    this.nextId = 1;
  }

  /**
   * Creates a new expense with validation
   * @param {Object} expenseData - The expense data to create
   * @returns {Expense} The created expense instance
   * @throws {Error} If validation fails
   */
  createExpense(expenseData) {
    try {
      // Sanitize input data
      const sanitizedData = ExpenseValidator.sanitize(expenseData);
      
      // Validate all fields
      ExpenseValidator.validateAll(sanitizedData);
      
      // Create new expense instance
      const expense = new Expense(
        sanitizedData.value,
        sanitizedData.date,
        sanitizedData.category,
        sanitizedData.description
      );
      
      // Assign an ID and add to collection
      expense.id = this.nextId++;
      this.expenses.push(expense);
      
      console.log(`Expense created successfully with ID: ${expense.id}`);
      return expense;
    } catch (error) {
      console.error('Error creating expense:', error.message);
      throw error;
    }
  }

  /**
   * Gets an expense by ID
   * @param {number} id - The expense ID
   * @returns {Expense|null} The expense if found, null otherwise
   */
  getExpenseById(id) {
    return this.expenses.find(expense => expense.id === id) || null;
  }

  /**
   * Updates an existing expense
   * @param {number} id - The expense ID to update
   * @param {Object} updates - The fields to update
   * @returns {Expense|null} The updated expense if found, null otherwise
   */
  updateExpense(id, updates) {
    try {
      const expenseIndex = this.expenses.findIndex(expense => expense.id === id);
      
      if (expenseIndex === -1) {
        throw new Error(`Expense with ID ${id} not found`);
      }
      
      // Get the existing expense
      const existingExpense = this.expenses[expenseIndex];
      
      // Merge updates with existing values
      const updatedData = {
        value: updates.value !== undefined ? updates.value : existingExpense.value,
        date: updates.date !== undefined ? updates.date : existingExpense.date,
        category: updates.category !== undefined ? updates.category : existingExpense.category,
        description: updates.description !== undefined ? updates.description : existingExpense.description
      };
      
      // Validate the updated data
      ExpenseValidator.validateAll(updatedData);
      
      // Update the expense
      existingExpense.update({
        value: updatedData.value,
        date: updatedData.date,
        category: updatedData.category,
        description: updatedData.description
      });
      
      console.log(`Expense updated successfully with ID: ${id}`);
      return existingExpense;
    } catch (error) {
      console.error('Error updating expense:', error.message);
      throw error;
    }
  }

  /**
   * Deletes an expense by ID
   * @param {number} id - The expense ID to delete
   * @returns {boolean} True if deleted, false if not found
   */
  deleteExpense(id) {
    const initialLength = this.expenses.length;
    this.expenses = this.expenses.filter(expense => expense.id !== id);
    
    if (this.expenses.length < initialLength) {
      console.log(`Expense deleted successfully with ID: ${id}`);
      return true;
    }
    
    return false;
  }

  /**
   * Gets all expenses
   * @returns {Array} Array of all expenses
   */
  getAllExpenses() {
    return [...this.expenses]; // Return a copy to prevent direct manipulation
  }

  /**
   * Gets expenses filtered by category
   * @param {string} category - The category to filter by
   * @returns {Array} Array of expenses in the specified category
   */
  getExpensesByCategory(category) {
    return this.expenses.filter(expense => expense.category.toLowerCase() === category.toLowerCase());
  }

  /**
   * Gets expenses within a date range
   * @param {Date} startDate - Start date (inclusive)
   * @param {Date} endDate - End date (inclusive)
   * @returns {Array} Array of expenses within the date range
   */
  getExpensesByDateRange(startDate, endDate) {
    return this.expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      expenseDate.setHours(0, 0, 0, 0);
      
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      return expenseDate >= start && expenseDate <= end;
    });
  }

  /**
   * Gets total expenses amount
   * @returns {number} Sum of all expenses
   */
  getTotalExpenses() {
    return this.expenses.reduce((total, expense) => total + expense.value, 0);
  }
}

module.exports = ExpenseService;