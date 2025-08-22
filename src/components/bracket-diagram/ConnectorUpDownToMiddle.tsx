import type React from 'react';
import './Connector.css';
import type { ConnectorProps } from './ConnectorProps';

const ConnectorUpToDown: React.FC<ConnectorProps> = ({ length }) => {
  return (
    <div className="connector" style={{ height: `${100 - 100 / length}%` }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <line className="stroke v" x1="50" y1="0" x2="50" y2="100" />
        <line className="stroke" x1="0" y1="0" x2="50" y2="0" />
        <line className="stroke" x1="0" y1="100" x2="50" y2="100" />
        <line className="stroke" x1="50" y1="50" x2="100" y2="50" />
      </svg>
    </div>
  );
};

export default ConnectorUpToDown;
