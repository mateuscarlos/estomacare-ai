import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

// Firebase configuration from .env.local
const firebaseConfig = {
  apiKey: "AIzaSyDkMTWKEa_mLyW-TbGxjt8RgWUyIlcl_Po",
  authDomain: "estomacare-ai.firebaseapp.com",
  projectId: "estomacare-ai",
  storageBucket: "estomacare-ai.firebasestorage.app",
  messagingSenderId: "1035277673682",
  appId: "1:1035277673682:web:11acabb7bc6b00ae8797a8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixPatientUserId() {
  try {
    // Get the current user ID - YOU NEED TO REPLACE THIS with your actual user ID
    const userId = "REPLACE_WITH_YOUR_USER_ID"; // Check console.log in your app or Firebase Auth users
    
    // Document ID from Firestore console
    const patientDocId = "KqZGyUs9wuOT3juY37IC";
    
    const patientRef = doc(db, 'patients', patientDocId);
    await updateDoc(patientRef, {
      userId: userId
    });
    
    console.log(`✅ Successfully added userId to patient document ${patientDocId}`);
  } catch (error) {
    console.error('❌ Error updating patient:', error);
  }
}

fixPatientUserId();
