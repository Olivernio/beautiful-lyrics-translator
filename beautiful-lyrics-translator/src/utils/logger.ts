const LOG_PREFIX = '[BeautifulLyrics Translator]';

export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`${LOG_PREFIX} ℹ️`, message, ...args);
  },
  
  success: (message: string, ...args: any[]) => {
    console.log(`${LOG_PREFIX} ✅`, message, ...args);
  },
  
  warn: (message: string, ...args: any[]) => {
    console.warn(`${LOG_PREFIX} ⚠️`, message, ...args);
  },
  
  error: (message: string, ...args: any[]) => {
    console.error(`${LOG_PREFIX} ❌`, message, ...args);
  },
  
  debug: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`${LOG_PREFIX} 🐛`, message, ...args);
    }
  }
};
