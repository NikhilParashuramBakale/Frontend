
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import App from './App.tsx';
import BatDetailsPage from './components/BatDetailsPage_clean.tsx';
import { DataHistoryFullPage } from './components/DataHistoryFullPage';
import { MenuProvider } from './context/MenuContext';
import './index.css';

// Wrapper component to force re-mounting on route change
const BatDetailsPageWrapper: React.FC = () => {
  const { pathname } = useLocation();
  return <BatDetailsPage key={pathname} />;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MenuProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/bat/:serverNum/:clientNum/:batId" element={<BatDetailsPageWrapper />} />
          <Route path="/data-history-full" element={<DataHistoryFullPage />} />
        </Routes>
      </BrowserRouter>
    </MenuProvider>
  </StrictMode>
);
