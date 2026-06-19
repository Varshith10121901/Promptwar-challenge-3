/**
 * Simple structured logger for application events.
 */
const env = require('../config/env');

const log = (level, message, meta = {}) => {
  if (env.NODE_ENV === 'test' && level === 'info') {
    return; // Mute standard logs during tests unless they are warnings/errors
  }
  
  const timestamp = new Date().toISOString();
  const output = {
    timestamp,
    level,
    message,
    ...meta
  };
  
  if (level === 'error') {
    console.error(JSON.stringify(output));
  } else if (level === 'warn') {
    console.warn(JSON.stringify(output));
  } else {
    console.log(JSON.stringify(output));
  }
};

module.exports = {
  info: (msg, meta) => log('info', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  error: (msg, meta) => log('error', msg, meta)
};
