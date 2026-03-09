import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import App from './App';
import './styles/globals.css';
import { Toaster } from '@/shared/components/ui/toast';

// Use MemoryRouter inside native app (no URL bar), BrowserRouter for web
const Router = Capacitor.isNativePlatform() ? MemoryRouter : BrowserRouter;

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Router>
      <App />
      <Toaster />
    </Router>
  </React.StrictMode>
);
