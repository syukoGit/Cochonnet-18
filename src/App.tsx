import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAutoSave } from './hooks/useAutoSave';
import { useRouteTracking } from './hooks/useRouteTracking';
import CircularProgress from './components/CircularProgress';
import Home from './pages/Home';
import EventConfig from './pages/EventConfig';
import Phase1 from './pages/Phase1';
import Phase2 from './pages/Phase2';
import './App.css';

function App() {
  const { manualSave, progress, formattedTimeUntilNextSave } = useAutoSave();

  const handleManualSave = () => {
    const success = manualSave();
    if (success) {
      console.log('Manual save triggered from global progress indicator');
    }
  };

  return (
    <Router>
      <AppContent 
        progress={progress}
        onManualSave={handleManualSave}
        timeRemaining={formattedTimeUntilNextSave}
      />
    </Router>
  );
}

function AppContent({ progress, onManualSave, timeRemaining }: {
  progress: number;
  onManualSave: () => void;
  timeRemaining: string;
}) {
  // Track route changes
  useRouteTracking();

  return (
    <>
      <div className="global-auto-save-progress">
        <CircularProgress
          progress={progress}
          onClick={onManualSave}
          timeRemaining={timeRemaining}
        />
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

export default App;
