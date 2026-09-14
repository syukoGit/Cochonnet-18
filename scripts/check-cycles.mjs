import { globSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const files = globSync('{src,electron}/**/*.{ts,tsx}');

function resolveSpecifier(from, specifier) {
  const base = specifier.startsWith('@/')
    ? join('src', specifier.slice(2))
    : specifier.startsWith('.')
      ? join(dirname(from), specifier)
      : null;

  if (base === null) {
    return null;
  }

  return (
    files.find(
      (candidate) =>
        candidate === `${base}.ts` ||
        candidate === `${base}.tsx` ||
        candidate === join(base, 'index.ts')
    ) ?? null
  );
}

const graph = new Map(
  files.map((file) => [
    file,
    [...readFileSync(file, 'utf8').matchAll(/from\s+'([^']+)'/g)]
      .map((match) => resolveSpecifier(file, match[1]))
      .filter((target) => target !== null),
  ])
);

const cycles = [];
const visited = new Set();

function walk(node, stack) {
  if (stack.includes(node)) {
    cycles.push([...stack.slice(stack.indexOf(node)), node]);
    return;
  }

  if (visited.has(node)) {
    return;
  }

  visited.add(node);

  for (const next of graph.get(node) ?? []) {
    walk(next, [...stack, node]);
  }
}

for (const file of files) {
  walk(file, []);
}

if (cycles.length > 0) {
  console.error(`Import cycles found in ${cycles.length} place(s):`);
  for (const cycle of cycles) {
    console.error('  ' + cycle.join(' -> '));
  }
  console.error('\nA cycle makes the TypeScript language server resolve types to `error` in some');
  console.error('tools and not others, so the CLI can pass while the editor reports nonsense.');
  process.exit(1);
}

console.log(`No import cycle across ${files.length} files.`);
