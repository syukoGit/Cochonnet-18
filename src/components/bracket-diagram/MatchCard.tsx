import './MatchCard.css';
import type { BracketNode } from '../../utils/phase2';
import type { Team } from '../../store/eventSlice';
import { useAppDispatch } from '../../store/hooks';
import { setPhase2Winner } from '../../store/eventSlice';

interface Props {
  node: BracketNode;
  tree: 'winners' | 'consolation';
  teams: Team[];
}

export default function MatchCard({ node, tree, teams }: Props) {
  const dispatch = useAppDispatch();
  
  // Create a map for quick team lookup
  const teamMap = new Map(teams.map(team => [team.id, team]));
  
  // Get team information from IDs
  const team0 = node.teams?.[0] ? teamMap.get(node.teams[0]) : undefined;
  const team1 = node.teams?.[1] ? teamMap.get(node.teams[1]) : undefined;
  
  // Only allow clicking when there are exactly two valid teams
  const isClickable = !!(team0 && team1);

  const handleClick = (teamIndex: number) => {
    if (!isClickable) return;
    dispatch(
      setPhase2Winner({ nodeId: node.id, winnerIndex: teamIndex, tree })
    );
  };

  const isWinner0 = node.winnerIndex === 0;
  const isWinner1 = node.winnerIndex === 1;

  return (
    <div className="match-card">
      <div
        className={`team ${isClickable ? 'clickable' : ''} ${
          isWinner0 ? 'winner' : ''
        }`}
        onClick={() => handleClick(0)}
      >
        {isWinner0 && <span className="crown">👑</span>}
        <div className="team-display">
          {team0 && <div className="team-id">{team0.id}</div>}
          <div className="team-name">
            {team0 ? team0.name : ''}
          </div>
        </div>
      </div>
      <div className="h-divider" />
      <div
        className={`team ${isClickable ? 'clickable' : ''} ${
          isWinner1 ? 'winner' : ''
        }`}
        onClick={() => handleClick(1)}
      >
        {isWinner1 && <span className="crown">👑</span>}
        <div className="team-display">
          {team1 && <div className="team-id">{team1.id}</div>}
          <div className="team-name">
            {team1 ? team1.name : ''}
          </div>
        </div>
      </div>
    </div>
  );
}
