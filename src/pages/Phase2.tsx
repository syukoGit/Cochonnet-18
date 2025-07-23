import { useEffect, useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { generateBracket } from '../utils/phase2';
import type { BracketRound } from '../utils/phase2';
import './Phase2.css';

function Phase2() {
  const groups = useAppSelector((state) => state.event.phase2Groups);
  const [active, setActive] = useState<'winners' | 'consolation'>('winners');
  const [bracket, setBracket] = useState<BracketRound[]>(() => {
    if (!groups) return [];
    return generateBracket(groups.winners);
  });

  useEffect(() => {
    if (groups) {
      setBracket(generateBracket(active === 'winners' ? groups.winners : groups.consolation));
    }
  }, [groups, active]);

  if (!groups) {
    return (
      <div className="phase2-wrapper">
        <h1>Phase 2</h1>
        <p>Aucune donnée</p>
      </div>
    );
  }

  const handleScoreChange = (
    roundIndex: number,
    matchIndex: number,
    field: 'scoreA' | 'scoreB',
    value: string
  ) => {
    const val = value === '' ? undefined : Number(value);
    setBracket((prev) => {
      const updated = prev.map((r) => r.map((m) => ({ ...m })));
      const match = updated[roundIndex][matchIndex];
      if (field === 'scoreA') {
        match.scoreA = val;
      } else {
        match.scoreB = val;
      }
      if (match.teamB === undefined) {
        match.winner = match.teamA;
      } else if (match.scoreA !== undefined && match.scoreB !== undefined) {
        if (match.scoreA > match.scoreB) match.winner = match.teamA;
        else if (match.scoreB > match.scoreA) match.winner = match.teamB;
        else match.winner = undefined;
      } else {
        match.winner = undefined;
      }
      if (updated[roundIndex + 1]) {
        const next = updated[roundIndex + 1][Math.floor(matchIndex / 2)];
        if (matchIndex % 2 === 0) next.teamA = match.winner;
        else next.teamB = match.winner;
      }
      return updated;
    });
  };

  return (
    <div className="phase2-wrapper">
      <h1>Phase 2</h1>
      <div className="phase2-tabs">
        <button
          type="button"
          className={`phase2-tab ${active === 'winners' ? 'active-tab' : ''}`}
          onClick={() => setActive('winners')}
        >
          Tournoi des gagnants
        </button>
        <button
          type="button"
          className={`phase2-tab ${active === 'consolation' ? 'active-tab' : ''}`}
          onClick={() => setActive('consolation')}
        >
          Consolantes
        </button>
      </div>
      <div className="bracket-container">
        {bracket.map((round, rIdx) => (
          <div key={rIdx} className="round-column">
            {round.map((m, mIdx) => (
              <div key={mIdx} className="match-card">
                <div className="team-row">
                  <span>{m.teamA ?? ''}</span>
                  <input
                    className="score-input"
                    type="number"
                    value={m.scoreA ?? ''}
                    onChange={(e) =>
                      handleScoreChange(rIdx, mIdx, 'scoreA', e.target.value)
                    }
                  />
                </div>
                <div className="team-row">
                  <span>{m.teamB ?? ''}</span>
                  <input
                    className="score-input"
                    type="number"
                    value={m.scoreB ?? ''}
                    onChange={(e) =>
                      handleScoreChange(rIdx, mIdx, 'scoreB', e.target.value)
                    }
                  />
                </div>
                <div className="winner-display">{m.winner ?? '-'}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Phase2;
