/**
 * Safe Select Options Component
 * 
 * A bulletproof component for rendering select options that prevents
 * "Objects are not valid as a React child" errors by automatically
 * detecting and handling different data structures.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { normalizeDistrictData, detectDataStructure, RegionDistrictError } from '../../utils/regionDistrictHelpers';

/**
 * Error Boundary for Safe Select Options
 */
class SafeSelectErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('SafeSelectOptions Error:', error, errorInfo);
    
    // Log to external service in production
    if (process.env.NODE_ENV === 'production' && window.analytics) {
      window.analytics.track('SafeSelectOptions Error', {
        error: error.message,
        componentStack: errorInfo.componentStack,
        timestamp: Date.now()
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <option value="" disabled style={{ color: 'red' }}>
          ⚠️ Error loading options
        </option>
      );
    }

    return this.props.children;
  }
}

/**
 * Safe Select Options Component
 */
export const SafeSelectOptions = ({ 
  data = [], 
  placeholder = "Select an option...",
  valueField = 'auto',
  displayField = 'auto',
  keyField = 'auto',
  includeEmpty = true,
  emptyValue = "",
  onDataError = null,
  debugMode = process.env.NODE_ENV === 'development'
}) => {
  
  // Validate input data
  if (!Array.isArray(data)) {
    const error = new RegionDistrictError('Data must be an array', { data, type: typeof data });
    
    if (onDataError) {
      onDataError(error);
    } else {
      console.error('SafeSelectOptions:', error.message, error.data);
    }
    
    return includeEmpty ? (
      <option value={emptyValue}>{placeholder}</option>
    ) : null;
  }

  if (data.length === 0) {
    return includeEmpty ? (
      <option value={emptyValue}>{placeholder}</option>
    ) : null;
  }

  // Normalize data to consistent format
  const normalizedData = data.map((item, index) => {
    try {
      // Handle different data types
      if (typeof item === 'string') {
        return {
          key: `string-${index}-${item}`,
          value: item,
          display: item,
          original: item,
          type: 'string'
        };
      }
      
      if (typeof item === 'object' && item !== null) {
        const normalized = normalizeDistrictData(item);
        return {
          key: `object-${index}-${normalized.code}`,
          value: valueField === 'auto' ? normalized.name : item[valueField],
          display: displayField === 'auto' ? normalized.display : item[displayField],
          original: item,
          type: 'object',
          normalized
        };
      }
      
      // Handle unexpected data types
      return {
        key: `unknown-${index}`,
        value: String(item),
        display: `Unknown: ${String(item)}`,
        original: item,
        type: 'unknown'
      };
      
    } catch (error) {
      console.error('Error normalizing item:', item, error);
      return {
        key: `error-${index}`,
        value: `error-${index}`,
        display: '❌ Invalid option',
        original: item,
        type: 'error',
        error: error.message
      };
    }
  });

  // Debug logging
  if (debugMode && normalizedData.length > 0) {
    console.log('SafeSelectOptions Debug:', {
      originalData: data,
      normalizedData: normalizedData,
      dataTypes: normalizedData.map(item => item.type),
      fieldMapping: { valueField, displayField, keyField }
    });
  }

  return (
    <SafeSelectErrorBoundary>
      {includeEmpty && (
        <option value={emptyValue}>{placeholder}</option>
      )}
      
      {normalizedData.map((item) => (
        <option 
          key={item.key}
          value={item.value}
          title={debugMode ? `Type: ${item.type}` : undefined}
          className={item.type === 'error' ? 'error-option' : undefined}
        >
          {item.display}
        </option>
      ))}
    </SafeSelectErrorBoundary>
  );
};

SafeSelectOptions.propTypes = {
  data: PropTypes.array,
  placeholder: PropTypes.string,
  valueField: PropTypes.string,
  displayField: PropTypes.string,
  keyField: PropTypes.string,
  includeEmpty: PropTypes.bool,
  emptyValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onDataError: PropTypes.func,
  debugMode: PropTypes.bool
};

/**
 * Specialized component for Region Options
 */
export const SafeRegionOptions = ({ regions, ...props }) => {
  return (
    <SafeSelectOptions
      data={regions}
      placeholder="Select Region..."
      valueField="name"
      displayField="display"
      {...props}
    />
  );
};

SafeRegionOptions.propTypes = {
  regions: PropTypes.array.isRequired
};

/**
 * Specialized component for District Options
 */
export const SafeDistrictOptions = ({ districts, ...props }) => {
  return (
    <SafeSelectOptions
      data={districts}
      placeholder="Select District..."
      valueField="name"
      displayField="display"
      {...props}
    />
  );
};

SafeDistrictOptions.propTypes = {
  districts: PropTypes.array.isRequired
};

/**
 * Hook for safe option rendering with error handling
 */
export const useSafeSelectOptions = (data, options = {}) => {
  const [error, setError] = React.useState(null);
  const [normalizedData, setNormalizedData] = React.useState([]);
  
  React.useEffect(() => {
    try {
      if (!Array.isArray(data)) {
        throw new RegionDistrictError('Data must be an array');
      }
      
      const normalized = data.map(item => normalizeDistrictData(item));
      setNormalizedData(normalized);
      setError(null);
      
    } catch (err) {
      setError(err);
      setNormalizedData([]);
    }
  }, [data]);
  
  return {
    normalizedData,
    error,
    hasError: !!error,
    isEmpty: normalizedData.length === 0
  };
};

export default SafeSelectOptions;