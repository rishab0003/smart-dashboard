import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import PredictionPage from './pages/PredictionPage';
import AnalyticsPage from './pages/AnalyticsPage';
import LandingPage from './pages/LandingPage';
import DataExplorerPage from './pages/DataExplorerPage';
import Layout from './components/Layout';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0A0A0A', gap: '20px' }}>
        <div style={{ width: '44px', height: '44px', background: '#E85D26', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 32px rgba(232,93,38,0.4)', animation: 'pulse 2s ease-in-out infinite' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'rgba(240,237,232,0.9)', fontSize: '14px', fontWeight: '600', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.01em' }}>SmartAnalytics</p>
          <p style={{ color: 'rgba(154,149,144,0.7)', fontSize: '11px', fontFamily: 'Inter, sans-serif', marginTop: '4px' }}>Initializing...</p>
        </div>
        <style>{`@keyframes pulse { 0%,100% { box-shadow: 0 0 24px rgba(232,93,38,0.3); } 50% { box-shadow: 0 0 40px rgba(232,93,38,0.6); } }`}</style>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage isAuthenticated={isAuthenticated} />} />

        {/* Guest Auth Routes */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? 
            <Navigate to="/dashboard" /> : 
            <LoginPage setIsAuthenticated={setIsAuthenticated} setUser={setUser} />
          } 
        />
        <Route 
          path="/register" 
          element={
            isAuthenticated ? 
            <Navigate to="/dashboard" /> : 
            <RegisterPage setIsAuthenticated={setIsAuthenticated} setUser={setUser} />
          } 
        />
        
        {/* Protected Dashboard Layout */}
        {isAuthenticated ? (
          <Route path="/" element={<Layout user={user} logout={logout} />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="upload" element={<UploadPage />} />
            <Route path="predictions" element={<PredictionPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="explorer" element={<DataExplorerPage />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/" />} />
        )}
      </Routes>
    </Router>
  );
}

export default App;