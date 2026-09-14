import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import Home from '@/pages/Home';
import Configuration from '@/pages/Configuration';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tournoi/:id" element={<Configuration />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
