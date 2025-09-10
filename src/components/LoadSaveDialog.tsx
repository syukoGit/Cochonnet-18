import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../store/hooks';
import { restoreState } from '../store/eventSlice';
import {
  getAvailableBackups,
  loadBackup,
  formatBackupTimestamp,
  type BackupMetadata,
} from '../utils/persistence';
import './LoadSaveDialog.css';

interface LoadSaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const LoadSaveDialog: React.FC<LoadSaveDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load available backups when dialog opens
  useEffect(() => {
    if (isOpen) {
      const availableBackups = getAvailableBackups();
      setBackups(availableBackups);
      setSelectedBackup(null);
      setError(null);
    }
  }, [isOpen]);

  const handleLoadBackup = async () => {
    if (!selectedBackup) return;

    setLoading(true);
    setError(null);

    try {
      const state = loadBackup(selectedBackup);

      if (state) {
        // Restore the entire event state using the new action
        if (state) {
          dispatch(restoreState(state));

          // Navigate to the saved route if it exists
          const savedRoute = state.currentRoute;
          if (savedRoute && savedRoute !== '/') {
            navigate(savedRoute);
          }
        }

        onSuccess?.();
        onClose();
      } else {
        setError(
          'Impossible de charger la sauvegarde. Le fichier pourrait être corrompu.'
        );
      }
    } catch (err) {
      console.error('Failed to load backup:', err);
      setError('Une erreur est survenue lors du chargement de la sauvegarde.');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    const kb = bytes / 1024;
    return `${kb.toFixed(1)} KB`;
  };

  if (!isOpen) return null;

  return (
    <div className="load-save-overlay">
      <div className="load-save-dialog">
        <div className="load-save-header">
          <h2>Charger une sauvegarde</h2>
          <button
            className="close-button"
            onClick={onClose}
            aria-label="Fermer"
          >
            x
          </button>
        </div>

        <div className="load-save-content">
          {error && <div className="error-message">{error}</div>}

          {backups.length === 0 ? (
            <div className="no-backups">
              <p>Aucune sauvegarde disponible.</p>
              <p>
                Les sauvegardes sont créées automatiquement toutes les 5 minutes
                lorsque vous configurez un événement.
              </p>
            </div>
          ) : (
            <>
              <p>Sélectionnez une sauvegarde à charger :</p>
              <div className="backup-list">
                {backups.map((backup) => (
                  <label key={backup.name} className="backup-item">
                    <input
                      type="radio"
                      name="backup"
                      value={backup.name}
                      checked={selectedBackup === backup.name}
                      onChange={(e) => setSelectedBackup(e.target.value)}
                    />
                    <div className="backup-info">
                      <div className="backup-timestamp">
                        {formatBackupTimestamp(backup.timestamp)}
                      </div>
                      <div className="backup-details">
                        {formatFileSize(backup.size)}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="load-save-actions">
          <button type="button" onClick={onClose} className="button">
            Annuler
          </button>
          {backups.length > 0 && (
            <button
              type="button"
              onClick={handleLoadBackup}
              disabled={!selectedBackup || loading}
              className="button"
            >
              {loading ? 'Chargement...' : 'Charger'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadSaveDialog;
