// Firebase Firestore service for managing patients data
import { 
  collection, 
  doc, 
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { Patient, Lesion, Assessment } from '../types';
import { deepCloneAndStripUndefined } from '../utils';

/**
 * Get all patients for a specific user
 */
export const getUserPatients = async (userId: string): Promise<Patient[]> => {
  try {
    const patientsRef = collection(db, 'patients');
    const q = query(
      patientsRef, 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const patients: Patient[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      patients.push({
        id: doc.id,
        userId: data.userId,
        name: data.name,
        age: data.age,
        gender: data.gender,
        weightKg: data.weightKg,
        address: data.address,
        nutritionalStatus: data.nutritionalStatus,
        mobility: data.mobility,
        smoker: data.smoker,
        smokerAmount: data.smokerAmount,
        alcohol: data.alcohol,
        alcoholAmount: data.alcoholAmount,
        comorbidities: data.comorbidities || [],
        allergies: data.allergies || [],
        medications: data.medications,
        photoUrl: data.photoUrl
      } as Patient);
    });
    
    return patients;
  } catch (error) {
    console.error('Error fetching patients:', error);
    throw new Error('Erro ao carregar pacientes');
  }
};

/**
 * Get a single patient by ID
 */
export const getPatient = async (patientId: string): Promise<Patient | null> => {
  try {
    const patientRef = doc(db, 'patients', patientId);
    const patientDoc = await getDoc(patientRef);
    
    if (!patientDoc.exists()) {
      return null;
    }
    
    return {
      id: patientDoc.id,
      ...patientDoc.data()
    } as Patient;
  } catch (error) {
    console.error('Error fetching patient:', error);
    throw new Error('Erro ao carregar paciente');
  }
};

/**
 * Create a new patient
 */
export const createPatient = async (userId: string, patientData: Omit<Patient, 'id' | 'userId'>): Promise<Patient> => {
  try {
    const patientsRef = collection(db, 'patients');
    // Remove userId from patientData if it exists (shouldn't per type, but just in case)
    const { userId: _, ...cleanPatientData } = patientData as any;
    // Ensure no lesions field is included
    const { lesions: __, ...dataWithoutLesions } = cleanPatientData as any;
    const newPatient = {
      ...dataWithoutLesions,
      userId,
      createdAt: Timestamp.now().toMillis(),
      updatedAt: Timestamp.now().toMillis()
    };
    
    const docRef = await addDoc(patientsRef, newPatient);
    
    return {
      id: docRef.id,
      userId,
      ...patientData
    };
  } catch (error) {
    console.error('Error creating patient:', error);
    throw new Error('Erro ao criar paciente');
  }
};

/**
 * Update an existing patient
 */
export const updatePatient = async (patientId: string, patientData: Partial<Patient>): Promise<void> => {
  try {
    const patientRef = doc(db, 'patients', patientId);
    
    // Remove id, userId, and lesions from patientData - these fields should never be updated
    const { id, userId, lesions, ...restData } = patientData as any;
    
    // Deep clone and strip undefined to ensure everything is serializable
    const cleanData = deepCloneAndStripUndefined(restData);
    
    console.log('Updating patient in Firestore:', {
      patientId,
      fieldsToUpdate: Object.keys(cleanData)
    });
    
    await updateDoc(patientRef, {
      ...cleanData,
      updatedAt: Timestamp.now().toMillis()
    });
    
    console.log('Patient updated successfully');
  } catch (error) {
    console.error('Error updating patient:', error);
    throw error;
  }
};

/**
 * Delete a patient
 */
export const deletePatient = async (patientId: string): Promise<void> => {
  try {
    const batchArray: WriteBatch[] = [];
    let currentBatch = writeBatch(db);
    let operationCount = 0;
    const MAX_BATCH_SIZE = 500;

    const addToBatch = (docRef: DocumentReference) => {
        currentBatch.delete(docRef);
        operationCount++;
        if (operationCount >= MAX_BATCH_SIZE) {
            batchArray.push(currentBatch);
            currentBatch = writeBatch(db);
            operationCount = 0;
        }
    };

    // 1. Delete patient
    const patientRef = doc(db, 'patients', patientId);
    addToBatch(patientRef);
    
    // 2. Get lesions
    const lesionsRef = collection(db, 'lesions');
    const q = query(lesionsRef, where('patientId', '==', patientId));
    const lesionSnapshot = await getDocs(q);
    
    // 3. Get assessments for each lesion (parallel)
    const assessmentPromises = lesionSnapshot.docs.map(async (lesionDoc) => {
        const assessmentsRef = collection(db, 'lesions', lesionDoc.id, 'assessments');
        const assessmentSnapshot = await getDocs(assessmentsRef);
        return {
            lesionDoc,
            assessmentDocs: assessmentSnapshot.docs
        };
    });

    const results = await Promise.all(assessmentPromises);

    // 4. Add to batch
    for (const result of results) {
        // Add assessments
        for (const assessmentDoc of result.assessmentDocs) {
            addToBatch(assessmentDoc.ref);
        }
        // Add lesion
        addToBatch(result.lesionDoc.ref);
    }

    // Push final batch
    if (operationCount > 0) {
        batchArray.push(currentBatch);
    }

    // 5. Commit all batches
    await Promise.all(batchArray.map(b => b.commit()));

  } catch (error) {
    console.error('Error deleting patient:', error);
    throw new Error('Erro ao deletar paciente');
  }
};

/**
 * Get all lesions for a specific patient
 */
export const getPatientLesions = async (patientId: string): Promise<Lesion[]> => {
  try {
    const lesionsRef = collection(db, 'lesions');
    const q = query(
      lesionsRef,
      where('patientId', '==', patientId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const lesions: Lesion[] = [];
    
    querySnapshot.forEach((doc) => {
      lesions.push({
        id: doc.id,
        ...doc.data()
      } as Lesion);
    });
    
    return lesions;
  } catch (error) {
    console.error('Error fetching lesions:', error);
    throw new Error('Erro ao carregar lesões');
  }
};

/**
 * Get all lesions for a list of patients (chunked to respect Firestore limits)
 */
export const getLesionsForPatients = async (patientIds: string[]): Promise<Lesion[]> => {
  if (!patientIds.length) return [];

  try {
    const lesionsRef = collection(db, 'lesions');
    const chunks = [];
    // Firestore 'in' query limit is 30
    const chunkSize = 30;

    for (let i = 0; i < patientIds.length; i += chunkSize) {
      chunks.push(patientIds.slice(i, i + chunkSize));
    }

    const lesionPromises = chunks.map(async (chunk) => {
      const q = query(
        lesionsRef,
        where('patientId', 'in', chunk)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Lesion));
    });

    const results = await Promise.all(lesionPromises);
    return results.flat();
  } catch (error) {
    console.error('Error fetching lesions for patients:', error);
    return [];
  }
};

/**
 * Create a new lesion for a patient
 */
export const createLesion = async (patientId: string, lesionData: Omit<Lesion, 'id' | 'patientId'>): Promise<Lesion> => {
  try {
    const lesionsRef = collection(db, 'lesions');
    const newLesion = {
      ...lesionData,
      patientId,
      createdAt: Timestamp.now().toMillis(),
      updatedAt: Timestamp.now().toMillis()
    };
    
    const docRef = await addDoc(lesionsRef, newLesion);
    
    const createdLesion: Lesion = {
      id: docRef.id,
      patientId,
      ...lesionData
    };
    
    return createdLesion;
  } catch (error) {
    console.error('Error creating lesion:', error);
    throw new Error('Erro ao criar lesão');
  }
};

/**
 * Update an existing lesion
 */
export const updateLesion = async (lesionId: string, lesionData: Partial<Lesion>): Promise<void> => {
  try {
    const lesionRef = doc(db, 'lesions', lesionId);
    // Remove id, patientId and assessments from updates - assessments are handled in sub-collection
    const { id, patientId, assessments, ...cleanData } = lesionData as any;
    
    // Deep clone and strip undefined to ensure everything is serializable
    const serializedData = deepCloneAndStripUndefined(cleanData);
    
    await updateDoc(lesionRef, {
      ...deepCloneAndStripUndefined(cleanData),
      updatedAt: Timestamp.now().toMillis()
    });
  } catch (error) {
    console.error('Error updating lesion:', error);
    throw new Error('Erro ao atualizar lesão');
  }
};

/**
 * Add a new assessment to a lesion (Sub-collection)
 */
export const addAssessment = async (lesionId: string, assessment: Assessment): Promise<void> => {
  try {
    const assessmentsRef = collection(db, 'lesions', lesionId, 'assessments');
    const docRef = assessment.id
      ? doc(assessmentsRef, assessment.id)
      : doc(assessmentsRef);

    const { id, ...assessmentData } = assessment;
    const finalAssessment = {
      ...assessmentData,
      id: docRef.id,
      updatedAt: Timestamp.now().toMillis()
    };

    await setDoc(docRef, finalAssessment);

    // Also update the lesion's updatedAt and latestAssessment
    await updateDoc(doc(db, 'lesions', lesionId), {
      updatedAt: Timestamp.now().toMillis(),
      latestAssessment: {
        ...assessmentData,
        id: docRef.id
      }
    });
  } catch (error) {
    console.error('Error adding assessment:', error);
    throw new Error('Erro ao adicionar avaliação');
  }
};

/**
 * Update an existing assessment
 */
export const updateAssessment = async (lesionId: string, assessment: Assessment): Promise<void> => {
  try {
    const assessmentRef = doc(db, 'lesions', lesionId, 'assessments', assessment.id);
    const { id, ...data } = assessment;
    const updatedAssessment = {
      ...data,
      updatedAt: Timestamp.now().toMillis()
    };

    await updateDoc(assessmentRef, updatedAssessment);

    // Check if this is the latest assessment and update parent if so
    const lesionRef = doc(db, 'lesions', lesionId);
    const lesionDoc = await getDoc(lesionRef);
    if (lesionDoc.exists()) {
      const lesionData = lesionDoc.data() as Lesion;
      // If the updated assessment is the one currently stored as latest, update it
      if (lesionData.latestAssessment?.id === assessment.id) {
        await updateDoc(lesionRef, {
          latestAssessment: { ...updatedAssessment, id: assessment.id }
        });
      }
    }
  } catch (error) {
    console.error('Error updating assessment:', error);
    throw new Error('Erro ao atualizar avaliação');
  }
};

/**
 * Get all assessments for a lesion (with Migration Logic)
 */
export const getLesionAssessments = async (lesionId: string): Promise<Assessment[]> => {
  try {
    // Fetch from sub-collection
    const assessmentsRef = collection(db, 'lesions', lesionId, 'assessments');
    const q = query(assessmentsRef, orderBy('date', 'asc'));

    const querySnapshot = await getDocs(q);
    const assessments: Assessment[] = [];

    querySnapshot.forEach((doc) => {
      assessments.push({
        id: doc.id,
        ...doc.data()
      } as Assessment);
    });

    // Ensure chronological order
    return assessments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  } catch (error) {
    console.error('Error fetching assessments:', error);
    throw new Error('Erro ao carregar avaliações');
  }
};

/**
 * Delete a lesion
 */
export const deleteLesion = async (lesionId: string): Promise<void> => {
  try {
    // Delete sub-collection assessments first
    const assessmentsRef = collection(db, 'lesions', lesionId, 'assessments');
    const snapshot = await getDocs(assessmentsRef);

    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    // Delete the lesion document
    const lesionRef = doc(db, 'lesions', lesionId);
    await deleteDoc(lesionRef);
  } catch (error) {
    console.error('Error deleting lesion:', error);
    throw new Error('Erro ao deletar lesão');
  }
};
