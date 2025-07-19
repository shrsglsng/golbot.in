import fs from 'fs';
import path from 'path';

// Logger utility for better debugging and monitoring
class Logger {
  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaString = Object.keys(meta).length > 0 ? ` | Meta: ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaString}`;
  }

  writeToFile(level, formattedMessage) {
    const today = new Date().toISOString().split('T')[0];
    const logFile = path.join(this.logDir, `${today}.log`);
    
    fs.appendFileSync(logFile, formattedMessage + '\n');
  }

  log(level, message, meta = {}) {
    const formattedMessage = this.formatMessage(level, message, meta);
    
    // Console output with colors
    switch (level) {
      case 'error':
        console.error('\x1b[31m%s\x1b[0m', formattedMessage); // Red
        break;
      case 'warn':
        console.warn('\x1b[33m%s\x1b[0m', formattedMessage); // Yellow
        break;
      case 'info':
        console.info('\x1b[36m%s\x1b[0m', formattedMessage); // Cyan
        break;
      case 'debug':
        if (process.env.NODE_ENV === 'development') {
          console.log('\x1b[35m%s\x1b[0m', formattedMessage); // Magenta
        }
        break;
      default:
        console.log(formattedMessage);
    }

    // Write to file in production or when LOG_TO_FILE is true
    if (process.env.NODE_ENV === 'production' || process.env.LOG_TO_FILE === 'true') {
      this.writeToFile(level, formattedMessage);
    }
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }

  // Request logging middleware
  requestMiddleware() {
    return (req, res, next) => {
      const start = Date.now();
      const { method, url, ip, headers } = req;
      
      // Log incoming request
      this.info(`${method} ${url}`, {
        ip,
        userAgent: headers['user-agent'],
        contentType: headers['content-type'],
        userId: req.user?.uid || 'anonymous'
      });

      // Override res.end to log response
      const originalEnd = res.end;
      res.end = function(chunk, encoding) {
        const duration = Date.now() - start;
        const { statusCode } = res;
        
        logger.info(`${method} ${url} - ${statusCode}`, {
          duration: `${duration}ms`,
          contentLength: res.get('content-length') || 0
        });

        originalEnd.call(this, chunk, encoding);
      };

      next();
    };
  }

  // Database operation logger
  dbLog(operation, collection, query = {}, result = null, error = null) {
    if (error) {
      this.error(`DB ${operation} failed on ${collection}`, {
        query,
        error: error.message,
        stack: error.stack
      });
    } else {
      let resultCount = 0;
      if (Array.isArray(result)) {
        resultCount = result.length;
      } else if (result) {
        resultCount = 1;
      }
      
      this.debug(`DB ${operation} on ${collection}`, {
        query,
        resultCount
      });
    }
  }

  // API call logger
  apiLog(method, url, status, duration, error = null) {
    if (error) {
      this.error(`External API call failed: ${method} ${url}`, {
        status,
        duration,
        error: error.message
      });
    } else {
      this.info(`External API call: ${method} ${url}`, {
        status,
        duration
      });
    }
  }
}

// Create singleton instance
const logger = new Logger();

export default logger;
