import React from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import AppRouter from './router/AppRouter';
import './styles.css';
createRoot(document.getElementById('root')).render(<AuthProvider><AppRouter /></AuthProvider>);
