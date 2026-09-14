import { Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { RequireAuth } from './components/RequireAuth';
import { StubScreen } from './components/StubScreen';
import { CallScreen } from './screens/CallScreen';
import { CareNeedScreen } from './screens/CareNeedScreen';
import { DemoScreen } from './screens/DemoScreen';
import { LandingScreen } from './screens/LandingScreen';
import { ProviderDetailScreen } from './screens/ProviderDetailScreen';
import { ProvidersScreen } from './screens/ProvidersScreen';
import { RadarScreen } from './screens/RadarScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { SignInScreen } from './screens/SignInScreen';

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        {/* Public and login-free */}
        <Route path="/" element={<LandingScreen />} />
        <Route path="/demo" element={<DemoScreen />} />
        <Route path="/signin" element={<SignInScreen />} />
        {/* Pre-auth creation flow: define the need and build a shortlist freely */}
        <Route path="/start" element={<CareNeedScreen />} />
        <Route path="/providers" element={<ProvidersScreen />} />
        <Route path="/providers/:providerId" element={<ProviderDetailScreen />} />
        <Route
          path="/privacy"
          element={<StubScreen title="Privacy" note="Privacy policy copy is added in Phase 4." />}
        />
        <Route
          path="/terms"
          element={<StubScreen title="Terms" note="Terms of service copy is added in Phase 4." />}
        />

        {/* Persistent / live-capable product state requires a session */}
        <Route element={<RequireAuth />}>
          <Route path="/radar/:careNeedId" element={<RadarScreen />} />
          <Route path="/calls/:callRunId" element={<CallScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
        </Route>

        <Route
          path="*"
          element={
            <StubScreen
              title="Not found"
              note="That route does not exist. Return to the Availary home page."
            />
          }
        />
      </Route>
    </Routes>
  );
}
