import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/Button';
import RankingPanel from '@/components/RankingPanel';
import Shell from '@/components/Shell';
import type { TeamId } from '@/domain/ids';
import { BRACKET_PHASES } from '@/domain/match/types';
import type { BracketPhase } from '@/domain/match/types';
import { rankTeams } from '@/domain/phase1/ranking';
import { groupOf, podiumOf } from '@/domain/phase2/podium';
import type { Podium } from '@/domain/phase2/podium';
import type { Tournament } from '@/domain/tournament/types';

interface ResultsProps {
  tournament: Tournament;
  nav: ReactNode;
}

const BRACKET_LABELS: Record<BracketPhase, string> = {
  main: 'Tournoi principal',
  consolation: 'Consolante',
};

const RANKS: { key: keyof Podium; label: string; accent: string }[] = [
  { key: 'first', label: '1re', accent: 'text-accent' },
  { key: 'second', label: '2e', accent: 'text-ink' },
  { key: 'third', label: '3e', accent: 'text-ink-soft' },
];

export default function Results({ tournament, nav }: ResultsProps) {
  const navigate = useNavigate();

  const nameOf = (team: TeamId): string =>
    tournament.teams.find((candidate) => candidate.id === team)?.name ?? `Équipe ${team}`;

  return (
    <Shell
      title={tournament.name}
      nav={nav}
      subtitle="Résultats"
      actions={
        <Button
          onClick={() => {
            void navigate('/');
          }}
        >
          Tournois
        </Button>
      }
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="grid gap-4 md:grid-cols-2">
          {BRACKET_PHASES.map((phase) => {
            const podium = podiumOf(tournament, phase);
            const size = groupOf(tournament, phase).length;

            return (
              <section
                key={phase}
                className="overflow-hidden rounded-panel border border-line bg-surface"
              >
                <header className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-3">
                  <h2 className="font-semibold">{BRACKET_LABELS[phase]}</h2>
                  <span className="text-xs text-ink-faint">
                    {size} {size > 1 ? 'équipes' : 'équipe'}
                  </span>
                </header>

                {size === 0 ? (
                  <p className="px-4 py-8 text-center text-ink-soft">
                    Aucune équipe dans ce groupe.
                  </p>
                ) : (
                  <ul className="divide-y divide-line-soft">
                    {RANKS.map((rank) => {
                      const team = podium[rank.key];

                      return (
                        <li key={rank.key} className="flex items-center gap-3 px-4 py-3">
                          <span
                            className={`w-8 shrink-0 text-sm font-semibold tabular-nums ${rank.accent}`}
                          >
                            {rank.label}
                          </span>
                          <span
                            className={`truncate ${team === null ? 'text-ink-faint italic' : 'font-medium'}`}
                          >
                            {team === null ? 'sans objet' : nameOf(team)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
        </div>

        <RankingPanel
          ranking={rankTeams(tournament).entries}
          nameOf={nameOf}
          provisional={false}
          title="Classement de la phase 1"
        />
      </div>
    </Shell>
  );
}
