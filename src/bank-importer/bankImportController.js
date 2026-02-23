/**
 * Bank Import Controller
 * Handles bank statement import requests with security measures
 */

const SecureBankImporter = require('./secureBankImporter');
const path = require('path');
const fs = require('fs');

class BankImportController {
  constructor(expenseService) {
    this.secureBankImporter = new SecureBankImporter(expenseService);
  }

  /**
   * Handle bank statement import request
   * @param {string} filePath - Path to the bank statement file
   * @param {Object} options - Import options
   * @returns {Object} Import results
   */
  getSupportedFileTypes() {
    return {
      supportedTypes: ['.xlsx', '.xls', '.csv'],
      maxFileSize: '10MB',
      description: 'Supports Excel and CSV files up to 10MB'
    };
  }

  async handleImport(filePath, options = {}) {
    try {
      // Security validation: only allow specific file extensions
      const allowedExtensions = ['.xlsx', '.xls', '.csv'];
      const fileExtension = path.extname(filePath).toLowerCase();
      
      if (!allowedExtensions.includes(fileExtension)) {
        throw new Error(`File type not allowed: ${fileExtension}. Only ${allowedExtensions.join(', ')} files are permitted.`);
      }
      
      // Security validation: verify file exists and is readable
      if (!fs.existsSync(filePath)) {
        throw new Error(`File does not exist: ${filePath}`);
      }
      
      // Additional security: verify file size is reasonable (less than 100MB)
      const stats = fs.statSync(filePath);
      const maxSize = 100 * 1024 * 1024; // 100 MB in bytes
      if (stats.size > maxSize) {
        throw new Error(`File too large: ${Math.round(stats.size / 1024 / 1024)}MB. Maximum allowed: 100MB`);
      }
      
      // Process the import
      const result = await this.secureBankImporter.processAndImport(filePath);
      
      return {
        success: true,
        message: `Bank statement imported successfully. ${result.imported} transactions processed.`,
        data: result
      };
    } catch (error) {
      const logger = require('../utils/logger');
      logger.error('Bank import error:', error);
      return {
        success: false,
        message: `Import failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Get supported file types for bank statement import
   */
  getSupportedFileTypes() {
    return {
      success: true,
      supportedTypes: ['.xlsx', '.xls', '.csv'],
      maxFileSize: '100MB',
      description: 'Import bank statements from Excel spreadsheets or CSV files. Files are processed locally without external transmission.'
    };
  }

  /**
   * Process multiple bank statements
   */
  async handleMultipleImports(filePaths, options = {}) {
    const results = {
      totalFiles: filePaths.length,
      successfulImports: [],
      failedImports: []
    };

    for (const filePath of filePaths) {
      try {
        const result = await this.handleImport(filePath, options);
        
        if (result.success) {
          results.successfulImports.push({
            filePath,
            result: result.data
          });
        } else {
          results.failedImports.push({
            filePath,
            error: result.message
          });
        }
      } catch (error) {
        results.failedImports.push({
          filePath,
          error: error.message
        });
      }
    }

    return {
      success: results.failedImports.length === 0,
      message: `Processed ${filePaths.length} files: ${results.successfulImports.length} successful, ${results.failedImports.length} failed`,
      data: results
    };
  }
}

module.exports = BankImportController;