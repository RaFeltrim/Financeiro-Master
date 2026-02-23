/**
 * Secure Bank Statement Importer
 * Processes bank statements locally without transmitting data externally
 */
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const ExpenseService = require('../services/expenseService');
const logger = require('../utils/logger');

class SecureBankImporter {
  constructor(expenseService) {
    this.expenseService = expenseService || new ExpenseService();
    // Define common Portuguese banking terms for automatic categorization
    this.categoryMappings = {
      'supermercado': 'Alimentação',
      'mercado': 'Alimentação',
      'atacadao': 'Alimentação',
      'assai': 'Alimentação',
      'carrefour': 'Alimentação',
      'extra': 'Alimentação',
      'pague menos': 'Alimentação',
      'ubs': 'Saúde',
      'hospital': 'Saúde',
      'clinica': 'Saúde',
      'farmacia': 'Saúde',
      'drogasil': 'Saúde',
      'onofre': 'Saúde',
      'uber': 'Transporte',
      '99app': 'Transporte',
      'cabify': 'Transporte',
      'gasolina': 'Transporte',
      'posto': 'Transporte',
      'shell': 'Transporte',
      'ipiranga': 'Transporte',
      'petrobras': 'Transporte',
      'rede': 'Transporte',
      'netflix': 'Lazer',
      'spotify': 'Lazer',
      'amazon': 'Lazer',
      'steam': 'Lazer',
      'playstation': 'Lazer',
      'cinemark': 'Lazer',
      'google': 'Lazer',
      'apple': 'Lazer',
      'itunes': 'Lazer',
      'cinema': 'Lazer',
      'restaurante': 'Alimentação',
      'padaria': 'Alimentação',
      'bar': 'Lazer',
      'movel': 'Moradia',
      'condominio': 'Moradia',
      'agua': 'Moradia',
      'luz': 'Moradia',
      'internet': 'Moradia',
      'telefone': 'Moradia',
      'claro': 'Moradia',
      'vivo': 'Moradia',
      'tim': 'Moradia',
      'oi': 'Moradia',
      'educacao': 'Educação',
      'faculdade': 'Educação',
      'curso': 'Educação',
      'escola': 'Educação',
      'material escolar': 'Educação',
      'seguro': 'Outros',
      'tarifa': 'Outros',
      'anuidade': 'Outros'
    };
  }

  /**
   * Reads and processes a bank statement file securely (locally only)
   * @param {string} filePath - Path to the bank statement file
   * @returns {Array} Array of processed transactions
   */
  async importBankStatement(filePath) {
    try {
      const fileExtension = path.extname(filePath).toLowerCase();
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`File does not exist: ${filePath}`);
      }
      
      let transactions = [];
      
      if (fileExtension === '.xlsx' || fileExtension === '.xls') {
        transactions = this.processExcelFile(filePath);
      } else if (fileExtension === '.csv') {
        transactions = this.processCsvFile(filePath);
      } else {
        throw new Error(`Unsupported file format: ${fileExtension}. Please use .xlsx, .xls, or .csv`);
      }
      
      // Filter for outgoing transactions (expenses)
      const outgoingTransactions = this.filterOutgoingTransactions(transactions);
      
      // Process and categorize transactions
      const processedTransactions = this.categorizeTransactions(outgoingTransactions);
      
      logger.info(`Successfully processed ${processedTransactions.length} outgoing transactions from ${filePath}`);
      
