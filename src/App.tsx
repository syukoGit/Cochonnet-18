import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import Accueil from '@/pages/Accueil';
import Evenement from '@/pages/Evenement';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Accueil />} />
        <Route path="/evenement/:id" element={<Evenement />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
