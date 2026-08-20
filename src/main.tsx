import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ComponentErrorBoundary } from './components/ComponentErrorBoundary';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ComponentErrorBoundary componentName="Cửa Hàng THANOX STORE">
      <App />
    </ComponentErrorBoundary>
  </React.StrictMode>
);
