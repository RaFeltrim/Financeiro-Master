const { PrismaClient } = require('@prisma/client');
const ExpenseValidator = require('../utils/expenseValidator');

class ExpenseService {
  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Creates a new expense with validation and persists it
   * @param {Object} expenseData - The expense data to create
   * @returns {Promise<Object>} The created expense from DB
   * @throws {Error} If validation or DB operation fails
   */
  async createExpense(expenseData) {
    try {
      // Sanitize input data
      const sanitizedData = ExpenseValidator.sanitize(expenseData);

      // Validate all fields
      ExpenseValidator.validateAll(sanitizedData);

      // Persist in Prisma
      const expense = await this.prisma.expense.create({
        data: {
          valor: sanitizedData.value,
          data: sanitizedData.date, // Must be Date object
          categoria: sanitizedData.category,
          descricao: sanitizedData.description || null,
          origem: expenseData.origem || 'MANUAL'
        }
      });

      console.log(`[DB SUCCESS] Expense persisted successfully with ID: ${expense.id}`);
      return this._mapToDomain(expense);
    } catch (error) {
      console.error('[DB ERROR] Failed creating expense. Caused by:', error.message);
      throw error;
    }
  }

  /**
   * Gets an expense by ID
   * @param {string} id - The expense UUID
   * @returns {Promise<Object|null>}
   */
  async getExpenseById(id) {
    try {
      const expense = await this.prisma.expense.findUnique({ where: { id } });
      return expense ? this._mapToDomain(expense) : null;
    } catch (error) {
      console.error(`[DB ERROR] Failed fetching expense ID ${id}:`, error.message);
      throw error;
    }
  }

  /**
   * Updates an existing expense
   * @param {string} id - The expense UUID
   * @param {Object} updates - Fields to update
   */
  async updateExpense(id, updates) {
    try {
      // We rely on Prisma to throw P2025 if not found, or pre-fetch it.
      const existing = await this.prisma.expense.findUnique({ where: { id } });
      if (!existing) {
        throw new Error(`Expense with ID ${id} not found`);
      }

      const domainExisting = this._mapToDomain(existing);

      const mergedUpdates = {
        value: updates.value !== undefined ? updates.value : domainExisting.value,
        date: updates.date !== undefined ? updates.date : domainExisting.date,
        category: updates.category !== undefined ? updates.category : domainExisting.category,
        description: updates.description !== undefined ? updates.description : domainExisting.description
      };

      const sanitizedUpdates = ExpenseValidator.sanitize(mergedUpdates);
      ExpenseValidator.validateAll(sanitizedUpdates);

      // Mapping updates correctly back to PT fields
      const dataToUpdate = {};
      if (updates.value !== undefined) dataToUpdate.valor = updates.value;
      if (updates.date !== undefined) dataToUpdate.data = updates.date;
      if (updates.category !== undefined) dataToUpdate.categoria = updates.category;
      if (updates.description !== undefined) dataToUpdate.descricao = updates.description;

      const updated = await this.prisma.expense.update({
        where: { id },
        data: dataToUpdate
      });

      console.log(`[DB SUCCESS] Expense updated successfully. ID: ${id}`);
      return this._mapToDomain(updated);
    } catch (error) {
      console.error(`[DB ERROR] Failed updating expense ID ${id}:`, error.message);
      throw error;
    }
  }

  /**
   * Deletes an expense by ID
   * @param {string} id - UUID
   */
  async deleteExpense(id) {
    try {
      await this.prisma.expense.delete({ where: { id } });
      console.log(`[DB SUCCESS] Expense deleted successfully. ID: ${id}`);
      return true;
    } catch (error) {
      if (error.code === 'P2025') {
        // Prisma code for Record to delete does not exist.
        return false;
      }
      console.error(`[DB ERROR] Failed deleting expense ID ${id}:`, error.message);
      throw error;
    }
  }

  /**
   * Gets all expenses
   */
  async getAllExpenses() {
    try {
      const expenses = await this.prisma.expense.findMany({
        orderBy: { data: 'desc' }
      });
      return expenses.map(e => this._mapToDomain(e));
    } catch (error) {
      console.error('[DB ERROR] Failed fetching all expenses:', error.message);
      throw error;
    }
  }

  /**
   * Gets expenses filtered by category
   */
  async getExpensesByCategory(category) {
    try {
      const expenses = await this.prisma.expense.findMany({
        where: { categoria: category }
      });
      return expenses.map(e => this._mapToDomain(e));
    } catch (error) {
      console.error(`[DB ERROR] Failed fetching by category '${category}':`, error.message);
      throw error;
    }
  }

  /**
   * Gets expenses within a date range
   */
  async getExpensesByDateRange(startDate, endDate) {
    try {
      // Normalize dates
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const expenses = await this.prisma.expense.findMany({
        where: {
          data: {
            gte: start,
            lte: end
          }
        },
        orderBy: { data: 'desc' }
      });

      return expenses.map(e => this._mapToDomain(e));
    } catch (error) {
      console.error('[DB ERROR] Failed fetching date range:', error.message);
      throw error;
    }
  }

  /**
   * Gets total expenses amount
   */
  async getTotalExpenses() {
    try {
      const aggregate = await this.prisma.expense.aggregate({
        _sum: { valor: true }
      });
      return aggregate._sum.valor || 0;
    } catch (error) {
      console.error('[DB ERROR] Failed calculating total expenses:', error.message);
      throw error;
    }
  }

  /**
   * Internal mapper from Prisma Schema (PT-BR) to Application Domain (EN)
   * Prevents breaking older contract layers
   */
  _mapToDomain(prismaRecord) {
    return {
      id: prismaRecord.id, // String UUID now instead of number
      value: prismaRecord.valor,
      date: prismaRecord.data,
      category: prismaRecord.categoria,
      description: prismaRecord.descricao,
      origem: prismaRecord.origem,
      createdAt: prismaRecord.createdAt,
      updatedAt: prismaRecord.updatedAt
    };
  }
}

module.exports = ExpenseService;