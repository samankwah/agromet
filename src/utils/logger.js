// Centralized logging utility for TriAgro AI
// Replaces console.log statements with proper logging

const isDevelopment = import.meta.env.MODE === 'development';

class Logger {
  constructor() {
    this.isDev = isDevelopment;
  }

  info(message, data = null) {
    if (this.isDev) {
      if (data) {
        console.log(`[INFO] ${message}`, data);
      } else {
        console.log(`[INFO] ${message}`);
      }
    }
  }

  error(message, error = null) {
    if (error) {
      console.error(`[ERROR] ${message}`, error);
    } else {
      console.error(`[ERROR] ${message}`);
    }
  }

  warn(message, data = null) {
    if (this.isDev) {
      if (data) {
        console.warn(`[WARN] ${message}`, data);
      } else {
        console.warn(`[WARN] ${message}`);
      }
    }
  }

  debug(message, data = null) {
    if (this.isDev) {
      if (data) {
        console.debug(`[DEBUG] ${message}`, data);
      } else {
        console.debug(`[DEBUG] ${message}`);
      }
    }
  }

  // Performance logging
  time(label) {
    if (this.isDev) {
      console.time(`[PERF] ${label}`);
    }
  }

  timeEnd(label) {
    if (this.isDev) {
      console.timeEnd(`[PERF] ${label}`);
    }
  }

  // API request logging
  apiCall(method, url, data = null) {
    if (this.isDev) {
      if (data) {
        console.log(`[API] ${method.toUpperCase()} ${url}`, data);
      } else {
        console.log(`[API] ${method.toUpperCase()} ${url}`);
      }
    }
  }

  // User action logging
  userAction(action, context = null) {
    if (this.isDev) {
      if (context) {
        console.log(`[USER] ${action}`, context);
      } else {
        console.log(`[USER] ${action}`);
      }
    }
  }
}

export const logger = new Logger();
export default logger;