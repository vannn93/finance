import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Activity from './pages/Activity';

import Pocket from './pages/Pocket';
import Profile from './pages/Profile';

function App() {
  return (
    <Router>
      <Toaster position="top-center" toastOptions={{className: 'rounded-2xl shadow-lg border border-slate-100 font-medium text-sm', style: {background: '#fff', color: '#1e293b'}}} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes (Demo checks) */}
        <Route path="/" element={<Layout><Dashboard /></Layout>} />
        <Route path="/activity" element={<Layout><Activity /></Layout>} />
        <Route path="/pocket" element={<Layout><Pocket /></Layout>} />
        <Route path="/profile" element={<Layout><Profile /></Layout>} />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
