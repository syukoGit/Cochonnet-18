export function splitPhase2Groups(teams: string[]): {
  winners: string[];
  consolation: string[];
} {
  const n = teams.length;
  if (n === 0) return { winners: [], consolation: [] };

  let winnersCount: number;
  let consolationCount: number;

  if (n % 2 === 1) {
    winnersCount = Math.ceil(n / 2);
    consolationCount = n - winnersCount;
  } else {
    winnersCount = n / 2;
    consolationCount = n / 2;
    if (n % 4 !== 0) {
      winnersCount += 1;
      consolationCount -= 1;
    }
  }

  const winners = teams.slice(0, winnersCount);
  const consolation = teams.slice(
    winnersCount,
    winnersCount + consolationCount
  );
  return { winners, consolation };
}

import type { Round } from './schedule';

export function getPlayedPairs(rounds: Round[]): Set<string> {
  const pairs = new Set<string>();
  const key = (a: string, b: string) => [a, b].sort().join('|');
  for (const round of rounds) {
    for (const { teamA, teamB } of round) {
      pairs.add(key(teamA, teamB));
    }
  }
  return pairs;
}

/**
 * Tree node for the bracket.
 * - `teams` contains 0..2 teams (leaves contain the initial teams).
 * - `left` and `right` are the children. `right` may be absent to handle odd cases.
 */
export interface BracketNode {
  id: string;
  teams: string[]; // 0..2
  left?: BracketNode;
  right?: BracketNode;
}

/**
 * Generates a binary bracket tree from a list of teams.
 * Implemented rules:
 * - Only a single root node is returned.
 * - Parent nodes are created by grouping 2 child nodes.
 * - Leaves contain up to 2 teams (pairs). If the number of teams is odd,
 *   the leftover team is attached to the parent above.
 * - If a level has an odd number of nodes, the last parent may have a single child (special case).
 * - Branches can have different heights.
 */
export function generateBracketTree(teams: string[]): BracketNode | null {
  if (!teams || teams.length === 0) return null;

  // Create leaves: each leaf contains 2 teams; if there's a remaining team (odd),
  // keep it in `leftoverTeam` to attach directly to the parent above.
  const leaves: BracketNode[] = [];
  let leftoverTeam: string | undefined = undefined;
  let i = 0;
  for (; i + 1 < teams.length; i += 2) {
    leaves.push({ id: `n${leaves.length}`, teams: [teams[i], teams[i + 1]] });
  }
  if (i < teams.length) leftoverTeam = teams[i];

  // If there is a leftover team and at least one leaf exists,
  // attach this team into a parent node above the last leaf.
  if (leftoverTeam !== undefined) {
    if (leaves.length === 0) {
      // Only case where there was a single team: return a root node with that team
      return { id: `n0`, teams: [leftoverTeam] };
    }
    const lastLeaf = leaves.pop() as BracketNode;
    const parent: BracketNode = {
      id: `n${leaves.length}`,
      teams: [leftoverTeam],
      left: lastLeaf,
    };
    leaves.push(parent);
  }

  // Build the tree upward by grouping 2 nodes into a parent (left->right).
  let level = leaves;
  let idCounter = leaves.length;
  while (level.length > 1) {
    const nextLevel: BracketNode[] = [];
    for (let j = 0; j < level.length; j += 2) {
      const left = level[j];
      const right = j + 1 < level.length ? level[j + 1] : undefined;
      if (right) {
        const parent: BracketNode = {
          id: `n${idCounter++}`,
          teams: [],
          left,
          right,
        };
        nextLevel.push(parent);
      } else {
        // carry over the unpaired node to next level
        nextLevel.push(left);
      }
    }
    level = nextLevel;
  }

  // level[0] is the root node
  return level[0] || null;
}

/**
 * Return an indented text visualization of the tree (multi-line).
 * Example:
 * n7 []
 *   n3 []
 *     n0 [A,B]
 *     n1 [C,D]
 *   n6 [E]
 */
export function visualizeBracket(root: BracketNode | null): string {
  if (!root) return '(empty)';

  const lines: string[] = [];

  function nodeLabel(node: BracketNode) {
    const teams =
      node.teams && node.teams.length > 0 ? node.teams.join(',') : '';
    return teams ? `${node.id} [${teams}]` : `${node.id}`;
  }

  // Pre-order rendering with ASCII connectors using dashes
  function render(
    node: BracketNode | undefined,
    prefix = '',
    isTail = true,
    depth = 0
  ) {
    if (!node) return;
    const label = nodeLabel(node);
    // root (depth === 0) has no connector
    const connector = depth === 0 ? '' : isTail ? '`-- ' : '|-- ';
    lines.push(prefix + connector + label);

    const children: BracketNode[] = [];
    if (node.left) children.push(node.left);
    if (node.right) children.push(node.right);

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const last = i === children.length - 1;
      const newPrefix = prefix + (isTail ? '    ' : '|   ');
      render(child, newPrefix, last, depth + 1);
    }
  }

  render(root, '', true);
  return lines.join('\n');
}
