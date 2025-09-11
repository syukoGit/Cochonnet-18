import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setCurrentRoute } from '../store/eventSlice';

// Define the page order for navigation
import { PAGE_ORDER } from '../constants/routes';

/**
 * Hook to track route changes and update Redux state
 * - Updates current route when navigating forward
 * - Preserves current route when navigating backward
 */
export function useRouteTracking() {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { currentRoute } = useAppSelector((state) => state.event);
  const previousLocation = useRef(location.pathname);

  useEffect(() => {
    const currentIndex = PAGE_ORDER.indexOf(location.pathname);
    const previousIndex = PAGE_ORDER.indexOf(previousLocation.current);
    const storedRouteIndex = PAGE_ORDER.indexOf(currentRoute);

    // Only update current route if:
    // 1. We're moving forward in the flow (currentIndex > previousIndex), OR
    // 2. We're on a page that's ahead of the stored current route
    if (currentIndex > previousIndex || currentIndex > storedRouteIndex) {
      dispatch(setCurrentRoute(location.pathname));
    }

    // Update previous location for next comparison
    previousLocation.current = location.pathname;
  }, [location.pathname, dispatch, currentRoute]);
}
