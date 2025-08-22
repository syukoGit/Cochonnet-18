import type React from 'react';
import type { ConnectorProps } from './ConnectorProps';

const ConnectorV: React.FC<ConnectorProps> = () => {
  return (
    <div className="connector connector-v">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <line className="stroke v" x1="50" y1="0" x2="50" y2="100" />
      </svg>
    </div>
  );
};

export default ConnectorV;
