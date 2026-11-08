

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './contexts/LanguageContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { ToastProvider } from './contexts/ToastContext';
import { AdminStateProvider } from './contexts/AdminStateContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <LanguageProvider>
      <CurrencyProvider>
        <ToastProvider>
          <AdminStateProvider>
            <App />
          </AdminStateProvider>
        </ToastProvider>
      </CurrencyProvider>
    </LanguageProvider>
  </React.StrictMode>
);