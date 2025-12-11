
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import PatientDetail from './components/PatientDetail';
import Login from './components/Login';
import Register from './components/Register';
import { Patient, User } from './types';
import { authService } from './services/firebaseAuthService';
import { getUserPatients, createPatient, updatePatient as updatePatientInDb } from './services/firestoreService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Data and setup auth listener
  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = authService.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          // Fetch real patients from Firestore
          const userPatients = await getUserPatients(currentUser.id);
          setPatients(userPatients);
        } catch (error) {
          console.error('Error loading patients:', error);
          setPatients([]);
        }
      } else {
        setPatients([]);
      }
      
      setIsLoading(false);
    });
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleLogin = async (loggedInUser: User) => {
    setUser(loggedInUser);
    try {
      // Load real patients from Firestore
      const userPatients = await getUserPatients(loggedInUser.id);
      setPatients(userPatients);
    } catch (error) {
      console.error('Error loading patients:', error);
      setPatients([]);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setPatients([]);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const addPatient = async (newPatient: Patient) => {
    if (!user) return;
    try {
      // Create patient in Firestore
      const createdPatient = await createPatient(user.id, newPatient);
      setPatients([...patients, createdPatient]);
    } catch (error) {
      console.error('Error creating patient:', error);
      alert('Erro ao criar paciente. Verifique as permissões.');
    }
  };

  const updatePatient = async (updatedPatient: Patient) => {
    if (!user) return;
    
    try {
      console.log('Updating patient:', updatedPatient.id);
      
      await updatePatientInDb(updatedPatient.id, updatedPatient);
      setPatients(patients.map(p => p.id === updatedPatient.id ? updatedPatient : p));
    } catch (error) {
      console.error('Error updating patient:', error);
      alert('Erro ao atualizar paciente: ' + (error as Error).message);
    }
  };

  // Filter patients by current user ID for security/logic
  const userPatients = user ? patients.filter(p => p.userId === user.id) : [];

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Carregando...</div>;

  return (
    <Router>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register onLogin={handleLogin} /> : <Navigate to="/" />} />

          {/* Protected Routes */}
          <Route 
            path="/" 
            element={user ? <Dashboard patients={userPatients} onAddPatient={addPatient} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/patients/:id" 
            element={user ? <PatientDetail patients={userPatients} onUpdatePatient={updatePatient} /> : <Navigate to="/login" />} 
          />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
