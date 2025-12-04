
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Customers from './components/Customers';
import LeadManager from './components/LeadManager';
import FeedbackLog from './components/FeedbackLog';
import Enquiries from './components/Enquiries';
import Compensations from './components/Compensations';
import Login from './components/Login';
import Settings from './components/Settings';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
};

const AppRoutes = () => {
    const { isAuthenticated } = useAuth();

    // Theme Initialization
    useEffect(() => {
        const theme = localStorage.getItem('fudfarmer_theme');
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);
    
    return (
      <HashRouter>
        <Routes>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="customers" element={<Customers />} />
            <Route path="leads" element={<LeadManager />} />
            <Route path="feedback" element={<FeedbackLog />} />
            <Route path="enquiries" element={<Enquiries />} />
            <Route path="compensations" element={<Compensations />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </HashRouter>
    );
};

function App() {
  return (
    <AuthProvider>
        <AppRoutes />
    </AuthProvider>
  );
}

export default App;
