## 2024-05-22 - [JSON Serialization Anti-pattern]
**Learning:** Found usage of `JSON.parse(JSON.stringify(x))` for deep cloning in `firestoreService.ts`. This is inefficient and corrupts `Date` objects into strings.
**Action:** Use a dedicated `deepCloneAndStripUndefined` utility to handle cloning properly and efficiently.
## 2024-05-22 - [Data Type Persistence Risk]
**Learning:** Replacing `JSON.parse(JSON.stringify(x))` with a proper deep clone utility changes how `Date` objects are persisted in Firestore (String vs Timestamp).
**Action:** When optimizing serialization, ensure the downstream data consumer (DB or API) supports the change in data types, or explicitly convert types to match existing schema.
