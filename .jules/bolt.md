## 2024-05-22 - [JSON Serialization Anti-pattern]
**Learning:** Found usage of `JSON.parse(JSON.stringify(x))` for deep cloning in `firestoreService.ts`. This is inefficient and corrupts `Date` objects into strings.
**Action:** Use a dedicated `deepCloneAndStripUndefined` utility to handle cloning properly and efficiently.
## 2024-05-22 - [Data Type Persistence Risk]
**Learning:** Replacing `JSON.parse(JSON.stringify(x))` with a proper deep clone utility changes how `Date` objects are persisted in Firestore (String vs Timestamp).
**Action:** When optimizing serialization, ensure the downstream data consumer (DB or API) supports the change in data types, or explicitly convert types to match existing schema.
## 2025-05-23 - [Duplicate Component Declarations]
**Learning:** Encountered `Dashboard.tsx` containing duplicate imports and component declarations, likely from a bad merge. This caused ambiguous build errors and bloated bundle size.
**Action:** Always verify file integrity after large merges. Use `tsc` to catch duplicate identifier errors early.
## 2025-05-23 - [Denormalization for Dashboard Performance]
**Learning:** Calculating "Active Alerts" by fetching subcollections for every lesion (N+1) is a major bottleneck.
**Action:** Denormalized `latestAssessment` onto the parent `Lesion` document. This allows O(1) alert calculation per lesion without extra reads.
