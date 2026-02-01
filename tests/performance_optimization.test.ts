
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getLesionAssessments } from '../services/firestoreService';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';

// Mock firebase/firestore
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  writeBatch: vi.fn(() => ({
      set: vi.fn(),
      update: vi.fn(),
      commit: vi.fn()
  })),
  Timestamp: {
    now: () => ({ toMillis: () => 1234567890 })
  },
}));

vi.mock('../firebase', () => ({
  db: {}
}));

// Mock utils
vi.mock('../utils', () => ({
  deepCloneAndStripUndefined: (obj: any) => obj
}));

describe('getLesionAssessments Performance Optimization', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mocks
    (doc as any).mockReturnValue('mockDocRef');
    (collection as any).mockReturnValue('mockCollectionRef');

    // Mock getDoc to return a document that exists but has no assessments array (already migrated state)
    (getDoc as any).mockResolvedValue({
        exists: () => true,
        data: () => ({ id: 'lesion123', assessments: [] })
    });

    // Mock getDocs to return a list of assessments
    (getDocs as any).mockResolvedValue({
        forEach: (callback: any) => {
            callback({ id: 'assess1', data: () => ({ date: '2023-01-01', note: 'test' }) });
        },
        docs: []
    });
  });

  it('fetches ONLY the subcollection (efficient)', async () => {
    const lesionId = 'lesion123';

    await getLesionAssessments(lesionId);

    // Verify that getDoc was NOT called (Optimization success)
    expect(getDoc).not.toHaveBeenCalled();

    // Verify that getDocs WAS called (Functionality intact)
    expect(getDocs).toHaveBeenCalled();
  });
});
