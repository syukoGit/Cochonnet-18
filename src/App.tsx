import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import Home from '@/pages/Home';
import TournamentPage from '@/pages/TournamentPage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tournoi/:id" element={<TournamentPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
