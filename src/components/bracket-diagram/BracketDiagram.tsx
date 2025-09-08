import { useEffect, useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import generateBracketGrid from '../../utils/bracketDiagrams';
import {
  isBracketNode,
  isConnector,
  type BracketNode,
} from '../../utils/phase2';
import ConnectorDownToUp from './ConnectorDownToUp';
import ConnectorUpDownToMiddle from './ConnectorUpDownToMiddle';
import ConnectorUpToDown from './ConnectorUpToDown';
import ConnectorV from './ConnectorV';
import MatchCard from './MatchCard';

interface BracketDiagramProps {
  activeTree: 'winners' | 'consolation';
  rootNode: BracketNode;
}

export default function BracketDiagram({
  rootNode,
  activeTree,
}: BracketDiagramProps) {
  const teams = useAppSelector((state) => state.event.teams);
  const [grid, setGrid] = useState(generateBracketGrid(rootNode));

  useEffect(() => {
    setGrid(generateBracketGrid(rootNode));
  }, [activeTree, rootNode]);

  return (
    <table className="bracket-table">
      <tbody>
        {grid.map((row, y) => (
          <tr key={`r-${y}`}>
            {row.map((cell, x) =>
              isBracketNode(cell) ? (
                <td key={`c-${y}-${x}`}>
                  <MatchCard node={cell} tree={activeTree} teams={teams} />
                </td>
              ) : isConnector(cell) ? (
                <td key={`c-${y}-${x}`} rowSpan={cell.length}>
                  {(() => {
                    switch (cell.type) {
                      case 'UpToDown':
                        return <ConnectorUpToDown length={cell.length} />;
                      case 'DownToUp':
                        return <ConnectorDownToUp length={cell.length} />;
                      case 'UpDownToMiddle':
                        return <ConnectorUpDownToMiddle length={cell.length} />;
                      case 'Vertical':
                        return <ConnectorV length={cell.length} />;
                      default:
                        return null;
                    }
                  })()}
                </td>
              ) : cell === null ? (
                <td key={`c-${y}-${x}`} />
              ) : null
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
