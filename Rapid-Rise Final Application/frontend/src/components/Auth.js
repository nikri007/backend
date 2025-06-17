import React, { useState } from 'react';
import { authService } from '../services/api';

export function AuthScreen({ setToken, view, setView }) {
  const [data, setData] = useState({});
  const [msg, setMsg] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    try {
      const endpoints = { 
        login: '/auth/login', 
        register: '/auth/register', 
        forgot: '/auth/forgot-password' 
      };
      const res = await authService.post(endpoints[view], data);
      
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
      } else {
        setMsg('Reset link sent to email');
        setTimeout(() => setView('login'), 2000);
      }
    } catch (err) {
      setMsg(err.response?.data?.error || 'Error occurred');
    }
  };

  const change = (e) => setData({ ...data, [e.target.name]: e.target.value });
  
  const handleDateChange = (e) => {
    if (e.target.value) {
      setData({ ...data, date_of_birth: e.target.value });
    }
  };

  return (
    <div className="auth-container">
      <h2>{view === 'register' ? 'Register' : view === 'forgot' ? 'Reset Password' : 'Login'}</h2>
      <form onSubmit={submit}>
        {view === 'register' && (
          <>
            <input name="first_name" placeholder="First Name" onChange={change} required />
            <input name="last_name" placeholder="Last Name" onChange={change} required />
            <input name="date_of_birth" type="date" onChange={handleDateChange} required />
            <input name="email" type="email" placeholder="Email" onChange={change} required />
            <input name="password" type="password" placeholder="Password" onChange={change} required />
            <input name="confirm_password" type="password" placeholder="Confirm Password" onChange={change} required />
          </>
        )}
        
        {view === 'login' && (
          <>
            <input name="email" type="email" placeholder="Email" onChange={change} required />
            <input name="password" type="password" placeholder="Password" onChange={change} required />
          </>
        )}

        {view === 'forgot' && (
          <input name="email" type="email" placeholder="Email" onChange={change} required />
        )}
        
        <button type="submit">
          {view === 'register' ? 'Register' : view === 'forgot' ? 'Send Reset' : 'Login'}
        </button>
      </form>
      
      {msg && <div className="message">{msg}</div>}
      
      <div className="links">
        {view === 'login' && (
          <>
            <button onClick={() => setView('register')}>Create Account</button>
            <button onClick={() => setView('forgot')}>Forgot Password</button>
          </>
        )}
        {view === 'register' && <button onClick={() => setView('login')}>Back to Login</button>}
        {view === 'forgot' && <button onClick={() => setView('login')}>Back to Login</button>}
      </div>
    </div>
  );
}

export function ResetPassword({ token }) {
  const [data, setData] = useState({ token, new_password: '', confirm_password: '' });
  const [msg, setMsg] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (data.new_password !== data.confirm_password) {
      setMsg('Passwords do not match');
      return;
    }
    try {
      await authService.post('/auth/reset-password', data);
      setMsg('Password reset successful');
      setTimeout(() => window.location.href = '/', 2000);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Reset failed');
    }
  };

  return (
    <div className="auth-container">
      <h2>Reset Password</h2>
      <form onSubmit={submit}>
        <input name="new_password" type="password" placeholder="New Password" 
               onChange={(e) => setData({...data, [e.target.name]: e.target.value})} required />
        <input name="confirm_password" type="password" placeholder="Confirm Password" 
               onChange={(e) => setData({...data, [e.target.name]: e.target.value})} required />
        <button type="submit">Reset Password</button>
      </form>
      {msg && <div className="message">{msg}</div>}
    </div>
  );
} 
