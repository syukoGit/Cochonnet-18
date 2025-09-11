import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import EventConfig from './pages/EventConfig';
import Phase1 from './pages/Phase1';
import Phase2 from './pages/Phase2';
import './App.css';
import AutoSaveProgress from './components/AutoSaveProgress';
import { useRouteTracking } from './hooks/useRouteTracking';

function AppComponent() {
  useRouteTracking();

  return (
    <>
      <div className="global-auto-save-progress">
        <AutoSaveProgress size={60} strokeWidth={4} />
      </div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/config" element={<EventConfig />} />
        <Route path="/phase1" element={<Phase1 />} />
        <Route path="/phase2" element={<Phase2 />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppComponent />
    </Router>
  );
}
