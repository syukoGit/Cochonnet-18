import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import Home from '@/pages/Home';
import TournamentRoute from '@/pages/TournamentRoute';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tournoi/:id" element={<TournamentRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
