import { useAppSelector } from '../store/hooks';
import { useState } from 'react';
import {
  generateBracketTree,
  isBracketNode,
  isConnector,
} from '../utils/phase2';
import type { BracketNode, Connector } from '../utils/phase2';
import './Phase2.css';
import ConnectorUpToDown from '../components/bracket-diagram/ConnectorUpToDown';
import ConnectorDownToUp from '../components/bracket-diagram/ConnectorDownToUp';
import ConnectorUpDownToMiddle from '../components/bracket-diagram/ConnectorUpDownToMiddle';

function Phase2() {
  const groups = useAppSelector((state) => state.event.phase2Groups);
  const phase2Brackets = useAppSelector((state) => state.event.phase2Brackets);
  const [active, setActive] = useState<'winners' | 'consolation'>('winners');

  if (!groups) {
    return (
      <div className="phase2-wrapper">
        <h1>Phase 2</h1>
        <p>Aucune donnée</p>
      </div>
    );
  }

  // Prepare both trees (use store values if present, fallback to generation)
  const winnersTree: BracketNode | null =
    phase2Brackets?.winners ?? generateBracketTree(groups.winners || []);
  const consolationTree: BracketNode | null =
    phase2Brackets?.consolation ??
    generateBracketTree(groups.consolation || []);

  const activeTree: BracketNode | null =
    active === 'winners' ? winnersTree : consolationTree;

  const grid = new Array<
    Array<BracketNode | Connector | null | 'Connector expansion'>
  >();

  const getMaxDepth = (node: BracketNode, depth: number): number => {
    const leftNode = node.left ? getMaxDepth(node.left, depth + 1) : 0;
    const rightNode = node.right ? getMaxDepth(node.right, depth + 1) : 0;

    return Math.max(depth, leftNode, rightNode);
  };

  const maxDepth = activeTree ? getMaxDepth(activeTree, 0) : 0;

  function setConnectorPosition(
    nodePos: { x: number; y: number },
    parentPos: { x: number; y: number },
    type: 'UpToDown' | 'DownToUp' | 'UpDownToMiddle'
  ) {
    let x;
    let y;

    if (type === 'DownToUp') {
      x = parentPos.x - 1;
      y = parentPos.y;
    } else {
      x = nodePos.x + 1;
      y = nodePos.y;
    }

    let length = Math.abs(nodePos.y - parentPos.y) + 1;

    if (type === 'UpDownToMiddle') length = length * 2 - 1;

    grid[y][x] = {
      length,
      type,
    };

    for (let i = 1; i < length; i++) {
      if (!grid[y + i]) {
        grid[y + i] = [];
      }

      grid[y + i][x] = 'Connector expansion';
    }
  }

  function setNodePosition(
    node: BracketNode,
    depth: number,
    parentPos: { x: number; y: number },
    branch: 'left' | 'right'
  ): { x: number; y: number } {
    const x = parentPos.x - 2;
    const y =
      branch === 'left'
        ? parentPos.y - Math.pow(2, maxDepth - depth)
        : parentPos.y + Math.pow(2, maxDepth - depth);

    if (!grid[y]) {
      grid[y] = new Array<
        BracketNode | Connector | null | 'Connector expansion'
      >();
    }

    grid[y][x] = node;

    const leftPos =
      node.left && setNodePosition(node.left, depth + 1, { x, y }, 'left');
    const rightPos =
      node.right && setNodePosition(node.right, depth + 1, { x, y }, 'right');

    if (leftPos && rightPos) {
      setConnectorPosition(leftPos, { x, y }, 'UpDownToMiddle');
    } else if (leftPos) {
      setConnectorPosition(leftPos, { x, y }, 'UpToDown');
    } else if (rightPos) {
      setConnectorPosition(rightPos, { x, y }, 'DownToUp');
    }

    return { x, y };
  }

  if (activeTree) {
    const x = maxDepth * 2;
    const y = Math.pow(2, maxDepth) - 1;

    if (!grid[y]) {
      grid[y] = new Array<
        BracketNode | Connector | null | 'Connector expansion'
      >();
    }

    grid[y][x] = activeTree;

    const leftPos =
      activeTree.left && setNodePosition(activeTree.left, 1, { x, y }, 'left');
    const rightPos =
      activeTree.right &&
      setNodePosition(activeTree.right, 1, { x, y }, 'right');

    if (leftPos && rightPos) {
      setConnectorPosition(leftPos, { x, y }, 'UpDownToMiddle');
    } else if (leftPos) {
      setConnectorPosition(leftPos, { x, y }, 'UpToDown');
    } else if (rightPos) {
      setConnectorPosition(rightPos, { x, y }, 'DownToUp');
    }
  }

  for (let y = 0; y < grid.length; y++) {
    if (!grid[y]) {
      grid[y] = [];
    }

    for (let x = 0; x < grid[y].length; x++) {
      if (grid[y][x] === undefined) {
        grid[y][x] = null;
      }
    }
  }

  return (
    <div className="phase2-wrapper">
      <h1>Phase 2</h1>
      <h2>{active === 'winners' ? 'Tournoi des gagnants' : 'Consolantes'}</h2>
      <div className="phase2-tabs">
        <button
          type="button"
          className={`phase2-tab ${active === 'winners' ? 'active-tab' : ''}`}
          onClick={() => setActive('winners')}
        >
          Tournoi des gagnants
        </button>
        <button
          type="button"
          className={`phase2-tab ${
            active === 'consolation' ? 'active-tab' : ''
          }`}
          onClick={() => setActive('consolation')}
        >
          Consolantes
        </button>
      </div>
      <div className="bracket-container">
        <table className="bracket-table">
          <tbody>
            {grid.map((row, y) => (
              <tr key={`r-${y}`}>
                {row.map((cell, x) =>
                  isBracketNode(cell) ? (
                    <td key={`c-${y}-${x}`}>
                      <div className="match-card">
                        <p>{cell.teams ? cell.teams[0] : ''}</p>
                        <div className="h-divider" />
                        <p>{cell.teams ? cell.teams[1] : ''}</p>
                      </div>
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
                            return (
                              <ConnectorUpDownToMiddle length={cell.length} />
                            );
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
      </div>
    </div>
  );
}

export default Phase2;
