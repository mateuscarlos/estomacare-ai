/**
 * Firebase App Check Service
 * Protects backend resources from abuse by verifying requests
 */

import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import app from '../firebase';

let appCheck: ReturnType<typeof initializeAppCheck> | null = null;

/**
 * Initialize Firebase App Check
 * Protects backend resources from abuse
 */
export const initAppCheck = () => {
  if (typeof window !== 'undefined' && !appCheck) {
    try {
      // Use test key for development, real key for production
      const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
      
      if (!siteKey) {
        console.warn('⚠️ VITE_RECAPTCHA_SITE_KEY not configured. App Check disabled.');
        return null;
      }

      // Enable debug token in development
      if (import.meta.env.DEV) {
        (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
        console.log('🔧 App Check debug mode enabled');
      }

      appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(siteKey),
        isTokenAutoRefreshEnabled: true
      });
      
      console.log('✅ Firebase App Check initialized');
      return appCheck;
    } catch (error) {
      console.error('❌ Error initializing App Check:', error);
      return null;
    }
  }
  
  return appCheck;
};

export default appCheck;
