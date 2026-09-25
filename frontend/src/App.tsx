import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { OverviewPage } from './pages/OverviewPage';
import { MapViewPage } from './pages/MapViewPage';
import { StructureDetailPage } from './pages/StructureDetailPage';
import { PredictionsAlertsPage } from './pages/PredictionsAlertsPage';
import { WatershedValidationPage } from './pages/WatershedValidationPage';
import { SecondaryEvidenceCauveryPage } from './pages/SecondaryEvidenceCauveryPage';

// Inner shell — needs to be inside AuthProvider to call useAuth
const AppShell: React.FC = () => {
  const { token, switchRole, isLoggingIn } = useAuth();

  // Auto-login as admin on first load so admin API calls have a real JWT immediately
  useEffect(() => {
    if (!token && !isLoggingIn) {
      switchRole('admin');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 transition-colors">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/map" element={<MapViewPage />} />
          <Route path="/structure/:id" element={<StructureDetailPage />} />
          <Route path="/alerts" element={<PredictionsAlertsPage />} />
          <Route path="/watershed-validation" element={<WatershedValidationPage />} />
          <Route path="/secondary-evidence" element={<SecondaryEvidenceCauveryPage />} />
        </Routes>
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppShell />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
