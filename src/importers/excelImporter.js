const XLSX = require('xlsx');
const ExpenseService = require('../services/expenseService');
const Expense = require('../models/Expense');

class ExcelImporter {
  constructor(expenseService) {
    this.expenseService = expenseService || new ExpenseService();
  }

  /**
   * Reads an Excel file and converts it to an array of objects
   * @param {string} filePath - Path to the Excel file
   * @returns {Array} Array of objects representing the rows in the Excel file
   */
  readExcelFile(filePath) {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0]; // Use the first sheet
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      console.log(`Successfully read Excel file: ${filePath}`);
      console.log(`Found ${jsonData.length} rows in the spreadsheet`);
      
      return jsonData;
    } catch (error) {
      console.error(`Error reading Excel file ${filePath}:`, error.message);
      throw error;
    }
  }

  /**
   * Maps Excel row data to expense attributes based on common column names
   * @param {Object} rowData - Row data from Excel
   * @param {string} fileName - Name of the Excel file being processed
   * @returns {Object} Mapped expense data
   */
  mapRowToExpense(rowData, fileName = '') {
    // Look for common variations of column names
    const expenseData = {};
    
    // Identify the file type based on name
    const isCaixinhaFile = fileName.toLowerCase().includes('caixinha');
    const isMercadoFile = fileName.toLowerCase().includes('mercado');
    
    // Value mapping (amount, valor, total, price, cost, etc.)
    let valueKeys = ['valor', 'value', 'amount', 'total', 'preco', 'preço', 'custo', 'cost', 'price', 'Total', '__EMPTY_6'];
    
    // For Mercado file, use specific column names
    if (isMercadoFile) {
      valueKeys = ['__EMPTY_6', 'Preco Un.', 'Total', 'preco', 'preço', 'valor', 'value', 'amount', 'total', 'custo', 'cost', 'price'];
    }
    
    for (const key of valueKeys) {
      if (rowData[key] !== undefined && rowData[key] !== null) {
        const value = parseFloat(rowData[key]);
        if (!isNaN(value) && value > 0) { // Ensure positive value
          expenseData.value = value;
          break;
        }
      }
    }
    
    // Date mapping (data, date, dia, etc.)
    let dateKeys = ['data', 'date', 'dia', 'day', 'dt', 'dat'];
    
    // For Mercado file, we might not have explicit dates, so we'll use today
    if (isMercadoFile) {
      // Use today's date for Mercado file
      expenseData.date = new Date();
    } else {
      for (const key of dateKeys) {
        if (rowData[key] !== undefined && rowData[key] !== null) {
          try {
            // Handle both string dates and Excel serial date numbers
            if (typeof rowData[key] === 'number') {
              // Excel serial date - convert to JS Date
              expenseData.date = new Date(Math.round((rowData[key] - 25569) * 86400 * 1000));
            } else {
              expenseData.date = new Date(rowData[key]);
            }
            
            if (!isNaN(expenseData.date.getTime())) {
              break;
            }
          } catch (e) {
            console.warn(`Could not parse date from column '${key}': ${rowData[key]}`);
          }
        }
      }
    }
    
    // If no date was found, use today's date
    if (!expenseData.date) {
      expenseData.date = new Date();
    }
    
    // Category mapping (categoria, category, tipo, type, etc.)
    let categoryKeys = ['categoria', 'category', 'tipo', 'type', 'classificacao', 'classificação', 'grupo', 'group'];
    
    // For Caixinha file, use specific column names
    if (isCaixinhaFile) {
      categoryKeys = ['gastos_categoria', 'gastos_subcategoria', 'dividas', 'moradores', 'categoria', 'category', 'tipo', 'type', 'classificacao', 'classificação', 'grupo', 'group'];
    } else if (isMercadoFile) {
      categoryKeys = ['Produto', 'produto', 'Marca', 'marca', 'categoria', 'category', 'tipo', 'type', 'classificacao', 'classificação', 'grupo', 'group'];
    }
    
    for (const key of categoryKeys) {
      if (rowData[key] !== undefined && rowData[key] !== null) {
        expenseData.category = String(rowData[key]).trim();
        if (expenseData.category) break;
      }
    }
    
    // Description mapping (descricao, description, obs, observacao, etc.)
    let descriptionKeys = ['descricao', 'description', 'desc', 'observacao', 'observação', 'obs', 'comentario', 'comentário', 'comment', 'detalhe', 'details'];
    
    // For Mercado file, combine product info for description
    if (isMercadoFile) {
      const produto = rowData['Produto'] || rowData['produto'];
      const marca = rowData['__EMPTY'] || rowData['Marca'] || rowData['marca'];
      const medida = rowData['__EMPTY_1'] || rowData['Medida'];
      
      if (produto) {
        let descParts = [produto];
        if (marca) descParts.push(marca);
        if (medida) descParts.push(medida);
        expenseData.description = descParts.join(' - ');
      }
    } else {
      for (const key of descriptionKeys) {
        if (rowData[key] !== undefined && rowData[key] !== null) {
          expenseData.description = String(rowData[key]).trim();
          if (expenseData.description) break;
        }
      }
    }
    
    // If no category was found, assign a default category
    if (!expenseData.category) {
      if (isCaixinhaFile) {
        expenseData.category = 'Caixinha';
      } else if (isMercadoFile) {
        expenseData.category = 'Mercado';
      } else {
        expenseData.category = 'Importado';
      }
    }
    
    // If no description was found, create one from available data
    if (!expenseData.description) {
      if (isCaixinhaFile) {
        expenseData.description = `Despesa de caixinha: ${expenseData.category}`;
      } else if (isMercadoFile) {
        expenseData.description = `Compra de mercado: ${expenseData.category}`;
      } else {
        expenseData.description = 'Despesa importada de planilha';
      }
    }
    
    return expenseData;
  }

  /**
   * Imports expenses from Excel file
   * @param {string} filePath - Path to the Excel file
   * @param {Object} options - Import options
   * @returns {Object} Import result with statistics
   */
  async importFromExcel(filePath, options = {}) {
    console.log(`Starting import from Excel file: ${filePath}`);
    
    const startTime = Date.now();
    const result = {
      imported: 0,
      failed: 0,
      errors: [],
      totalRows: 0
    };
    
    try {
      // Read the Excel file
      const excelData = this.readExcelFile(filePath);
      result.totalRows = excelData.length;
      
      // Process each row
      for (let i = 0; i < excelData.length; i++) {
        const rowData = excelData[i];
        
        try {
          // Map the row to expense data
          const mappedData = this.mapRowToExpense(rowData, filePath);
          
          // Validate that we have the minimum required data
          if (!mappedData.value || !mappedData.date || !mappedData.category) {
            console.warn(`Row ${i + 1} missing required fields, skipping:`, mappedData);
            result.errors.push({
              row: i + 1,
              error: 'Missing required fields (value, date, or category)',
              data: mappedData
            });
            result.failed++;
            continue;
          }
          
          // Create the expense
          const expense = await this.createExpenseWithRetry(mappedData, 3);
          
          console.log(`Successfully imported expense #${expense.id}: R$ ${expense.value.toFixed(2)} - ${expense.category}`);
          result.imported++;
          
        } catch (error) {
          console.error(`Failed to import row ${i + 1}:`, error.message);
          result.errors.push({
            row: i + 1,
            error: error.message,
            data: rowData
          });
          result.failed++;
        }
      }
      
      const endTime = Date.now();
      console.log(`Import completed in ${(endTime - startTime) / 1000} seconds`);
      console.log(`Imported: ${result.imported}, Failed: ${result.failed}, Total: ${result.totalRows}`);
      
      return result;
      
    } catch (error) {
      console.error('Critical error during Excel import:', error);
      throw error;
    }
  }

  /**
   * Creates an expense with retry logic in case of temporary failures
   * @param {Object} expenseData - Expense data to create
   * @param {number} maxRetries - Maximum number of retry attempts
   * @returns {Promise<Expense>} Created expense
   */
  async createExpenseWithRetry(expenseData, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt} to create expense: R$ ${expenseData.value} - ${expenseData.category}`);
        
        const expense = this.expenseService.createExpense(expenseData);
        return expense;
        
      } catch (error) {
        lastError = error;
        console.warn(`Attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxRetries) {
          // Wait a bit before retrying (exponential backoff)
          const delay = Math.pow(2, attempt) * 100; // 200ms, 400ms, 800ms
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Gets all expenses from the service
   * @returns {Array} Array of all expenses
   */
  getAllExpenses() {
    return this.expenseService.getAllExpenses();
  }

  /**
   * Gets import statistics
   * @returns {Object} Statistics about imported expenses
   */
  getStatistics() {
    const allExpenses = this.getAllExpenses();
    
    const stats = {
      totalExpenses: allExpenses.length,
      totalValue: allExpenses.reduce((sum, expense) => sum + expense.value, 0),
      byCategory: {},
      byDate: {}
    };
    
    // Group by category
    allExpenses.forEach(expense => {
      const category = expense.category;
      if (!stats.byCategory[category]) {
        stats.byCategory[category] = { count: 0, totalValue: 0 };
      }
      stats.byCategory[category].count++;
      stats.byCategory[category].totalValue += expense.value;
    });
    
    // Group by date (YYYY-MM-DD format)
    allExpenses.forEach(expense => {
      const dateStr = expense.date.toISOString().split('T')[0];
      if (!stats.byDate[dateStr]) {
        stats.byDate[dateStr] = { count: 0, totalValue: 0 };
      }
      stats.byDate[dateStr].count++;
      stats.byDate[dateStr].totalValue += expense.value;
    });
    
    return stats;
  }
}

module.exports = ExcelImporter;