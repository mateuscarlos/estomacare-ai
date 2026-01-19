
// Mock types
interface Assessment {
  id: string;
  date: string;
  [key: string]: any;
}

interface Lesion {
  id: string;
  assessments: Assessment[];
  [key: string]: any;
}

// Simulation Configuration
const NUM_ASSESSMENTS = 50;
const ASSESSMENT_SIZE_BYTES = 500; // Approx size of one assessment

// Mocks
const mockDb: Record<string, any> = {
  lesions: {}
};

let currentLesionId = 'lesion-1';

// Helpers to simulate Firestore size
function getObjectSize(obj: any): number {
  return JSON.stringify(obj).length;
}

console.log("--- PERFORMANCE BENCHMARK: Lesion Assessment Storage ---");
console.log(`Simulating ${NUM_ASSESSMENTS} assessments per lesion.\n`);

// SCENARIO 1: CURRENT IMPLEMENTATION (Array in Document)
console.log("Scenario 1: Current Implementation (Array in Document)");

// Reset DB
mockDb.lesions = {};
mockDb.lesions[currentLesionId] = { id: currentLesionId, assessments: [] };

let lesionDoc = mockDb.lesions[currentLesionId];
let startSize = getObjectSize(lesionDoc);

console.log(`Initial Document Size: ${startSize} bytes`);

const startTimeOld = performance.now();

for (let i = 0; i < NUM_ASSESSMENTS; i++) {
  // Simulate fetching (simplified)
  const currentDoc = mockDb.lesions[currentLesionId];
  const assessments = [...currentDoc.assessments];

  // Create new assessment
  const newAssessment: Assessment = {
    id: `assess-${i}`,
    date: new Date().toISOString(),
    widthMm: 10 + i,
    heightMm: 20 + i,
    notes: "Lorem ipsum dolor sit amet ".repeat(5) // Padding to simulate data
  };

  // Append
  assessments.push(newAssessment);

  // Simulate updateDoc
  mockDb.lesions[currentLesionId] = {
    ...currentDoc,
    assessments: assessments,
    updatedAt: Date.now()
  };
}

const endTimeOld = performance.now();
const finalSizeOld = getObjectSize(mockDb.lesions[currentLesionId]);

console.log(`Final Document Size: ${finalSizeOld} bytes`);
console.log(`Time taken (Simulated Logic): ${(endTimeOld - startTimeOld).toFixed(2)}ms`);
if (finalSizeOld > 1000000) {
    console.warn("WARNING: Document size exceeds Firestore 1MB limit!");
}

// SCENARIO 2: OPTIMIZED IMPLEMENTATION (Sub-collection)
console.log("\nScenario 2: Optimized Implementation (Sub-collection)");

// Reset DB
mockDb.lesions = {};
mockDb.lesions[currentLesionId] = { id: currentLesionId }; // No assessments array
// Sub-collection storage simulation
const subCollection: Record<string, Assessment> = {};

const startSizeNew = getObjectSize(mockDb.lesions[currentLesionId]);
console.log(`Initial Document Size: ${startSizeNew} bytes`);

const startTimeNew = performance.now();

for (let i = 0; i < NUM_ASSESSMENTS; i++) {
  // Create new assessment
  const newAssessment: Assessment = {
    id: `assess-${i}`,
    date: new Date().toISOString(),
    widthMm: 10 + i,
    heightMm: 20 + i,
    notes: "Lorem ipsum dolor sit amet ".repeat(5)
  };

  // Simulate addDoc to sub-collection
  // The main document is NOT updated with the assessment data
  subCollection[newAssessment.id] = newAssessment;

  // Maybe update 'updatedAt' on main doc
  mockDb.lesions[currentLesionId].updatedAt = Date.now();
}

const endTimeNew = performance.now();
const finalSizeNew = getObjectSize(mockDb.lesions[currentLesionId]);

console.log(`Final Document Size (Main Doc): ${finalSizeNew} bytes`);
console.log(`Total Assessments stored in sub-collection: ${Object.keys(subCollection).length}`);
console.log(`Time taken (Simulated Logic): ${(endTimeNew - startTimeNew).toFixed(2)}ms`);

// Comparison
const sizeReduction = ((finalSizeOld - finalSizeNew) / finalSizeOld) * 100;
console.log(`\n--- RESULTS ---`);
console.log(`Document Size Reduction: ${sizeReduction.toFixed(2)}%`);
console.log(`Old Size: ${(finalSizeOld / 1024).toFixed(2)} KB`);
console.log(`New Size: ${(finalSizeNew / 1024).toFixed(2)} KB`);


// SCENARIO 3: MIGRATION LOGIC VERIFICATION
console.log("\n--- MIGRATION VERIFICATION ---");

// Setup: Lesion with 5 legacy assessments
mockDb.lesions['legacy-lesion'] = {
    id: 'legacy-lesion',
    assessments: Array.from({ length: 5 }, (_, i) => ({
        id: `legacy-${i}`,
        date: new Date().toISOString(),
        notes: "Legacy data"
    }))
};

const legacySubCollection: Record<string, Assessment> = {};

console.log("Legacy Lesion Assessments Count:", mockDb.lesions['legacy-lesion'].assessments.length);

// Simulate getLesionAssessments with migration
const lesionDocLegacy = mockDb.lesions['legacy-lesion'];
if (lesionDocLegacy.assessments && lesionDocLegacy.assessments.length > 0) {
    console.log("Migration needed detected.");

    // Simulate Batch Write
    lesionDocLegacy.assessments.forEach((a: Assessment) => {
        legacySubCollection[a.id] = a;
    });

    // Clear legacy array
    lesionDocLegacy.assessments = [];

    console.log("Migration executed.");
}

console.log("Post-Migration Lesion Assessments Count:", lesionDocLegacy.assessments.length);
console.log("Post-Migration Sub-collection Count:", Object.keys(legacySubCollection).length);

if (lesionDocLegacy.assessments.length === 0 && Object.keys(legacySubCollection).length === 5) {
    console.log("✅ MIGRATION SUCCESSFUL");
} else {
    console.error("❌ MIGRATION FAILED");
}
