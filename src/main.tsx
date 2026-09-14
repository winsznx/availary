import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './services/auth/AuthContext';
import { createSupabaseAuth } from './services/auth/supabaseAuth';
import { ServiceProvider } from './services/ServiceContext';
import { createRealService } from './services/realService';
import { supabaseBrowserClient } from './services/supabaseClient';
import './styles/global.css';
import './styles/app.css';
import './styles/marketing.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');

// No Supabase credentials configured (e.g. local dev without `.env`, or the
// public demo build) -> both providers fall back to their fixture defaults.
const authService = supabaseBrowserClient ? createSupabaseAuth(supabaseBrowserClient) : undefined;
const availabilityService = supabaseBrowserClient
  ? createRealService({
      supabase: supabaseBrowserClient,
      apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
    })
  : undefined;

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider service={authService}>
        <ServiceProvider service={availabilityService}>
          <App />
        </ServiceProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
