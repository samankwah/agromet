// Custom hook for agricultural data management
import { useState, useEffect, useCallback } from 'react';
import userService from '../services/userService';
import { logger } from '../utils/logger';

export const useAgriculturalData = (dataType) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    if (!dataType) return;

    try {
      setLoading(true);
      setError(null);
      
      logger.apiCall('GET', `agricultural-data/${dataType}`);
      const result = await userService.getAgriculturalData(dataType);
      
      if (result.success) {
        setData(result.data || []);
        logger.info('Agricultural data loaded', { 
          dataType, 
          recordCount: result.data?.length || 0 
        });
      } else {
        const errorMsg = result.error || 'Failed to load data';
        setError(errorMsg);
        logger.error('Failed to load agricultural data', { dataType, error: errorMsg });
      }
    } catch (err) {
      const errorMsg = err.message || 'An error occurred while loading data';
      setError(errorMsg);
      logger.error('Error loading agricultural data', { dataType, error: err.message });
    } finally {
      setLoading(false);
    }
  }, [dataType]);

  const refreshData = useCallback(() => {
    logger.userAction('Data refresh requested', { dataType });
    loadData();
  }, [loadData]);

  const deleteItem = useCallback(async (id) => {
    try {
      logger.userAction('Delete item requested', { dataType, id });
      const result = await userService.deleteAgriculturalData(dataType, id);
      
      if (result.success) {
        setData(prev => prev.filter(item => item.id !== id));
        logger.info('Item deleted successfully', { dataType, id });
        return { success: true };
      } else {
        const errorMsg = result.error || 'Failed to delete item';
        logger.error('Failed to delete item', { dataType, id, error: errorMsg });
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      const errorMsg = err.message || 'Error deleting item';
      logger.error('Error deleting item', { dataType, id, error: err.message });
      return { success: false, error: errorMsg };
    }
  }, [dataType]);

  const uploadData = useCallback(async (formData, progressCallback) => {
    try {
      logger.userAction('Upload data requested', { dataType });
      const result = await userService.uploadAgriculturalData(
        formData, 
        dataType, 
        progressCallback
      );
      
      if (result.success) {
        logger.info('Upload successful', { dataType, result: result.data });
        // Refresh data after successful upload
        await loadData();
        return { success: true, data: result.data };
      } else {
        const errorMsg = result.error || 'Upload failed';
        logger.error('Upload failed', { dataType, error: errorMsg });
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      const errorMsg = err.message || 'Error during upload';
      logger.error('Error during upload', { dataType, error: err.message });
      return { success: false, error: errorMsg };
    }
  }, [dataType, loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    refreshData,
    deleteItem,
    uploadData,
    setData // For optimistic updates
  };
};