## 2026-01-19 - Missing Test Configuration
**Learning:** The memory suggested `vitest.config.ts` exists and tests are configured, but the file is missing and `package.json` has no test script.
**Action:** Always verify the existence of configuration files and scripts before relying on them, regardless of memory or documentation.

## 2026-01-19 - Frontend Verification with Broken Auth
**Learning:** The application requires Firebase credentials to load, even for mock data, because `App.tsx` uses `firebaseAuthService`. Without credentials, the app crashes.
**Action:** To verify frontend changes when auth is broken or credentials missing, temporarily modify `App.tsx` to bypass `authService.onAuthStateChanged` and force mock state, then revert before committing.
