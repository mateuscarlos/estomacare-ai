// Firebase Firestore service for managing patients data
import { 
  collection, 
  doc, 
  addDoc, 
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
    
    // Deep clone via JSON to ensure everything is serializable
    const cleanData = JSON.parse(JSON.stringify(restData));
    
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
    const patientRef = doc(db, 'patients', patientId);
    await deleteDoc(patientRef);
    
    // Also delete associated lesions
    const lesionsRef = collection(db, 'lesions');
    const q = query(lesionsRef, where('patientId', '==', patientId));
    const querySnapshot = await getDocs(q);
    
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
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
    // Remove id and patientId from updates
    const { id, patientId, ...cleanData } = lesionData;
    const serializedData = JSON.parse(JSON.stringify(cleanData));
    
    await updateDoc(lesionRef, {
      ...serializedData,
      updatedAt: Timestamp.now().toMillis()
    });
  } catch (error) {
    console.error('Error updating lesion:', error);
    throw new Error('Erro ao atualizar lesão');
  }
};

/**
 * Delete a lesion
 */
export const deleteLesion = async (lesionId: string): Promise<void> => {
  try {
    const lesionRef = doc(db, 'lesions', lesionId);
    await deleteDoc(lesionRef);
  } catch (error) {
    console.error('Error deleting lesion:', error);
    throw new Error('Erro ao deletar lesão');
  }
};
