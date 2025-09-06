import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAutoSave } from './hooks/useAutoSave';
import CircularProgress from './components/CircularProgress';
import Home from './pages/Home';
import EventConfig from './pages/EventConfig';
import Phase1 from './pages/Phase1';
import Phase2 from './pages/Phase2';
import './App.css';

function App() {
  // Initialize auto-save functionality and get progress data
  const { manualSave, progress, formattedTimeUntilNextSave } = useAutoSave();

  const handleManualSave = () => {
    const success = manualSave();
    if (success) {
      console.log('Manual save triggered from global progress indicator');
    }
  };

  return (
    <Router>
      {/* Global auto-save progress indicator visible on all pages */}
      <div className="global-auto-save-progress">
        <CircularProgress
          progress={progress}
          onClick={handleManualSave}
          timeRemaining={formattedTimeUntilNextSave}
        />
      </div>
      
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
