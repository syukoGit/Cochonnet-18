import { useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setMatchScore } from '../store/eventSlice';
import { computeRanking } from '../utils/ranking';
import './Phase1.css';

function Phase1() {
  const dispatch = useAppDispatch();
  const { rounds, teams } = useAppSelector((state) => state.event);
  const [activeRound, setActiveRound] = useState(0);

  const ranking = useMemo(() => computeRanking(teams, rounds), [teams, rounds]);
  const roundProgress = useMemo(
    () =>
      rounds.map((round) => {
        const total = round.length;
        const filled = round.filter(
          (m) => m.scoreA !== undefined && m.scoreB !== undefined
        ).length;
        return total === 0 ? 0 : filled / total;
      }),
    [rounds]
  );

  if (rounds.length === 0) {
    return <div>Aucun tirage n'a été généré.</div>;
  }

  const handleScoreChange = (
    roundIndex: number,
    matchIndex: number,
    field: 'scoreA' | 'scoreB',
    value: string
  ) => {
    const parsed = value === '' ? undefined : Number(value);
    const match = rounds[roundIndex][matchIndex];
    const updatedA = field === 'scoreA' ? parsed : match.scoreA;
    const updatedB = field === 'scoreB' ? parsed : match.scoreB;
    dispatch(
      setMatchScore({
        roundIndex,
        matchIndex,
        scoreA: updatedA,
        scoreB: updatedB,
      })
    );
  };

  const scoreClass = (
    a: number | undefined,
    b: number | undefined,
    cell: 'A' | 'B'
  ) => {
    if (a === undefined || b === undefined) return '';
    if (a === b) return '';
    if ((cell === 'A' && a > b) || (cell === 'B' && b > a)) return 'winner';
    return 'loser';
  };

  return (
    <div className="phase1-wrapper">
      <h1>Phase 1</h1>
      <div className="phase1-content">
        <div className="ranking-panel">
          <h2>Classement</h2>
          <div className="ranking-scroll">
            <table className="ranking-table">
              <thead>
                <tr>
                  <th>Classement</th>
                  <th>Équipe</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let currentRank = 0;
                  let prevScore: number | undefined;
                  return ranking.map((entry, idx) => {
                    if (prevScore === undefined || entry.score !== prevScore) {
                      currentRank = idx + 1;
                      prevScore = entry.score;
                    }
                    return (
                      <tr key={entry.team}>
                        <td>{currentRank}</td>
                        <td>{entry.team}</td>
                        <td>{entry.score}</td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
        <div className="divider" aria-hidden="true" />
        <div className="matches-panel">
          <h2>Matchs</h2>
          <div className="tabs">
            {rounds.map((_, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => setActiveRound(idx)}
                className={`${activeRound === idx ? 'active-tab' : ''} round-button`}
              >
                Round {idx + 1}
                <span className="progress-container">
                  <span
                    className="progress-bar"
                    style={{ width: `${roundProgress[idx] * 100}%` }}
                  />
                </span>
              </button>
            ))}
          </div>
          <div className="match-table-container">
            <table className="phase1-table">
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
                    <td
                      className={`score-col ${scoreClass(
                        match.scoreA,
                        match.scoreB,
                        'A'
                      )}`}
                    >
                      <input
                        className="score-input"
                        type="number"
                        min={0}
                        title="Score équipe 1"
                        value={match.scoreA ?? ''}
                        onChange={(e) =>
                          handleScoreChange(
                            activeRound,
                            idx,
                            'scoreA',
                            e.target.value
                          )
                        }
                      />
                    </td>
                    <td
                      className={`score-col ${scoreClass(
                        match.scoreA,
                        match.scoreB,
                        'B'
                      )}`}
                    >
                      <input
                        className="score-input"
                        type="number"
                        min={0}
                        title="Score équipe 2"
                        value={match.scoreB ?? ''}
                        onChange={(e) =>
                          handleScoreChange(
                            activeRound,
                            idx,
                            'scoreB',
                            e.target.value
                          )
                        }
                      />
                    </td>
                    <td>{match.teamB}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Phase1;
