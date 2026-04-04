// Custom hook for form validation
import { useState, useCallback, useMemo } from 'react';
import { logger } from '../utils/logger';

export const useFormValidation = (validationRules, initialValues = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = useCallback((fieldName, value) => {
    const rules = validationRules[fieldName];
    if (!rules) return null;

    for (const rule of rules) {
      const error = rule(value, values);
      if (error) {
        return error;
      }
    }
    return null;
  }, [validationRules, values]);

  const validateForm = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach(fieldName => {
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    
    logger.debug('Form validation completed', { 
      isValid, 
      errorCount: Object.keys(newErrors).length,
      fields: Object.keys(validationRules)
    });

    return isValid;
  }, [validationRules, values, validateField]);

  const handleChange = useCallback((fieldName, value) => {
    setValues(prev => ({ ...prev, [fieldName]: value }));
    
    // Clear error when field is updated
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: null }));
    }

    // Validate field if it has been touched
    if (touched[fieldName]) {
      const fieldError = validateField(fieldName, value);
      setErrors(prev => ({ ...prev, [fieldName]: fieldError }));
    }

    logger.debug('Form field changed', { fieldName, hasError: !!errors[fieldName] });
  }, [errors, touched, validateField]);

  const handleBlur = useCallback((fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    
    const error = validateField(fieldName, values[fieldName]);
    setErrors(prev => ({ ...prev, [fieldName]: error }));
  }, [validateField, values]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    logger.debug('Form reset');
  }, [initialValues]);

  const setFieldValue = useCallback((fieldName, value) => {
    setValues(prev => ({ ...prev, [fieldName]: value }));
  }, []);

  const setFieldError = useCallback((fieldName, error) => {
    setErrors(prev => ({ ...prev, [fieldName]: error }));
  }, []);

  // Computed properties
  const isValid = useMemo(() => {
    return Object.values(errors).every(error => !error);
  }, [errors]);

  const hasErrors = useMemo(() => {
    return Object.values(errors).some(error => !!error);
  }, [errors]);

  const touchedFields = useMemo(() => {
    return Object.keys(touched).filter(key => touched[key]);
  }, [touched]);

  return {
    values,
    errors,
    touched,
    isValid,
    hasErrors,
    touchedFields,
    handleChange,
    handleBlur,
    validateForm,
    resetForm,
    setFieldValue,
    setFieldError,
    validateField
  };
};

// Common validation rules
export const validationRules = {
  required: (value) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return 'This field is required';
    }
    return null;
  },

  email: (value) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  },

  minLength: (min) => (value) => {
    if (value && value.length < min) {
      return `Must be at least ${min} characters long`;
    }
    return null;
  },

  maxLength: (max) => (value) => {
    if (value && value.length > max) {
      return `Must be no more than ${max} characters long`;
    }
    return null;
  },

  fileRequired: (value) => {
    if (!value || !value.name) {
      return 'Please select a file';
    }
    return null;
  },

  regionRequired: (value) => {
    if (!value) {
      return 'Please select a region';
    }
    return null;
  },

  districtRequired: (value, allValues) => {
    if (allValues.regionCode && !value) {
      return 'Please select a district';
    }
    return null;
  },

  commodityRequired: (value) => {
    if (!value) {
      return 'Please select a commodity';
    }
    return null;
  }
};