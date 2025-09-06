import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAutoSave } from './hooks/useAutoSave';
import Home from './pages/Home';
import EventConfig from './pages/EventConfig';
import Phase1 from './pages/Phase1';
import Phase2 from './pages/Phase2';

function App() {
  // Initialize auto-save functionality
  useAutoSave();

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/config" element={<EventConfig />} />
        <Route path="/phase1" element={<Phase1 />} />
        <Route path="/phase2" element={<Phase2 />} />
      </Routes>
    </Router>
  );
}

export default App;
