// Firebase Authentication Service
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';
import { User } from '../types';

/**
 * Convert Firebase User to App User format
 */
const mapFirebaseUserToAppUser = async (firebaseUser: FirebaseUser): Promise<User> => {
  // Get additional user data from Firestore
  const userDocRef = doc(db, 'users', firebaseUser.uid);
  const userDoc = await getDoc(userDocRef);
  
  const userData = userDoc.exists() ? userDoc.data() : {};
  
  return {
    id: firebaseUser.uid,
    name: firebaseUser.displayName || userData.name || 'Usuário',
    email: firebaseUser.email!,
    specialty: userData.specialty || 'Estomaterapeuta'
  };
};

/**
 * Create or update user profile in Firestore
 */
const createUserProfile = async (userId: string, data: Partial<User>): Promise<void> => {
  const userDocRef = doc(db, 'users', userId);
  await setDoc(userDocRef, {
    name: data.name,
    email: data.email,
    specialty: data.specialty || 'Estomaterapeuta',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }, { merge: true });
};

export const firebaseAuthService = {
  /**
   * Register new user with email and password
   */
  register: async (name: string, email: string, password: string): Promise<User> => {
    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Update display name
      await updateProfile(firebaseUser, { displayName: name });
      
      // Create user profile in Firestore
      await createUserProfile(firebaseUser.uid, {
        id: firebaseUser.uid,
        name,
        email,
        specialty: 'Estomaterapeuta'
      });
      
      return await mapFirebaseUserToAppUser(firebaseUser);
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Map Firebase errors to user-friendly messages
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Este e-mail já está cadastrado.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('A senha deve ter pelo menos 6 caracteres.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('E-mail inválido.');
      }
      
      throw new Error('Erro ao criar conta. Tente novamente.');
    }
  },

  /**
   * Login with email and password
   */
  login: async (email: string, password: string): Promise<User> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return await mapFirebaseUserToAppUser(userCredential.user);
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        throw new Error('E-mail ou senha inválidos.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('E-mail inválido.');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Muitas tentativas. Tente novamente mais tarde.');
      }
      
      throw new Error('Erro ao fazer login. Tente novamente.');
    }
  },

  /**
   * Login with Google OAuth
   */
  loginWithGoogle: async (): Promise<User> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      // Create/update user profile in Firestore
      await createUserProfile(firebaseUser.uid, {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || 'Usuário Google',
        email: firebaseUser.email!,
        specialty: 'Estomaterapeuta'
      });
      
      return await mapFirebaseUserToAppUser(firebaseUser);
    } catch (error: any) {
      console.error('Google login error:', error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Login cancelado pelo usuário.');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup bloqueado. Permita popups para este site.');
      }
      
      throw new Error('Erro ao fazer login com Google. Tente novamente.');
    }
  },

  /**
   * Logout current user
   */
  logout: async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Erro ao fazer logout.');
    }
  },

  /**
   * Get current authenticated user
   */
  getCurrentUser: (): Promise<User | null> => {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        unsubscribe();
        
        if (firebaseUser) {
          try {
            const user = await mapFirebaseUserToAppUser(firebaseUser);
            resolve(user);
          } catch (error) {
            console.error('Error mapping user:', error);
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });
    });
  },

  /**
   * Subscribe to authentication state changes
   */
  onAuthStateChanged: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const user = await mapFirebaseUserToAppUser(firebaseUser);
          callback(user);
        } catch (error) {
          console.error('Error in auth state change:', error);
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  }
};

// Export both old and new service for gradual migration
// In production, remove authService completely
export { firebaseAuthService as authService };
