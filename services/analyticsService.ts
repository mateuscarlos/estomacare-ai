/**
 * Firebase Analytics Service
 * Tracks user behavior and application events
 */

import { getAnalytics, logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import app from '../firebase';

const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export const analyticsService = {
  /**
   * Log user login event
   */
  logLogin: (method: 'email' | 'google') => {
    if (analytics) {
      logEvent(analytics, 'login', { method });
    }
  },

  /**
   * Log user signup event
   */
  logSignUp: (method: 'email' | 'google') => {
    if (analytics) {
      logEvent(analytics, 'sign_up', { method });
    }
  },

  /**
   * Log patient creation
   */
  logPatientCreated: () => {
    if (analytics) {
      logEvent(analytics, 'patient_created');
    }
  },

  /**
   * Log patient update
   */
  logPatientUpdated: () => {
    if (analytics) {
      logEvent(analytics, 'patient_updated');
    }
  },

  /**
   * Log patient deletion
   */
  logPatientDeleted: () => {
    if (analytics) {
      logEvent(analytics, 'patient_deleted');
    }
  },

  /**
   * Log lesion assessment creation
   */
  logAssessmentCreated: (lesionType: string) => {
    if (analytics) {
      logEvent(analytics, 'assessment_created', { lesion_type: lesionType });
    }
  },

  /**
   * Log AI treatment suggestion request
   */
  logAISuggestionRequest: () => {
    if (analytics) {
      logEvent(analytics, 'ai_suggestion_requested');
    }
  },

  /**
   * Log AI treatment suggestion success
   */
  logAISuggestionSuccess: (lesionType: string) => {
    if (analytics) {
      logEvent(analytics, 'ai_suggestion_success', { lesion_type: lesionType });
    }
  },

  /**
   * Log AI treatment suggestion error
   */
  logAISuggestionError: (errorMessage: string) => {
    if (analytics) {
      logEvent(analytics, 'ai_suggestion_error', { error: errorMessage });
    }
  },

  /**
   * Log image analysis request
   */
  logImageAnalysis: () => {
    if (analytics) {
      logEvent(analytics, 'image_analyzed');
    }
  },

  /**
   * Log image analysis success
   */
  logImageAnalysisSuccess: () => {
    if (analytics) {
      logEvent(analytics, 'image_analysis_success');
    }
  },

  /**
   * Log image analysis error
   */
  logImageAnalysisError: (errorMessage: string) => {
    if (analytics) {
      logEvent(analytics, 'image_analysis_error', { error: errorMessage });
    }
  },

  /**
   * Log PDF export
   */
  logPDFExport: () => {
    if (analytics) {
      logEvent(analytics, 'pdf_exported');
    }
  },

  /**
   * Log image upload
   */
  logImageUpload: (sizeKB: number) => {
    if (analytics) {
      logEvent(analytics, 'image_uploaded', { size_kb: sizeKB });
    }
  },

  /**
   * Log search operation
   */
  logSearch: (searchTerm: string) => {
    if (analytics) {
      logEvent(analytics, 'search', { search_term: searchTerm });
    }
  },

  /**
   * Log page view
   */
  logPageView: (pageName: string) => {
    if (analytics) {
      logEvent(analytics, 'page_view', { page_name: pageName });
    }
  },

  /**
   * Set user ID for analytics
   */
  setUser: (userId: string) => {
    if (analytics) {
      setUserId(analytics, userId);
    }
  },

  /**
   * Set user properties
   */
  setUserProps: (properties: Record<string, string>) => {
    if (analytics) {
      setUserProperties(analytics, properties);
    }
  }
};

export default analyticsService;
