import { useEffect, useRef, useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { saveBackup } from '../utils/persistence';

const AUTO_SAVE_INTERVAL = 5 * 60; // 5 minutes in seconds

/**
 * Hook to handle automatic saving of Redux state to localStorage
 */
export function useAutoSave() {
  const state = useAppSelector((state) => state.event);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [, setCounter] = useState(0);
  const [progress, setProgress] = useState(0);
  const [timeUntilNextSave, setTimeUntilNextSave] =
    useState(AUTO_SAVE_INTERVAL);

  // Update progress every second
  useEffect(() => {
    const updateProgress = () => {
      setCounter((prev) => {
        const next = prev + 1;

        setProgress((next * 100) / AUTO_SAVE_INTERVAL);
        setTimeUntilNextSave(Math.max(AUTO_SAVE_INTERVAL - next, 0));

        if (next >= AUTO_SAVE_INTERVAL) {
          const success = saveBackup(state);
          if (success) {
            console.log(
              'Auto-save completed at',
              new Date().toLocaleTimeString()
            );
          } else {
            console.warn('Auto-save failed');
          }
          return 0; // reset
        }
        return next;
      });
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
  }, [state]);

  // Manual save function
  const manualSave = () => {
    const success = saveBackup(state);
    if (success) {
      console.log('Manual save completed at', new Date().toLocaleTimeString());
      setCounter(0);
    }
    return success;
  };

  return {
    manualSave,
    progress,
    timeUntilNextSave,
    formattedTimeUntilNextSave: formatTime(timeUntilNextSave),
  };
}

/**
 * Format seconds to MM:SS format
 */
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${rest
    .toString()
    .padStart(2, '0')}`;
}
