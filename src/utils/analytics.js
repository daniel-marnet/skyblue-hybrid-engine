/**
 * Google Analytics Utility
 * Provides helper functions for tracking events in Google Analytics
 */

/**
 * Track a custom event
 * @param {string} eventName - Name of the event
 * @param {object} eventParams - Additional parameters for the event
 */
export const trackEvent = (eventName, eventParams = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
};

/**
 * Track page view
 * @param {string} pagePath - Path of the page
 * @param {string} pageTitle - Title of the page
 */
export const trackPageView = (pagePath, pageTitle) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: pagePath,
      page_title: pageTitle,
    });
  }
};

/**
 * Track engine control events
 * @param {string} action - Action performed (e.g., 'start', 'stop', 'thrust_change')
 * @param {object} details - Additional details about the action
 */
export const trackEngineControl = (action, details = {}) => {
  trackEvent('engine_control', {
    action,
    ...details,
  });
};

/**
 * Track system status changes
 * @param {string} status - New status (e.g., 'connected', 'disconnected', 'error')
 * @param {object} details - Additional details
 */
export const trackSystemStatus = (status, details = {}) => {
  trackEvent('system_status', {
    status,
    ...details,
  });
};

/**
 * Track user interactions
 * @param {string} element - Element interacted with
 * @param {string} action - Action performed
 * @param {object} details - Additional details
 */
export const trackInteraction = (element, action, details = {}) => {
  trackEvent('user_interaction', {
    element,
    action,
    ...details,
  });
};

/**
 * Track errors
 * @param {string} errorType - Type of error
 * @param {string} errorMessage - Error message
 * @param {object} details - Additional details
 */
export const trackError = (errorType, errorMessage, details = {}) => {
  trackEvent('error', {
    error_type: errorType,
    error_message: errorMessage,
    ...details,
  });
};

/**
 * Track performance metrics
 * @param {string} metric - Metric name
 * @param {number} value - Metric value
 * @param {object} details - Additional details
 */
export const trackPerformance = (metric, value, details = {}) => {
  trackEvent('performance_metric', {
    metric,
    value,
    ...details,
  });
};
