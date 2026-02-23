/**
 * Logger utility for Finance Master
 * Provides centralized logging for errors and events
 */

const fs = require('fs');
const path = require('path');

class Logger {
  constructor(logLevel = 'info') {
    this.logLevel = logLevel;
    this.logDir = path.join(__dirname, 'logs');
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
    
    this.logLevels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
  }

  /**
   * Logs a message with specified level
   * @param {string} level - Log level (error, warn, info, debug)
   * @param {string} message - Message to log
   * @param {object} meta - Additional metadata
   */
  log(level, message, meta = {}) {
    if (this.logLevels[level] > this.logLevels[this.logLevel]) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...meta
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    
    // Write to file
    const logFilePath = path.join(this.logDir, `${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFileSync(logFilePath, logLine);
    
    // Also output to console for development
    console.log(`[${level.toUpperCase()}] ${timestamp} - ${message}`, meta);
  }

  /**
   * Log error message
   * @param {string} message - Error message
   * @param {Error} error - Error object
   */
  error(message, error = null) {
    const meta = error ? { 
      errorMessage: error.message, 
      errorStack: error.stack,
      ...(error.code && { errorCode: error.code })
    } : {};
    
    this.log('error', message, meta);
  }

  /**
   * Log warning message
   * @param {string} message - Warning message
   */
  warn(message) {
    this.log('warn', message);
  }

  /**
   * Log info message
   * @param {string} message - Info message
   */
  info(message) {
    this.log('info', message);
  }

  /**
   * Log debug message
   * @param {string} message - Debug message
   */
  debug(message) {
    this.log('debug', message);
  }

  /**
   * Log HTTP request
   * @param {object} req - Request object
   * @param {object} res - Response object
   * @param {function} next - Next middleware function
   */
  logRequest(req, res, next) {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      this.info('HTTP Request', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress
      });
    });
    
    next();
  }
}

// Create singleton instance
const logger = new Logger(process.env.LOG_LEVEL || 'info');

module.exports = logger;