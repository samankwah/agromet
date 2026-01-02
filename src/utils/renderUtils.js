/**
 * Utility functions for safely rendering data in React components
 * Prevents "Objects are not valid as a React child" errors
 */

/**
 * Safely renders any value as a string, handling objects, arrays, and null values
 * @param {*} value - The value to render
 * @param {number} maxLength - Maximum length for truncation (optional)
 * @returns {string} - Safe string representation of the value
 */
export const safeRender = (value, maxLength = null) => {
  if (value === null || value === undefined) {
    return '';
  }

  let stringValue;

  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      stringValue = value.length > 0 ? value.join(', ') : '';
    } else {
      // Handle objects
      const keys = Object.keys(value);
      if (keys.length === 0) {
        stringValue = '';
      } else if (keys.length <= 3) {
        // For simple objects, create readable format
        stringValue = keys.map(key => `${key}: ${value[key]}`).join(', ');
      } else {
        // For complex objects, stringify
        stringValue = JSON.stringify(value);
      }
    }
  } else {
    stringValue = String(value);
  }

  // Apply truncation if maxLength is specified
  if (maxLength && stringValue.length > maxLength) {
    return stringValue.substring(0, maxLength) + '...';
  }

  return stringValue;
};

/**
 * Safely renders a value with additional formatting for table cells
 * @param {*} value - The value to render
 * @param {string} type - The type of formatting ('badge', 'text', 'truncated')
 * @param {number} maxLength - Maximum length for truncation
 * @returns {string} - Formatted string representation
 */
export const safeRenderForTable = (value, type = 'text', maxLength = 50) => {
  const safeValue = safeRender(value, maxLength);
  
  switch (type) {
    case 'badge':
      return safeValue || 'N/A';
    case 'truncated':
      return safeValue || '-';
    case 'text':
    default:
      return safeValue || '';
  }
};

/**
 * Safely renders a value for card views with shorter truncation
 * @param {*} value - The value to render
 * @returns {string} - Safe string representation for cards
 */
export const safeRenderForCard = (value) => {
  return safeRender(value, 30);
};

/**
 * Checks if a value is a complex object that should be excluded from display
 * @param {*} value - The value to check
 * @returns {boolean} - True if the value is a complex object that should be hidden
 */
export const isComplexObject = (value) => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  if (Array.isArray(value)) {
    return false; // Arrays are okay to display
  }

  // Check for known problematic object patterns
  const keys = Object.keys(value);
  const problematicKeys = ['filename', 'sheets', 'totalSheets', 'totalRecords', 'fileData', 'metadata'];
  
  return problematicKeys.some(key => keys.includes(key));
};

/**
 * Filters out complex objects from data items
 * @param {Object} item - The data item to clean
 * @returns {Object} - Cleaned data item
 */
export const cleanDataItem = (item) => {
  if (!item || typeof item !== 'object') {
    return item;
  }

  const cleanedItem = {};
  
  for (const [key, value] of Object.entries(item)) {
    // Skip known problematic keys
    if (['fileData', 'metadata', 'sheets', 'processingResult'].includes(key)) {
      continue;
    }
    
    // Skip complex objects
    if (isComplexObject(value)) {
      continue;
    }
    
    cleanedItem[key] = value;
  }
  
  return cleanedItem;
};