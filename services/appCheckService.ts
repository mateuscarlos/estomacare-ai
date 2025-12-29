/**
 * Firebase App Check Service
 * Protects backend resources from abuse by verifying requests
 */

import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import type { FirebaseApp } from 'firebase/app';

let appCheck: ReturnType<typeof initializeAppCheck> | null = null;

/**
 * Initialize Firebase App Check
 * Protects backend resources from abuse
 * NOTE: Disabled in development to avoid 403 errors
 */
export const initAppCheck = (app: FirebaseApp) => {
  // Skip App Check in development environment
  if (import.meta.env.DEV) {
    console.log('🔧 App Check disabled in development mode');
    return null;
  }
  
  if (typeof window !== 'undefined' && !appCheck) {
    try {
      // Use reCAPTCHA key for production
      const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
      
      if (!siteKey) {
        console.warn('⚠️ VITE_RECAPTCHA_SITE_KEY not configured. App Check disabled.');
        return null;
      }

      appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(siteKey),
        isTokenAutoRefreshEnabled: true
      });
      
      console.log('✅ Firebase App Check initialized');
      return appCheck;
    } catch (error) {
      console.warn('⚠️ App Check initialization failed:', error);
      // Return null instead of throwing to prevent app crash
      return null;
    }
  }
  
  return appCheck;
};

export default appCheck;
