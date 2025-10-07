
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import App from './App.tsx';
import BatDetailsPage from './components/BatDetailsPage_clean.tsx';
import { DataHistoryFullPage } from './components/DataHistoryFullPage';
import { NavigationMenu } from './components/NavigationMenu';
import { MenuProvider } from './context/MenuContext';
import './index.css';

// Debug component to log route changes
const RouteDebugger = () => {
  const location = useLocation();
  console.log('🟢 Route changed to:', location.pathname, location);
  return null;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MenuProvider>
      <BrowserRouter>
        <RouteDebugger />
        <NavigationMenu />
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/bat/:serverNum/:clientNum/:batId" element={<BatDetailsPage />} />
          <Route path="/data-history-full" element={<DataHistoryFullPage />} />
        </Routes>
      </BrowserRouter>
    </MenuProvider>
  </StrictMode>
);
