import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {showAlert} from './utils/dialog';
import './index.css';

const nativeAlert = window.alert.bind(window);

window.alert = (message?: any) => {
  const text = message == null ? '' : String(message).trim();

  if (!text) {
    nativeAlert(message);
    return;
  }

  void showAlert({
    title: 'Notice',
    text,
    icon: 'warning',
  }).catch(() => {
    nativeAlert(message);
  });
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
