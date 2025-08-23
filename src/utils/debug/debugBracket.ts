import { generateBracketTree, visualizeBracket } from '../phase2.ts';

function debugVisualizeBracket(teamNames: string[]) {
  console.log('---', `(${teamNames.length} teams)`);
  // Convert team names to mock IDs for debugging
  const teamIds = teamNames.map((_, index) => index + 1);
  const teams = teamNames.map((name, index) => ({ id: index + 1, name }));
  
  const root = generateBracketTree(teamIds);
  console.log(visualizeBracket(root, teams));
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
