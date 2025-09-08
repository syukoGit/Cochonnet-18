import type { BracketNode, Connector } from './phase2';

type BracketDiagramGrid = Array<
  Array<BracketNode | Connector | null | 'Connector expansion'>
>;

/**
 * Get the maximum depth of a bracket node.
 * @param node The bracket node to evaluate.
 * @param depth The current depth.
 * @returns The maximum depth found.
 */
const getMaxDepth = (node: BracketNode, depth: number): number => {
  const leftNode = node.left ? getMaxDepth(node.left, depth + 1) : 0;
  const rightNode = node.right ? getMaxDepth(node.right, depth + 1) : 0;

  return Math.max(depth, leftNode, rightNode);
};

/**
 * Set the position of a connector in the grid.
 * @param grid The grid to modify.
 * @param nodePos The position of the node.
 * @param parentPos The position of the parent node.
 * @param type The type of connector.
 */
function setConnectorPosition(
  grid: BracketDiagramGrid,
  nodePos: { x: number; y: number },
  parentPos: { x: number; y: number },
  type: 'UpToDown' | 'DownToUp' | 'UpDownToMiddle' | 'Vertical'
) {
  let x;
  let y;

  if (type === 'DownToUp') {
    x = parentPos.x - 1;
    y = parentPos.y;
  } else if (type === 'Vertical') {
    x = nodePos.x;
    y = (nodePos.y < parentPos.y ? nodePos.y : parentPos.y) + 1;
  } else {
    x = nodePos.x + 1;
    y = nodePos.y;
  }

  let length =
    Math.abs(nodePos.y - parentPos.y) + (type === 'Vertical' ? -1 : 1);

  if (type === 'UpDownToMiddle') length = length * 2 - 1;

  if (!grid[y]) {
    grid[y] = [];
  }

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

/**
 * Set the position of a bracket node in the grid.
 * @param node The bracket node to position.
 * @param depth The current depth in the tree.
 * @param parentPos The position of the parent node.
 * @param branch Whether this node is a left or right child.
 * @returns The position of the node in the grid.
 */
function setNodePosition(
  grid: BracketDiagramGrid,
  node: BracketNode,
  depth: number,
  parentPos: { x: number; y: number } | undefined,
  branch: 'left' | 'right',
  maxDepth: number
): { x: number; y: number } {
  let x;
  let y;

  if (maxDepth <= 1) {
    if (!parentPos) {
      x = 2;
      y = 2;
    } else {
      x = 0;
      y = branch === 'left' ? 0 : 4;
    }
  } else if (!parentPos) {
    x = maxDepth * 2;
    y = Math.pow(2, maxDepth) - 1;
  } else {
    x = parentPos.x - 2;
    y =
      branch === 'left'
        ? parentPos.y - Math.pow(2, maxDepth - depth)
        : parentPos.y + Math.pow(2, maxDepth - depth);
  }

  if (!grid[y]) {
    grid[y] = [];
  }

  grid[y][x] = node;

  const leftPos =
    node.left &&
    setNodePosition(grid, node.left, depth + 1, { x, y }, 'left', maxDepth);
  const rightPos =
    node.right &&
    setNodePosition(grid, node.right, depth + 1, { x, y }, 'right', maxDepth);

  if (leftPos && rightPos) {
    setConnectorPosition(grid, leftPos, { x, y }, 'UpDownToMiddle');

    if (node.consolation) {
      grid[y][x - 2] = node.consolation;

      setConnectorPosition(grid, leftPos, { x, y }, 'Vertical');
      setConnectorPosition(grid, rightPos, { x, y }, 'Vertical');
    }
  } else if (leftPos) {
    setConnectorPosition(grid, leftPos, { x, y }, 'UpToDown');
  } else if (rightPos) {
    setConnectorPosition(grid, rightPos, { x, y }, 'DownToUp');
  }

  return { x, y };
}

function generateBracketGrid(activeTree: BracketNode): BracketDiagramGrid {
  const grid: BracketDiagramGrid = [];

  const maxDepth = getMaxDepth(activeTree, 0);

  setNodePosition(grid, activeTree, 0, undefined, 'left', maxDepth);

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

  return grid;
}

export default generateBracketGrid;
