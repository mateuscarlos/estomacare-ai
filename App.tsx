import React, { useState, useEffect, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Layout from './components/Layout';
import { User } from './types';
import { authService } from './services/firebaseAuthService';

// Lazy loading components for code splitting
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const PatientDetail = React.lazy(() => import('./components/PatientDetail'));
const Login = React.lazy(() => import('./components/Login'));
const Register = React.lazy(() => import('./components/Register'));

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Data and setup auth listener
  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = authService.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleLogin = async (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  return (
    <Router>
      <Layout user={user} onLogout={handleLogout}>
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[400px] h-full">
              <Loader2 className="animate-spin text-primary-600" size={32} />
            </div>
          }
        >
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
            <Route path="/register" element={!user ? <Register onLogin={handleLogin} /> : <Navigate to="/" />} />

            {/* Protected Routes */}
            <Route
              path="/"
              element={user ? <Dashboard user={user} /> : <Navigate to="/login" />}
            />
            <Route
              path="/patients/:id"
              element={user ? <PatientDetail user={user} /> : <Navigate to="/login" />}
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Layout>
    </Router>
  );
};

export default App;
