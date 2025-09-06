import { useEffect, useRef } from 'react';
import { useAppSelector } from '../store/hooks';
import { saveBackup } from '../utils/persistence';

const AUTO_SAVE_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Hook to handle automatic saving of Redux state to localStorage
 */
export function useAutoSave() {
  const state = useAppSelector((state) => state);
  const lastSaveTimeRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Start auto-save timer
    intervalRef.current = setInterval(() => {
      // Only save if there's actual data (e.g., teams are configured)
      if (state.event.teams.length > 0 || state.event.name.trim() !== '') {
        const success = saveBackup(state);
        
        if (success) {
          lastSaveTimeRef.current = Date.now();
          console.log('Auto-save completed at', new Date().toLocaleTimeString());
        } else {
          console.warn('Auto-save failed');
        }
      }
    }, AUTO_SAVE_INTERVAL);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state]);

  // Save on critical state changes
  useEffect(() => {
    const now = Date.now();
    // Only save if it's been at least 30 seconds since last save to avoid spam
    // and there's meaningful data to save
    if (
      now - lastSaveTimeRef.current > 30000 &&
      (state.event.teams.length > 0 || state.event.rounds.length > 0)
    ) {
      const success = saveBackup(state);
      if (success) {
        lastSaveTimeRef.current = now;
        console.log('Critical change auto-save completed');
      }
    }
  }, [state.event.rounds, state.event.phase2Groups, state]);

  // Manual save function
  const manualSave = () => {
    const success = saveBackup(state);
    if (success) {
      lastSaveTimeRef.current = Date.now();
      console.log('Manual save completed');
    }
    return success;
  };

  return { manualSave };
}