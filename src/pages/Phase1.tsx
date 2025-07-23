import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setMatchScore } from '../store/eventSlice';
import './Phase1.css';

function Phase1() {
  const dispatch = useAppDispatch();
  const { rounds } = useAppSelector((state) => state.event);
  const [activeRound, setActiveRound] = useState(0);

  if (rounds.length === 0) {
    return <div>Aucun tirage n'a été généré.</div>;
  }

  const handleScoreChange = (
    roundIndex: number,
    matchIndex: number,
    field: 'scoreA' | 'scoreB',
    value: string,
  ) => {
    const parsed = value === '' ? undefined : Number(value);
    const match = rounds[roundIndex][matchIndex];
    const updatedA = field === 'scoreA' ? parsed : match.scoreA;
    const updatedB = field === 'scoreB' ? parsed : match.scoreB;
    dispatch(
      setMatchScore({ roundIndex, matchIndex, scoreA: updatedA, scoreB: updatedB }),
    );
  };

  const scoreClass = (
    a: number | undefined,
    b: number | undefined,
    cell: 'A' | 'B',
  ) => {
    if (a === undefined || b === undefined) return '';
    if (a === b) return '';
    if ((cell === 'A' && a > b) || (cell === 'B' && b > a)) return 'winner';
    return 'loser';
  };

  return (
    <div className="phase1-wrapper">
      <div className="tabs">
        {rounds.map((_, idx) => (
          <button
            type="button"
            key={idx}
            onClick={() => setActiveRound(idx)}
            className={activeRound === idx ? 'active-tab' : ''}
          >
            Round {idx + 1}
          </button>
        ))}
      </div>
      <table>
        <thead>
          <tr>
            <th>Équipe 1</th>
            <th className="score-col">Score 1</th>
            <th className="score-col">Score 2</th>
            <th>Équipe 2</th>
          </tr>
        </thead>
        <tbody>
          {rounds[activeRound].map((match, idx) => (
            <tr key={idx}>
              <td>{match.teamA}</td>
              <td className={`score-col ${scoreClass(match.scoreA, match.scoreB, 'A')}`}>
                <input
                  className="score-input"
                  type="number"
                  min={0}
                  title="Score équipe 1"
                  value={match.scoreA ?? ''}
                  onChange={(e) =>
                    handleScoreChange(activeRound, idx, 'scoreA', e.target.value)
                  }
                />
              </td>
              <td className={`score-col ${scoreClass(match.scoreA, match.scoreB, 'B')}`}>
                <input
                  className="score-input"
                  type="number"
                  min={0}
                  title="Score équipe 2"
                  value={match.scoreB ?? ''}
                  onChange={(e) =>
                    handleScoreChange(activeRound, idx, 'scoreB', e.target.value)
                  }
                />
              </td>
              <td>{match.teamB}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Phase1;
