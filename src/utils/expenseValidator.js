/**
 * Utility functions for expense validation
 */

class ExpenseValidator {
  /**
   * Validates expense value
   * @param {*} value - The expense value to validate
   * @returns {boolean} True if valid, throws error if invalid
   */
  static validateValue(value) {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error('Expense value must be a valid number');
    }
    
    if (value <= 0) {
      throw new Error('Expense value must be greater than zero');
    }
    
    return true;
  }

  /**
   * Validates expense date
   * @param {*} date - The expense date to validate
   * @returns {boolean} True if valid, throws error if invalid
   */
  static validateDate(date) {
    if (!date) {
      throw new Error('Expense date is required');
    }

    let parsedDate;
    if (date instanceof Date) {
      parsedDate = date;
    } else if (typeof date === 'string') {
      parsedDate = new Date(date);
    } else {
      throw new Error('Date must be a Date object or a valid date string');
    }

    if (!(parsedDate instanceof Date) || isNaN(parsedDate.getTime())) {
      throw new Error('Expense date must be a valid date');
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set time to end of day for comparison (accept same-day entries)
    
    if (parsedDate > today) {
      throw new Error('Expense date cannot be in the future');
    }

    return true;
  }

  /**
   * Validates expense category
   * @param {*} category - The expense category to validate
   * @returns {boolean} True if valid, throws error if invalid
   */
  static validateCategory(category) {
    if (!category || typeof category !== 'string' || category.trim().length === 0) {
      throw new Error('Expense category is required');
    }
    
    return true;
  }

  /**
   * Validates expense description
   * @param {*} description - The expense description to validate
   * @returns {boolean} True if valid
   */
  static validateDescription(description) {
    if (description && typeof description !== 'string') {
      throw new Error('Expense description must be a string');
    }
    
    return true;
  }

  /**
   * Comprehensive validation for all expense fields
   * @param {Object} expenseData - The expense data to validate
   * @returns {boolean} True if all validations pass
   */
  static validateAll(expenseData) {
    const { value, date, category, description } = expenseData;

    this.validateValue(value);
    this.validateDate(date);
    this.validateCategory(category);
    this.validateDescription(description);

    return true;
  }

  /**
   * Sanitizes expense data
   * @param {Object} expenseData - The expense data to sanitize
   * @returns {Object} Sanitized expense data
   */
  static sanitize(expenseData) {
    const sanitized = { ...expenseData };

    if (sanitized.category && typeof sanitized.category === 'string') {
      sanitized.category = sanitized.category.trim();
    }

    if (sanitized.description && typeof sanitized.description === 'string') {
      sanitized.description = sanitized.description.trim();
    }

    return sanitized;
  }
}

module.exports = ExpenseValidator;