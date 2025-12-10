
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import PatientDetail from './components/PatientDetail';
import Login from './components/Login';
import Register from './components/Register';
import { generateMockPatients, Patient, User } from './types';
import { authService } from './services/authService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Data
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    
    // In a real app, we would fetch patients from API filtered by user ID.
    // Here we generate mock patients, and if a user exists, we assign them to that user 
    // to simulate existing data.
    if (currentUser) {
        setPatients(generateMockPatients(currentUser.id));
    }
    
    setIsLoading(false);
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    // Reload "mock" patients for this new user so dashboard isn't empty
    // In production this would be an API call: fetchPatients(userId)
    setPatients(generateMockPatients(loggedInUser.id));
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setPatients([]);
  };

  const addPatient = (newPatient: Patient) => {
    if (!user) return;
    // Ensure patient is linked to current user
    const patientWithUser = { ...newPatient, userId: user.id };
    setPatients([...patients, patientWithUser]);
  };

  const updatePatient = (updatedPatient: Patient) => {
    setPatients(patients.map(p => p.id === updatedPatient.id ? updatedPatient : p));
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
