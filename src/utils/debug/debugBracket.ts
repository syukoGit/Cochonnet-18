import { generateBracketTree, visualizeBracket } from '../phase2.ts';

function debugVisualizeBracket(teams: string[]) {
  console.log('---', `(${teams.length} teams)`);
  const root = generateBracketTree(teams);
  console.log(visualizeBracket(root));
  console.log('');
}

// Example with 12 teams
debugVisualizeBracket([
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
]);

// Example with 5 teams
debugVisualizeBracket(['A', 'B', 'C', 'D', 'E']);

// Example with 1 team
debugVisualizeBracket(['A']);

// Example with no teams
debugVisualizeBracket([]);

// Example with 3 teams
debugVisualizeBracket(['A', 'B', 'C']);

// Example with 4 teams
debugVisualizeBracket(['A', 'B', 'C', 'D']);

// Example with 6 teams
debugVisualizeBracket(['A', 'B', 'C', 'D', 'E', 'F']);
