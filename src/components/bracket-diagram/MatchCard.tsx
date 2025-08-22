import './MatchCard.css';
import type { BracketNode } from '../../utils/phase2';
import { useAppDispatch } from '../../store/hooks';
import { setPhase2Winner } from '../../store/eventSlice';

interface Props {
  node: BracketNode;
  tree: 'winners' | 'consolation';
}

export default function MatchCard({ node, tree }: Props) {
  const dispatch = useAppDispatch();
  // Only allow clicking when there are exactly two non-empty team names
  const isClickable =
    !!node.teams &&
    node.teams.length === 2 &&
    (node.teams[0] ?? '').trim() !== '' &&
    (node.teams[1] ?? '').trim() !== '';

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
      <p
        className={`team ${isClickable ? 'clickable' : ''} ${
          isWinner0 ? 'winner' : ''
        }`}
        onClick={() => handleClick(0)}
      >
        {isWinner0 && <span className="crown">👑</span>}
        <span className="team-name">{node.teams ? node.teams[0] : ''}</span>
      </p>
      <div className="h-divider" />
      <p
        className={`team ${isClickable ? 'clickable' : ''} ${
          isWinner1 ? 'winner' : ''
        }`}
        onClick={() => handleClick(1)}
      >
        {isWinner1 && <span className="crown">👑</span>}
        <span className="team-name">{node.teams ? node.teams[1] : ''}</span>
      </p>
    </div>
  );
}
