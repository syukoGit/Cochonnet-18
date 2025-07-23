import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import EventConfig from './pages/EventConfig';
import Phase1 from './pages/Phase1';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/config" element={<EventConfig />} />
        <Route path="/phase1" element={<Phase1 />} />
      </Routes>
    </Router>
  );
}

export default App;
