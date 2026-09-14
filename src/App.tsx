import { HashRouter, Route, Routes } from 'react-router-dom';

function Accueil() {
  return (
    <main className="placeholder">
      <h1>Cochonnet-18</h1>
      <p>Lot 1 — fondations</p>
    </main>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Accueil />} />
      </Routes>
    </HashRouter>
  );
}
