const ExcelImporter = require('../importers/excelImporter');
const path = require('path');

class ExcelController {
  constructor(expenseService) {
    this.excelImporter = new ExcelImporter(expenseService);
  }

  /**
   * Handles importing expenses from Excel file
   * @param {string} filePath - Path to the Excel file
   * @returns {Object} Import result
   */
  async importExpensesFromExcel(filePath) {
    try {
      // Validate file path
      if (!filePath) {
        throw new Error('File path is required for Excel import');
      }

      // Check if file exists and has valid extension
      const lowerPath = filePath.toLowerCase();
      if (!lowerPath.endsWith('.xlsx') && !lowerPath.endsWith('.xls')) {
        throw new Error('File must be an Excel file (.xlsx or .xls)');
      }

      console.log(`Initiating Excel import from: ${filePath}`);
      
      // Perform the import
      const result = await this.excelImporter.importFromExcel(filePath);
      
      return {
        success: true,
        message: `Successfully processed ${result.totalRows} rows. Imported: ${result.imported}, Failed: ${result.failed}`,
        data: result
      };
    } catch (error) {
      console.error('Error in Excel import controller:', error);
      return {
        success: false,
        message: `Error importing Excel file: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Gets statistics about imported expenses
   * @returns {Object} Statistics about expenses
   */
  getExpenseStatistics() {
    try {
      const stats = this.excelImporter.getStatistics();
      
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('Error getting expense statistics:', error);
      return {
        success: false,
        message: `Error retrieving statistics: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Gets all expenses
   * @returns {Array} Array of all expenses
   */
  getAllExpenses() {
    try {
      const expenses = this.excelImporter.getAllExpenses();
      
      return {
        success: true,
        data: expenses,
        count: expenses.length
      };
    } catch (error) {
      console.error('Error getting all expenses:', error);
      return {
        success: false,
        message: `Error retrieving expenses: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Lists Excel files in a directory
   * @param {string} directoryPath - Directory to scan for Excel files
   * @returns {Array} Array of Excel file paths
   */
  listExcelFiles(directoryPath = '.') {
    try {
      const fs = require('fs');
      const resolvedPath = path.resolve(directoryPath);
      
      const files = fs.readdirSync(resolvedPath);
      const excelFiles = files.filter(file => {
        const lowerFile = file.toLowerCase();
        return lowerFile.endsWith('.xlsx') || lowerFile.endsWith('.xls');
      }).map(file => path.join(resolvedPath, file));
      
      return {
        success: true,
        data: excelFiles,
        count: excelFiles.length,
        directory: resolvedPath
      };
    } catch (error) {
      console.error('Error listing Excel files:', error);
      return {
        success: false,
        message: `Error listing Excel files: ${error.message}`,
        error: error.message
      };
    }
  }
}

module.exports = ExcelController;