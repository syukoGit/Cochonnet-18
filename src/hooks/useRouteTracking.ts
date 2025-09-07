import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppDispatch } from '../store/hooks';
import { setCurrentRoute } from '../store/eventSlice';

/**
 * Hook to track route changes and update Redux state
 */
export function useRouteTracking() {
  const location = useLocation();
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Update the current route in Redux state whenever the location changes
    dispatch(setCurrentRoute(location.pathname));
  }, [location.pathname, dispatch]);
}