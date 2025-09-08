import { useAppSelector } from '../store/hooks';
import { useState } from 'react';
import type { BracketNode } from '../utils/phase2';
import './Phase2.css';
import BracketDiagram from '../components/bracket-diagram/BracketDiagram';

function Phase2() {
  const phase2Brackets = useAppSelector((state) => state.event.phase2Brackets);
  const [active, setActive] = useState<'winners' | 'consolation'>('winners');

  // Prepare both trees (use store values if present). Trees are pre-generated
  // when `setPhase2Groups` is called in the store; do not generate here.
  const winnersTree: BracketNode | null = phase2Brackets?.winners ?? null;
  const consolationTree: BracketNode | null =
    phase2Brackets?.consolation ?? null;

  const activeTree: BracketNode | null =
    active === 'winners' ? winnersTree : consolationTree;

  if (!activeTree) {
    return (
      <div className="phase2-wrapper">
        <h1>Phase 2</h1>
        <p>Aucune donnée</p>
      </div>
    );
  }

  return (
    <div className="phase2-wrapper">
      <h1>Phase 2</h1>
      <h2>{active === 'winners' ? 'Tournoi des gagnants' : 'Consolantes'}</h2>
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
          className={`phase2-tab ${
            active === 'consolation' ? 'active-tab' : ''
          }`}
          onClick={() => setActive('consolation')}
        >
          Consolantes
        </button>
      </div>
      <div className="bracket-container">
        <BracketDiagram rootNode={activeTree} activeTree={active} />
      </div>
    </div>
  );
}

export default Phase2;
