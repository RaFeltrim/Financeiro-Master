class Expense {
  /**
   * Creates a new Expense instance
   * @param {number} value - The expense amount (must be > 0)
   * @param {Date|string} date - The expense date (must not be in the future)
   * @param {string} category - The expense category (mandatory)
   * @param {string} description - Optional description of the expense
   */
  constructor(value, date, category, description = '') {
    this.validateInputs(value, date, category);
    
    this.value = value;
    this.date = this.parseDate(date);
    this.category = category.trim();
    this.description = description ? description.trim() : '';
    this.createdAt = new Date();
  }

  /**
   * Validates all input parameters before creating an expense
   * @param {number} value - The expense amount
   * @param {Date|string} date - The expense date
   * @param {string} category - The expense category
   * @throws {Error} If any validation fails
   */
  validateInputs(value, date, category) {
    // Validate value is a number and greater than zero
    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error('Expense value must be a valid number');
    }
    
    if (value <= 0) {
      throw new Error('Expense value must be greater than zero');
    }

    // Validate date is provided and not in the future
    if (!date) {
      throw new Error('Expense date is required');
    }

    const parsedDate = this.parseDate(date);
    if (!(parsedDate instanceof Date) || isNaN(parsedDate.getTime())) {
      throw new Error('Expense date must be a valid date');
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set time to end of day for comparison (accept same-day entries)
    
    if (parsedDate > today) {
      throw new Error('Expense date cannot be in the future');
    }

    // Validate category is provided
    if (!category || typeof category !== 'string' || category.trim().length === 0) {
      throw new Error('Expense category is required');
    }
  }

  /**
   * Parses date input into a Date object
   * @param {Date|string} date - The date to parse
   * @returns {Date} The parsed date object
   * @throws {Error} If date format is invalid
   */
  parseDate(date) {
    if (date instanceof Date) {
      return date;
    }

    if (typeof date === 'string') {
      const parsed = new Date(date);
      if (isNaN(parsed.getTime())) {
        throw new Error(`Invalid date format: ${date}`);
      }
      return parsed;
    }

    throw new Error('Date must be a Date object or a valid date string');
  }

  /**
   * Updates the expense properties with validation
   * @param {Object} updates - Object containing properties to update
   */
  update(updates) {
    const { value, date, category, description } = updates;

    // Validate and update value if provided
    if (value !== undefined) {
      if (typeof value !== 'number' || value <= 0) {
        throw new Error('Expense value must be a number greater than zero');
      }
      this.value = value;
    }

    // Validate and update date if provided
    if (date !== undefined) {
      const parsedDate = this.parseDate(date);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // Set time to end of day for comparison (accept same-day entries)
      
      if (parsedDate > today) {
        throw new Error('Expense date cannot be in the future');
      }
      this.date = parsedDate;
    }

    // Validate and update category if provided
    if (category !== undefined) {
      if (!category || typeof category !== 'string' || category.trim().length === 0) {
        throw new Error('Expense category is required');
      }
      this.category = category.trim();
    }

    // Update description if provided
    if (description !== undefined) {
      this.description = description ? description.trim() : '';
    }

    this.updatedAt = new Date();
  }

  /**
   * Checks if the expense is valid
   * @returns {boolean} True if all validations pass
   */
  isValid() {
    try {
      this.validateInputs(this.value, this.date, this.category);
      return true;
    } catch (error) {
      console.error('Expense validation failed:', error.message);
      return false;
    }
  }

  /**
   * Returns a plain object representation of the expense
   * @returns {Object} Plain object with expense properties
   */
  toJSON() {
    return {
      id: this.id,
      value: this.value,
      date: this.date.toISOString(),
      category: this.category,
      description: this.description,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt ? this.updatedAt.toISOString() : null
    };
  }
}

module.exports = Expense;