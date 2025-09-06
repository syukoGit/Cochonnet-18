import { Link } from 'react-router-dom';
import { useState } from 'react';
import Logo from '/logo.png';
import LoadSaveDialog from '../components/LoadSaveDialog';
import CircularProgress from '../components/CircularProgress';
import { useAutoSave } from '../hooks/useAutoSave';
import './Home.css';

function Home() {
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  const { manualSave, progress, formattedTimeUntilNextSave } = useAutoSave();

  const handleLoadSuccess = () => {
    // Optional: Could show a success message or navigate somewhere
    console.log('Backup loaded successfully');
  };

  const handleManualSave = () => {
    const success = manualSave();
    if (success) {
      console.log('Manual save triggered from progress indicator');
    }
  };

  return (
    <div id="home" className="home-container">
      {/* Auto-save progress indicator in top-left corner */}
      <div className="auto-save-progress">
        <CircularProgress
          progress={progress}
          onClick={handleManualSave}
          timeRemaining={formattedTimeUntilNextSave}
        />
      </div>
      
      <img src={Logo} className="App-logo" alt="logo" />
      <div>
        <h1>Cochonnet-18</h1>
        <p>Logiciel de gestion de tournoi de pétanque</p>
        <div className="home-buttons">
          <Link to="/config">
            <button>Créer un évènement</button>
          </Link>
          <button onClick={() => setIsLoadDialogOpen(true)}>
            Charger une sauvegarde
          </button>
        </div>
      </div>
      
      <LoadSaveDialog
        isOpen={isLoadDialogOpen}
        onClose={() => setIsLoadDialogOpen(false)}
        onSuccess={handleLoadSuccess}
      />
    </div>
  );
}

export default Home;
