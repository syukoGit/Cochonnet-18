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

  // collect nodes by depth (root depth = 0)
  const nodesByDepth = new Map<number, BracketNode[]>();
  let maxDepth = 0;
  function traverse(node: BracketNode | null, depth = 0) {
    if (!node) return;
    if (!nodesByDepth.has(depth)) nodesByDepth.set(depth, []);
    nodesByDepth.get(depth)!.push(node);
    if (depth > maxDepth) maxDepth = depth;
    // traverse left then right to keep top-to-bottom order
    traverse(node.left ?? null, depth + 1);
    traverse(node.right ?? null, depth + 1);
  }

  traverse(activeTree, 0);

  const p = maxDepth;

  // Option B layout: leaves placed at rows 0,2,4,... (one empty row between leaves).
  // Parents are placed at the integer average of their children's rows.
  const leaves = nodesByDepth.get(p) || [];
  const positions = new Map<BracketNode, number>();
  // assign leaves
  leaves.forEach((node, i) => positions.set(node, i * 2));

  // compute parent positions bottom-up
  let maxRow = leaves.length ? (leaves.length - 1) * 2 : 0;

  for (let depth = p - 1; depth >= 0; depth--) {
    const nodes = nodesByDepth.get(depth) || [];

    for (const node of nodes) {
      const left = node.left ?? null;
      const right = node.right ?? null;

      if (left && positions.has(left) && right && positions.has(right)) {
        const r = Math.floor(
          (positions.get(left)! + positions.get(right)!) / 2
        );
        positions.set(node, r);
      } else if (left && positions.has(left)) {
        positions.set(node, positions.get(left)!);
      } else if (right && positions.has(right)) {
        positions.set(node, positions.get(right)!);
      } else {
        // fallback: place below current max
        maxRow += 1;
        positions.set(node, maxRow);
      }
      if (positions.get(node)! > maxRow) maxRow = positions.get(node)!;
    }
  }

  const totalRows = Math.max(1, maxRow + 1);

  // build columns from deepest (p) to root (0). left -> right: p .. 0
  const depths: number[] = [];
  for (let d = p; d >= 0; d--) depths.push(d);

  // grid[row][colIndex] = node | null
  const cols = depths.length;
  const grid: Array<Array<BracketNode | null>> = Array.from(
    { length: totalRows },
    () => Array.from({ length: cols }, () => null)
  );

  depths.forEach((depth, colIdx) => {
    const nodes = nodesByDepth.get(depth) || [];
    nodes.forEach((node) => {
      const row = positions.get(node) ?? 0;
      // safety clamp
      const r = Math.max(0, Math.min(totalRows - 1, row));
      grid[r][colIdx] = node;
    });
  });

  // no connectors: rendering only table

  // debug summary to help diagnose empty grids
  const debugSummary = {
    rootId: activeTree?.id ?? null,
    p,
    totalRows,
    nodesByDepthCounts: Array.from(nodesByDepth.entries()).reduce(
      (acc: Record<string, number>, [d, arr]) => ({ ...acc, [d]: arr.length }),
      {}
    ),
    positionsById: Array.from(positions.entries()).reduce(
      (acc: Record<string, number>, [node, pos]) => ({
        ...acc,
        [node.id]: pos,
      }),
      {}
    ),
  };

  if (!grid.some((r) => r.some((c) => c !== null))) {
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
        <div className="debug-summary">
          {JSON.stringify(debugSummary, null, 2)}
        </div>
      </div>
    );
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
            {grid.map((rowCells, rowIdx) => (
              <tr key={`r-${rowIdx}`}>
                {rowCells.map((cellNode, colIdx) => (
                  <td
                    key={`c-${colIdx}`}
                    className={cellNode ? 'match-cell' : 'empty-cell'}
                  >
                    {cellNode ? (
                      <div className="match-card">
                        {(cellNode.teams || []).map((t: string, k: number) => (
                          <div
                            key={k}
                            className="team-line"
                            role="button"
                            onClick={() => console.log('click', t)}
                          >
                            {t}
                          </div>
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
