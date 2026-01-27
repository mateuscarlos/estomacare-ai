## 2024-05-22 - [JSON Serialization Anti-pattern]
**Learning:** Found usage of `JSON.parse(JSON.stringify(x))` for deep cloning in `firestoreService.ts`. This is inefficient and corrupts `Date` objects into strings.
**Action:** Use a dedicated `deepCloneAndStripUndefined` utility to handle cloning properly and efficiently.
## 2024-05-22 - [Data Type Persistence Risk]
**Learning:** Replacing `JSON.parse(JSON.stringify(x))` with a proper deep clone utility changes how `Date` objects are persisted in Firestore (String vs Timestamp).
**Action:** When optimizing serialization, ensure the downstream data consumer (DB or API) supports the change in data types, or explicitly convert types to match existing schema.
## 2024-05-24 - [Expensive Derived State in Large Components]
**Learning:** In `PatientDetail.tsx`, typing in a form input caused the entire component to re-render, triggering expensive recalculations of chart data and assessment lists (spread + reverse).
**Action:** Memoized derived state (`activeLesion`, `chartData`, `sortedAssessments`) using `useMemo`. This isolates the cost of these calculations from unrelated state updates like form typing, improving responsiveness.
## 2025-02-23 - [Unstable Props Defeating Memoization]
**Learning:** `StatCard` was receiving an icon as a React Element (e.g., `<Icon />`), which creates a new object on every parent render. This caused `StatCard` to re-render even when wrapped in `React.memo`.
**Action:** Refactored the component to accept the icon Component type (e.g., `icon={Icon}`) and render it internally. This ensures the prop reference is stable across renders, allowing `React.memo` to work correctly.
