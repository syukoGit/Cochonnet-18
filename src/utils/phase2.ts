export function splitPhase2Groups(teamIds: number[]): {
  winners: number[];
  consolation: number[];
} {
  const n = teamIds.length;
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

  const winners = teamIds.slice(0, winnersCount);
  const consolation = teamIds.slice(
    winnersCount,
    winnersCount + consolationCount
  );
  return { winners, consolation };
}

/**
 * Tree node for the bracket.
 * - `teams` contains 0..2 teams (leaves contain the initial teams).
 * - `left` and `right` are the children. `right` may be absent to handle odd cases.
 */
export interface BracketNode {
  id: string;
  teams: number[]; // team IDs (0..2)
  left?: BracketNode;
  right?: BracketNode;
  // index of the winning team within `teams` (0 or 1). Undefined when not set.
  winnerIndex?: number;
  // optional consolation pair (two teams for the 3rd-place match)
  consolation?: BracketNode;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isBracketNode(cell: any): cell is BracketNode {
  return (
    cell &&
    typeof cell === 'object' &&
    typeof cell.id === 'string' &&
    'teams' in cell &&
    Array.isArray(cell.teams)
  );
}

export interface Connector {
  length: number;
  type: 'UpToDown' | 'DownToUp' | 'UpDownToMiddle' | 'Vertical';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isConnector(cell: any): cell is Connector {
  return (
    cell &&
    typeof cell === 'object' &&
    typeof cell.length === 'number' &&
    (cell.type === 'UpToDown' ||
      cell.type === 'DownToUp' ||
      cell.type === 'UpDownToMiddle' ||
      cell.type === 'Vertical')
  );
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
export function generateBracketTree(teamIds: number[]): BracketNode | null {
  if (!teamIds || teamIds.length === 0) return null;

  // Create leaves: each leaf contains 2 team IDs; if there's a remaining team (odd),
  // keep it in `leftoverTeam` to attach directly to the parent above.
  const leaves: BracketNode[] = [];
  let leftoverTeam: number | undefined = undefined;
  let i = 0;
  for (; i + 1 < teamIds.length; i += 2) {
    leaves.push({ id: `n${leaves.length}`, teams: [teamIds[i], teamIds[i + 1]] });
  }
  if (i < teamIds.length) leftoverTeam = teamIds[i];

  // If there is a leftover team and at least one leaf exists,
  // attach this team into a parent node above the last leaf.
  if (leftoverTeam !== undefined) {
    if (leaves.length === 0) {
      // Only case where there was a single team: return a root node with that team
      return { id: `n0`, teams: [leftoverTeam] };
    }
    const lastLeaf = leaves.pop() as BracketNode;
    const parent: BracketNode = {
      id: `n${leaves.length + 1}`,
      teams: [leftoverTeam],
      right: lastLeaf,
    };
    leaves.push(parent);
  }

  // Build the tree upward by grouping 2 nodes into a parent (left->right).
  let level = leaves;
  let idCounter =
    leftoverTeam !== undefined ? leaves.length + 1 : leaves.length;
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
  const root = level[0] || null;

  // Prefer immediate children of the root as semifinal nodes (they represent the two halves).
  if (root) {
    let s1: BracketNode | undefined = undefined;
    let s2: BracketNode | undefined = undefined;

    if (root.left && root.right) {
      s1 = root.left;
      s2 = root.right;
    } else {
      // fallback: Detect semifinal nodes: nodes whose both children are leaves (no children of their own)
      const semis: BracketNode[] = [];
      function findSemis(n?: BracketNode) {
        if (!n) return;
        if (n.left && n.right) {
          const l = n.left;
          const r = n.right;
          const leftIsLeaf = !l.left && !l.right;
          const rightIsLeaf = !r.left && !r.right;
          if (leftIsLeaf && rightIsLeaf) semis.push(n);
        }
        findSemis(n.left);
        findSemis(n.right);
      }
      findSemis(root);
      if (semis.length >= 2) {
        s1 = semis[0];
        s2 = semis[1];
      }
    }

    // If we found two semifinal nodes, record their losers as the consolation match teams
    if (s1 && s2) {
      root.consolation = {
        id: 'consolation',
        teams: [],
      };
    }
  }

  return root;
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
export function visualizeBracket(root: BracketNode | null, teams: { id: number; name: string }[] = []): string {
  if (!root) return '(empty)';

  const lines: string[] = [];
  const teamMap = new Map(teams.map(t => [t.id, t.name]));

  function nodeLabel(node: BracketNode) {
    const teamNames = node.teams && node.teams.length > 0 
      ? node.teams.map(id => teamMap.get(id) || `ID${id}`).join(',')
      : '';
    return teamNames ? `${node.id} [${teamNames}]` : `${node.id}`;
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
  // if there's a consolation subtree (3rd-place match), render it after the main tree
  if (root && root.consolation) {
    lines.push('');
    lines.push('Consolation (3rd-place):');
    const [t1, t2] = root.consolation.teams;
    const team1Name = teamMap.get(t1) || `ID${t1}`;
    const team2Name = teamMap.get(t2) || `ID${t2}`;
    lines.push(`  ${team1Name} vs ${team2Name}`);
  }
  return lines.join('\n');
}
