import { useEffect, useRef, useState } from 'react';
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
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cycleStartTimeRef = useRef(Date.now());
  
  const [progress, setProgress] = useState(0);
  const [timeUntilNextSave, setTimeUntilNextSave] = useState(AUTO_SAVE_INTERVAL);

  // Update progress every second
  useEffect(() => {
    const updateProgress = () => {
      const now = Date.now();
      const elapsed = now - cycleStartTimeRef.current;
      const progressPercent = Math.min((elapsed / AUTO_SAVE_INTERVAL) * 100, 100);
      const remaining = Math.max(AUTO_SAVE_INTERVAL - elapsed, 0);
      
      setProgress(progressPercent);
      setTimeUntilNextSave(remaining);
    };

    // Update progress immediately
    updateProgress();
    
    // Update progress every second
    progressIntervalRef.current = setInterval(updateProgress, 1000);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [cycleStartTimeRef.current]);

  useEffect(() => {
    // Start auto-save timer
    intervalRef.current = setInterval(() => {
      // Only save if there's actual data (e.g., teams are configured)
      if (state.event.teams.length > 0 || state.event.name.trim() !== '') {
        const success = saveBackup(state);
        
        if (success) {
          lastSaveTimeRef.current = Date.now();
          cycleStartTimeRef.current = Date.now(); // Reset the cycle
          console.log('Auto-save completed at', new Date().toLocaleTimeString());
        } else {
          console.warn('Auto-save failed');
        }
      } else {
        // Even if no data to save, reset the cycle
        cycleStartTimeRef.current = Date.now();
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
      cycleStartTimeRef.current = Date.now(); // Reset the cycle
      console.log('Manual save completed');
    }
    return success;
  };

  return { 
    manualSave, 
    progress, 
    timeUntilNextSave,
    formattedTimeUntilNextSave: formatTime(timeUntilNextSave)
  };
}

/**
 * Format milliseconds to MM:SS format
 */
function formatTime(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}