      return processedTransactions;
    } catch (error) {
      logger.error('Error importing bank statement:', error);
      throw error;
    }
  }

  /**
   * Process Excel/XLSX files containing bank statements
   */
  processExcelFile(filePath) {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON - assuming typical bank statement format
      let jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      // Map common banking columns to our expense format
      const transactions = jsonData.map(row => {
        // Look for common Portuguese banking column names
        const transaction = {};
        
        // Amount field (value)
        const amountKeys = ['valor', 'value', 'amount', 'saldo', 'transação', 'movimento', 'débito', 'saida'];
        for (const key of amountKeys) {
          if (row[key] !== undefined) {
            const amount = this.parseAmount(row[key]);
            if (amount > 0) { // Only positive amounts for outgoing transactions
              transaction.value = amount;
              break;
            }
          }
        }
        
        // Date field
        const dateKeys = ['data', 'date', 'dt', 'movimentação', 'processamento', 'transação'];
        for (const key of dateKeys) {
          if (row[key] !== undefined) {
            transaction.date = this.parseDate(row[key]);
            break;
          }
        }
        
        // Description field
        const descKeys = ['descricao', 'descrição', 'histórico', 'historico', 'transacao', 'natureza', 'documento', 'nome'];
        for (const key of descKeys) {
          if (row[key] !== undefined) {
            transaction.description = String(row[key]).trim();
            break;
          }
        }
        
        return transaction;
      }).filter(t => t.value && t.date); // Only include transactions with value and date
      
      return transactions;
    } catch (error) {
      throw new Error(`Error processing Excel file: ${error.message}`);
    }
  }

  /**
   * Process CSV files containing bank statements
   */
  processCsvFile(filePath) {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      // Simple CSV parsing (could be enhanced with a CSV library if needed)
      const lines = fileContent.split('\n');
      if (lines.length < 2) {
        throw new Error('CSV file is empty or has no data rows');
      }
      
      // Get headers from first line
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      // Process data rows
      const transactions = [];
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        
        const values = lines[i].split(',');
        const row = {};
        headers.forEach((header, index) => {
          if (values[index] !== undefined) {
            row[header] = values[index].trim();
          }
        });
        
        const transaction = {};
        
        // Map fields similar to Excel processing
        const amountKeys = ['valor', 'value', 'amount', 'saldo', 'transação', 'movimento', 'débito', 'saida'];
        for (const key of amountKeys) {
          if (row[key] !== undefined) {
            const amount = this.parseAmount(row[key]);
            if (amount > 0) {
              transaction.value = amount;
              break;
            }
          }
        }
        
        const dateKeys = ['data', 'date', 'dt', 'movimentação', 'processamento', 'transação'];
        for (const key of dateKeys) {
          if (row[key] !== undefined) {
            transaction.date = this.parseDate(row[key]);
            break;
          }
        }
        
        const descKeys = ['descricao', 'descrição', 'histórico', 'historico', 'transacao', 'natureza', 'documento', 'nome'];
        for (const key of descKeys) {
          if (row[key] !== undefined) {
            transaction.description = String(row[key]).trim();
            break;
          }
        }
        
        if (transaction.value && transaction.date) {
          transactions.push(transaction);
        }
      }
      
      return transactions;
    } catch (error) {
      throw new Error(`Error processing CSV file: ${error.message}`);
    }
  }

  /**
   * Parse monetary amounts from various formats
   */
  parseAmount(amountStr) {
    if (typeof amountStr === 'number') {
      return Math.abs(amountStr); // Return absolute value for outgoing transactions
    }
    
    if (typeof amountStr === 'string') {
      // Remove currency symbols and normalize
      let normalized = amountStr.replace(/[R$\s]/g, '').trim();
      
      // Handle negative values (common in bank statements for debits)
      const isNegative = normalized.startsWith('-');
      normalized = normalized.replace(/^-/, '');
      
      // Remove thousands separators and normalize decimal
      normalized = normalized.replace(/\./g, '').replace(',', '.');
      
      const numValue = parseFloat(normalized);
      if (isNaN(numValue)) {
        return 0;
      }
      
      return Math.abs(numValue); // Always return positive for expense value
    }
    
    return 0;
  }

  /**
   * Parse dates from various formats
   */
  parseDate(dateStr) {
    if (dateStr instanceof Date) {
      return dateStr;
    }
    
    if (typeof dateStr === 'string') {
      // Try different common Brazilian date formats
      const formats = [
        /\d{2}\/\d{2}\/\d{4}/, // DD/MM/YYYY
        /\d{4}-\d{2}-\d{2}/,   // YYYY-MM-DD
        /\d{2}-\d{2}-\d{4}/,   // DD-MM-YYYY
      ];
      
      for (const format of formats) {
        if (format.test(dateStr)) {
          // Convert DD/MM/YYYY to YYYY-MM-DD for proper parsing
          if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
              const [day, month, year] = parts;
              return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
            }
          } else if (dateStr.includes('-')) {
            return new Date(dateStr);
          }
        }
      }
    }
    
    // If no known format matches, try default parsing
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return new Date(); // fallback to today
    }
    
    return date;
  }

  /**
   * Filter for outgoing transactions (expenses/debits)
   */
  filterOutgoingTransactions(transactions) {
    // For now, we consider all positive amounts as expenses
    // In a real bank statement, you might have credit/debit indicators
    return transactions.filter(t => t.value > 0);
  }

  /**
   * Categorize transactions based on description
   */
  categorizeTransactions(transactions) {
    return transactions.map(transaction => {
      const description = (transaction.description || '').toLowerCase();
      
      // Try to match against known categories
      let category = 'Outros'; // default category
      
      for (const [keyword, cat] of Object.entries(this.categoryMappings)) {
        if (description.includes(keyword)) {
          category = cat;
          break;
        }
      }
      
      return {
        ...transaction,
        category: category,
        // Add import source information
        source: 'bank_statement_import',
        importedAt: new Date()
      };
    });
  }

  /**
   * Import transactions into the expense system
   */
  async importToExpenseSystem(transactions) {
    const results = {
      imported: 0,
      failed: 0,
      errors: []
    };
    
    for (let i = 0; i < transactions.length; i++) {
      try {
        const transaction = transactions[i];
        
        // Create expense from bank transaction
        const expense = this.expenseService.createExpense({
          value: transaction.value,
          date: transaction.date,
          category: transaction.category,
          description: `${transaction.description} (Importado de extrato bancário)`
        });
        
        logger.info(`Successfully imported transaction: R$ ${expense.value.toFixed(2)} - ${expense.category}`);
        results.imported++;
      } catch (error) {
        logger.error(`Failed to import transaction ${i + 1}:`, error);
        results.errors.push({
          transaction: transactions[i],
          error: error.message
        });
        results.failed++;
      }
    }
    
    return results;
  }

  /**
   * Process a bank statement file and import to the system
   */
  async processAndImport(filePath) {
    logger.info(`Processing bank statement: ${filePath}`);
    
    try {
      // Step 1: Import transactions from file
      const transactions = await this.importBankStatement(filePath);
      
      // Step 2: Import to expense system
      const results = await this.importToExpenseSystem(transactions);
      
      logger.info(`Import completed: ${results.imported} imported, ${results.failed} failed`);
      
      return {
        success: true,
        totalProcessed: transactions.length,
        ...results
      };
    } catch (error) {
      logger.error('Error processing bank statement:', error);
      return {
        success: false,
        error: error.message,
        totalProcessed: 0,
        imported: 0,
        failed: 0,
        errors: [{ error: error.message }]
      };
    }
  }
}

module.exports = SecureBankImporter;