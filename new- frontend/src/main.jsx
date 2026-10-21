import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e3a2f',
              color: '#fff',
              borderRadius: '0.5rem',
              border: '1px solid #07241a',
              fontFamily: 'Inter, sans-serif',
            },
          }}
        />
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
