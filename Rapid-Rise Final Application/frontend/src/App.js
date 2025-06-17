import React, { useState, useEffect } from 'react';
import { AuthScreen, ResetPassword } from './components/Auth';
import Dashboard from './components/Dashboard';
import PublicShare from './components/PublicShare';
import { setupAxiosInterceptors } from './services/api';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [view, setView] = useState('login');
  const [shareToken, setShareToken] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const resetToken = params.get('reset');
    
    if (urlToken) { 
      setShareToken(urlToken); 
      setView('publicShare'); 
    } else if (resetToken) { 
      setShareToken(resetToken); 
      setView('resetPassword'); 
    }
  }, []);

  useEffect(() => {
    const cleanup = setupAxiosInterceptors(setToken, setView);
    return cleanup;
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setView('login');
  };

  if (shareToken && view === 'publicShare') return <PublicShare token={shareToken} />;
  if (shareToken && view === 'resetPassword') return <ResetPassword token={shareToken} />;
  if (!token) return <AuthScreen setToken={setToken} view={view} setView={setView} />;
  return <Dashboard token={token} logout={logout} />;
}

export default App;