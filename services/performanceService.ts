/**
 * Firebase Performance Monitoring Service
 * Tracks application performance metrics
 */

import { getPerformance, trace } from 'firebase/performance';
import app from '../firebase';

const perf = typeof window !== 'undefined' ? getPerformance(app) : null;

export const performanceService = {
  /**
   * Start trace for operation
   * @param traceName - Name of the trace
   * @returns Trace object or null
   */
  startTrace: (traceName: string) => {
    if (!perf) return null;
    
    try {
      const t = trace(perf, traceName);
      t.start();
      return t;
    } catch (error) {
      console.error(`Error starting trace ${traceName}:`, error);
      return null;
    }
  },

  /**
   * Stop trace
   * @param t - Trace object
   */
  stopTrace: (t: any) => {
    if (t) {
      try {
        t.stop();
      } catch (error) {
        console.error('Error stopping trace:', error);
      }
    }
  },

  /**
   * Measure async operation with automatic trace management
   * @param traceName - Name of the trace
   * @param operation - Async operation to measure
   * @returns Result of the operation
   */
  measureAsync: async <T>(traceName: string, operation: () => Promise<T>): Promise<T> => {
    const t = performanceService.startTrace(traceName);
    
    try {
      const result = await operation();
      performanceService.stopTrace(t);
      return result;
    } catch (error) {
      performanceService.stopTrace(t);
      throw error;
    }
  },

  /**
   * Measure sync operation
   * @param traceName - Name of the trace
   * @param operation - Sync operation to measure
   * @returns Result of the operation
   */
  measureSync: <T>(traceName: string, operation: () => T): T => {
    const t = performanceService.startTrace(traceName);
    
    try {
      const result = operation();
      performanceService.stopTrace(t);
      return result;
    } catch (error) {
      performanceService.stopTrace(t);
      throw error;
    }
  },

  /**
   * Add custom attribute to trace
   * @param t - Trace object
   * @param name - Attribute name
   * @param value - Attribute value
   */
  putAttribute: (t: any, name: string, value: string) => {
    if (t && typeof t.putAttribute === 'function') {
      try {
        t.putAttribute(name, value);
      } catch (error) {
        console.error(`Error adding attribute ${name}:`, error);
      }
    }
  },

  /**
   * Add custom metric to trace
   * @param t - Trace object
   * @param name - Metric name
   * @param value - Metric value
   */
  putMetric: (t: any, name: string, value: number) => {
    if (t && typeof t.putMetric === 'function') {
      try {
        t.putMetric(name, value);
      } catch (error) {
        console.error(`Error adding metric ${name}:`, error);
      }
    }
  }
};

export default performanceService;
