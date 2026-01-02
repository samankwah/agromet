// File validation utilities for secure file uploads
import { logger } from './logger';

export const FILE_CONSTRAINTS = {
  // File size limits (in bytes)
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  MIN_FILE_SIZE: 1024, // 1KB
  
  // Allowed file types
  ALLOWED_EXCEL_TYPES: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv' // .csv
  ],
  
  ALLOWED_EXTENSIONS: ['.xlsx', '.xls', '.csv'],
  
  // File name constraints
  MAX_FILENAME_LENGTH: 100,
  FORBIDDEN_CHARS: /[<>:"/\\|?*]/g
};

export class FileValidationError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'FileValidationError';
    this.code = code;
  }
}

export const validateFile = (file, options = {}) => {
  const constraints = { ...FILE_CONSTRAINTS, ...options };
  
  try {
    // Check if file exists
    if (!file) {
      throw new FileValidationError('No file provided', 'NO_FILE');
    }

    // Check file size
    if (file.size > constraints.MAX_FILE_SIZE) {
      const maxMB = Math.round(constraints.MAX_FILE_SIZE / (1024 * 1024));
      throw new FileValidationError(
        `File size exceeds ${maxMB}MB limit. Current size: ${Math.round(file.size / (1024 * 1024))}MB`,
        'FILE_TOO_LARGE'
      );
    }

    if (file.size < constraints.MIN_FILE_SIZE) {
      throw new FileValidationError(
        'File is too small. Minimum size is 1KB',
        'FILE_TOO_SMALL'
      );
    }

    // Check file type
    if (!constraints.ALLOWED_EXCEL_TYPES.includes(file.type)) {
      throw new FileValidationError(
        `Invalid file type. Allowed types: ${constraints.ALLOWED_EXTENSIONS.join(', ')}`,
        'INVALID_FILE_TYPE'
      );
    }

    // Check file extension
    const fileExtension = getFileExtension(file.name);
    if (!constraints.ALLOWED_EXTENSIONS.includes(fileExtension)) {
      throw new FileValidationError(
        `Invalid file extension. Allowed extensions: ${constraints.ALLOWED_EXTENSIONS.join(', ')}`,
        'INVALID_EXTENSION'
      );
    }

    // Check filename length
    if (file.name.length > constraints.MAX_FILENAME_LENGTH) {
      throw new FileValidationError(
        `Filename is too long. Maximum length: ${constraints.MAX_FILENAME_LENGTH} characters`,
        'FILENAME_TOO_LONG'
      );
    }

    // Check for forbidden characters in filename
    if (constraints.FORBIDDEN_CHARS.test(file.name)) {
      throw new FileValidationError(
        'Filename contains forbidden characters',
        'FORBIDDEN_CHARS'
      );
    }

    // All validations passed
    logger.info('File validation passed', {
      filename: file.name,
      size: file.size,
      type: file.type
    });

    return {
      valid: true,
      file: file,
      size: file.size,
      sizeFormatted: formatFileSize(file.size),
      type: file.type,
      extension: fileExtension
    };

  } catch (error) {
    logger.error('File validation failed', error);
    
    if (error instanceof FileValidationError) {
      throw error;
    }
    
    throw new FileValidationError(
      'Unknown file validation error',
      'UNKNOWN_ERROR'
    );
  }
};

export const getFileExtension = (filename) => {
  return filename.toLowerCase().substring(filename.lastIndexOf('.'));
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const sanitizeFileName = (filename) => {
  // Remove forbidden characters and normalize
  return filename
    .replace(FILE_CONSTRAINTS.FORBIDDEN_CHARS, '_')
    .replace(/\s+/g, '_')
    .toLowerCase()
    .substring(0, FILE_CONSTRAINTS.MAX_FILENAME_LENGTH);
};

// Excel-specific validation
export const validateExcelFile = async (file) => {
  const validation = validateFile(file);
  
  if (!validation.valid) {
    return validation;
  }

  try {
    // Additional Excel-specific checks
    const buffer = await file.arrayBuffer();
    
    // Check if it's a valid Excel file by reading the header
    const uint8Array = new Uint8Array(buffer);
    
    // Excel files start with specific byte signatures
    const isValidExcel = 
      // XLSX files (ZIP-based)
      (uint8Array[0] === 0x50 && uint8Array[1] === 0x4B) ||
      // XLS files
      (uint8Array[0] === 0xD0 && uint8Array[1] === 0xCF) ||
      // CSV files (text-based)
      validation.extension === '.csv';

    if (!isValidExcel) {
      throw new FileValidationError(
        'File appears to be corrupted or not a valid Excel file',
        'INVALID_EXCEL_FORMAT'
      );
    }

    logger.info('Excel file validation passed', {
      filename: file.name,
      isValidExcel
    });

    return {
      ...validation,
      isValidExcel: true,
      buffer: buffer
    };

  } catch (error) {
    logger.error('Excel file validation failed', error);
    
    if (error instanceof FileValidationError) {
      throw error;
    }
    
    throw new FileValidationError(
      'Failed to validate Excel file format',
      'EXCEL_VALIDATION_ERROR'
    );
  }
};

export default {
  validateFile,
  validateExcelFile,
  formatFileSize,
  sanitizeFileName,
  FileValidationError,
  FILE_CONSTRAINTS
};