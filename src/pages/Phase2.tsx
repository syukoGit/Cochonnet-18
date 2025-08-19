import { useAppSelector } from '../store/hooks';
import { useState } from 'react';
import { generateBracketTree } from '../utils/phase2';
import type { BracketNode } from '../utils/phase2';
import './Phase2.css';

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

  const grid = new Array<Array<BracketNode | null>>();

  const getMaxDepth = (node: BracketNode, depth: number): number => {
    const leftNode = node.left ? getMaxDepth(node.left, depth + 1) : 0;
    const rightNode = node.right ? getMaxDepth(node.right, depth + 1) : 0;

    return Math.max(depth, leftNode, rightNode);
  };

  const maxDepth = activeTree ? getMaxDepth(activeTree, 0) : 0;
  let minX = 0;
  let minY = 0;

  function setNodePosition(node: BracketNode, depth: number) {
    const x = maxDepth - depth;
    const i = grid.map((row) => row[x]).filter((cell) => cell).length || 0;
    const y =
      Math.pow(2, maxDepth - depth) - 1 + Math.pow(2, maxDepth - depth + 1) * i;

    if (x < minX) minX = x;
    if (y < minY) minY = y;

    if (!grid[y]) {
      grid[y] = new Array<BracketNode | null>();
    }

    grid[y][x] = node;

    if (node.left) setNodePosition(node.left, depth + 1);
    if (node.right) setNodePosition(node.right, depth + 1);
  }

  if (activeTree) {
    setNodePosition(activeTree, 0);
  }

  for (let y = minY; y < grid.length; y++) {
    if (!grid[y]) {
      grid[y] = [];
    }

    for (let x = minX; x < grid[y].length; x++) {
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
                {row.map((cell, x) => (
                  <td key={`c-${y}-${x}`}>
                    {cell ? (
                      <div className="match-card">
                        {cell.teams.map((team) => (
                          <p>{team}</p>
                        ))}
                      </div>
                    ) : null}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Phase2;
