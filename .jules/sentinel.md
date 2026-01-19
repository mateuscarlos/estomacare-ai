## 2026-01-19 - Missing Security Headers in Firebase Config
**Vulnerability:** Application lacked standard security headers (HSTS, X-Frame-Options, X-Content-Type-Options) in `firebase.json`.
**Learning:** Firebase Hosting does not add these by default; they must be explicitly configured.
**Prevention:** Always verify `firebase.json` includes a `headers` block for `**` source with these security headers.
