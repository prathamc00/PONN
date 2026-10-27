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
              background: '#c2410c',
              color: '#fff',
              borderRadius: '0.5rem',
              border: '1px solid #9a3412',
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            },
          }}
        />
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
