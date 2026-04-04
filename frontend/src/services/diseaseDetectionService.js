/**
 * Disease Detection Service
 * Uses the in-repo backend diagnosis route as the single source of truth.
 */

import axios from 'axios';
import API_CONFIG from '../config/apiConfig';

class DiseaseDetectionService {
  constructor() {
    this.endpoint = `${API_CONFIG.BACKEND_BASE_URL}/api/crop-diagnosis`;
    this.timeout = 45000;
  }

  getStoredToken() {
    return (
      localStorage.getItem('token') || localStorage.getItem('donatrakAccessToken')
    );
  }

  hasAuthToken() {
    return !!this.getStoredToken();
  }

  clearStoredToken() {
    localStorage.removeItem('token');
    localStorage.removeItem('donatrakAccessToken');
  }

  getAuthHeaders() {
    const token = this.getStoredToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async detectDisease(base64Image, progressCallback, context = {}) {
    try {
      if (progressCallback) {
        progressCallback(20);
      }

      const response = await axios.post(
        this.endpoint,
        {
          image: base64Image,
          crop: context.crop,
          region: context.region,
          language: context.language,
          context,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            ...this.getAuthHeaders(),
          },
          timeout: this.timeout,
        }
      );

      if (progressCallback) {
        progressCallback(100);
      }

      return this.parseApiResponse(response.data);
    } catch (error) {
      console.error('Disease detection service error:', error);
      return this.buildUnavailableResult(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          'Disease analysis is temporarily unavailable due to a service error.'
      );
    }
  }

  parseApiResponse(data) {
    if (!data || typeof data !== 'object') {
      return this.buildUnavailableResult(
        'Disease analysis returned an invalid response.'
      );
    }

    if (data.status === 'unavailable') {
      return this.buildUnavailableResult(data.remedy || data.message);
    }

    return {
      status: data.status || 'ok',
      isAvailable: data.isAvailable !== false,
      plant: data.plant || 'Unknown Plant',
      disease: data.disease || 'Could not detect disease',
      remedy: data.remedy || 'Monitor the crop and seek expert guidance.',
      confidence:
        typeof data.confidence === 'number' ? data.confidence : null,
      source: data.source || 'backend',
      evidence: Array.isArray(data.evidence) ? data.evidence : [],
      severity: data.severity || 'unknown',
      notes: Array.isArray(data.notes) ? data.notes : [],
      disclaimer: data.disclaimer || null,
    };
  }

  buildUnavailableResult(message) {
    return {
      status: 'unavailable',
      isAvailable: false,
      plant: 'Analysis unavailable',
      disease: 'No verified diagnosis',
      remedy:
        message ||
        'Disease analysis is temporarily unavailable. Please try again later.',
      confidence: null,
      source: 'backend',
      evidence: [],
      severity: 'unknown',
      notes: [],
      disclaimer: null,
    };
  }

  async getServiceStatus() {
    try {
      await axios.get(`${API_CONFIG.BACKEND_BASE_URL}/api/health`, {
        timeout: API_CONFIG.HEALTH_CHECK_TIMEOUT,
      });
      return {
        primary_api: true,
        secondary_apis: 0,
        fallback_available: false,
        active_api: 'AgroMet Backend',
        last_checked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        primary_api: false,
        secondary_apis: 0,
        fallback_available: false,
        last_checked: new Date().toISOString(),
      };
    }
  }

  clearHealthCache() {
    return undefined;
  }

  async getDiagnosisHistory(filters = {}) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });

    const response = await axios.get(
      `${API_CONFIG.BACKEND_BASE_URL}/api/diagnosis-history?${params.toString()}`,
      {
        headers: this.getAuthHeaders(),
        timeout: this.timeout,
      }
    );
    return response.data;
  }

  async getDiagnosisHistoryItem(recordId) {
    const response = await axios.get(
      `${API_CONFIG.BACKEND_BASE_URL}/api/diagnosis-history/${recordId}`,
      {
        headers: this.getAuthHeaders(),
        timeout: this.timeout,
      }
    );
    return response.data;
  }

  async deleteDiagnosisHistoryItem(recordId) {
    const response = await axios.delete(
      `${API_CONFIG.BACKEND_BASE_URL}/api/diagnosis-history/${recordId}`,
      {
        headers: this.getAuthHeaders(),
        timeout: this.timeout,
      }
    );
    return response.data;
  }
}

export default new DiseaseDetectionService();
