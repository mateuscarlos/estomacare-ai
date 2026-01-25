
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addAssessment } from '../services/firestoreService';
import { doc, collection, updateDoc, setDoc } from 'firebase/firestore';
import { Assessment, ExudateLevel, ExudateType } from '../types';

// Mock firebase/firestore
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn((...args) => {
      // If last argument is a string, use it as ID. Otherwise generatedId.
      // This covers doc(ref, id) and doc(db, col, id)
      if (args.length >= 2 && typeof args[args.length - 1] === 'string') {
          return { id: args[args.length - 1], path: 'mockPath' };
      }
      return { id: 'generatedId', path: 'mockPath' };
  }),
  addDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  Timestamp: {
    now: () => ({ toMillis: () => 1234567890 })
  },
  writeBatch: vi.fn(),
}));

vi.mock('../firebase', () => ({
  db: {}
}));

// Mock utils
vi.mock('../utils', () => ({
  deepCloneAndStripUndefined: (obj: any) => obj
}));

describe('Firestore Optimization Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (collection as any).mockReturnValue('mockCollectionRef');
  });

  it('addAssessment should denormalize latestAssessment to lesion document', async () => {
    const lesionId = 'lesion123';
    const assessment: Assessment = {
      id: 'assess1',
      date: '2024-05-22',
      widthMm: 10,
      heightMm: 10,
      depthMm: 5,
      painLevel: 5,
      exudate: ExudateLevel.LOW,
      exudateType: ExudateType.SEROUS,
      tissueTypes: { necrotic: 0, slough: 0, granulation: 100, epithelialization: 0 },
      infectionSigns: [],
      woundEdges: [],
      periwoundSkin: [],
      notes: 'Test notes'
    };

    await addAssessment(lesionId, assessment);

    // We expect setDoc to be called for the assessment itself
    expect(setDoc).toHaveBeenCalled();

    // We expect updateDoc to be called for the lesion document
    expect(updateDoc).toHaveBeenCalledTimes(1);

    const updateCall = (updateDoc as any).mock.calls[0];
    const updateData = updateCall[1];

    // Verify the performance optimization: latestAssessment field must be present
    expect(updateData).toHaveProperty('latestAssessment');
    expect(updateData.latestAssessment).toEqual(expect.objectContaining({
        id: 'assess1',
        notes: 'Test notes',
        painLevel: 5
    }));

    // Verify updatedAt is also set
    expect(updateData).toHaveProperty('updatedAt', 1234567890);

    console.log('Performance Optimization Verified: latestAssessment is being written to parent doc.');
  });
});
