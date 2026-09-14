import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './services/auth/AuthContext';
import { ServiceProvider } from './services/ServiceContext';
import './styles/global.css';
import './styles/app.css';
import './styles/marketing.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ServiceProvider>
          <App />
        </ServiceProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
