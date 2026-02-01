## 2024-05-22 - [JSON Serialization Anti-pattern]
**Learning:** Found usage of `JSON.parse(JSON.stringify(x))` for deep cloning in `firestoreService.ts`. This is inefficient and corrupts `Date` objects into strings.
**Action:** Use a dedicated `deepCloneAndStripUndefined` utility to handle cloning properly and efficiently.
## 2024-05-22 - [Data Type Persistence Risk]
**Learning:** Replacing `JSON.parse(JSON.stringify(x))` with a proper deep clone utility changes how `Date` objects are persisted in Firestore (String vs Timestamp).
**Action:** When optimizing serialization, ensure the downstream data consumer (DB or API) supports the change in data types, or explicitly convert types to match existing schema.
## 2024-05-24 - [Expensive Derived State in Large Components]
**Learning:** In `PatientDetail.tsx`, typing in a form input caused the entire component to re-render, triggering expensive recalculations of chart data and assessment lists (spread + reverse).
**Action:** Memoized derived state (`activeLesion`, `chartData`, `sortedAssessments`) using `useMemo`. This isolates the cost of these calculations from unrelated state updates like form typing, improving responsiveness.

## 2024-05-24 - [Broken Memoization via JSX Props]
**Learning:** In `Dashboard.tsx`, `StatCard` was memoized but received `icon={<Users ... />}`. This creates a new object on every render, bypassing `React.memo`.
**Action:** Pass component references (e.g., `Icon={Users}`) instead of instantiated elements to props of memoized components to ensure reference stability.

## 2026-02-01 - [Redundant Subcollection Fetches in Tabbed Interface]
**Learning:** In `PatientDetail.tsx`, switching between lesions (tabs) triggered a new Firestore fetch for assessments every time, even if the data was already loaded. This increased latency and read costs.
**Action:** Implemented a session-based cache using `loadedLesionIds` (Set) to track fully loaded lesions. Added a check in `useEffect` to skip fetching if the lesion ID is in the set.
