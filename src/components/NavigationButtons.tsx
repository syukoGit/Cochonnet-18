import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import './NavigationButtons.css';

// Define the page order for navigation
const PAGE_ORDER = ['/', '/config', '/phase1', '/phase2', '/results'];

const NavigationButtons = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { visitedPages } = useAppSelector((state) => state.event);

  const currentPageIndex = PAGE_ORDER.indexOf(location.pathname);
  const hasPreviousPage = currentPageIndex > 0;
  const hasNextPage = currentPageIndex < PAGE_ORDER.length - 1;
  const nextPagePath = hasNextPage ? PAGE_ORDER[currentPageIndex + 1] : null;
  const previousPagePath = hasPreviousPage ? PAGE_ORDER[currentPageIndex - 1] : null;

  // Right arrow should only be visible if the next page was already visited
  const shouldShowRightArrow = hasNextPage && nextPagePath && visitedPages.includes(nextPagePath);

  const handlePreviousPage = () => {
    if (previousPagePath) {
      // Navigate to previous page - the useRouteTracking hook will handle
      // whether to update the current route based on navigation direction
      navigate(previousPagePath);
    }
  };

  const handleNextPage = () => {
    if (nextPagePath && visitedPages.includes(nextPagePath)) {
      // Only navigate if the next page was already visited
      navigate(nextPagePath);
    }
  };

  return (
    <div className="navigation-buttons">
      {hasPreviousPage && (
        <button
          className="nav-button nav-button-left"
          onClick={handlePreviousPage}
          aria-label="Previous page"
          title="Previous page"
        >
          &#8249; {/* Left-pointing single angle quotation mark */}
        </button>
      )}
      {shouldShowRightArrow && (
        <button
          className="nav-button nav-button-right"
          onClick={handleNextPage}
          aria-label="Next page"
          title="Next page"
        >
          &#8250; {/* Right-pointing single angle quotation mark */}
        </button>
      )}
    </div>
  );
};

export default NavigationButtons;