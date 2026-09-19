import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/Button';
import Rail, { RailBack, RailBrand, RailTitle } from '@/components/Rail';
import RankingPanel from '@/components/RankingPanel';
import Shell from '@/components/Shell';
import { IconExport } from '@/components/icons';
import type { TeamId } from '@/domain/ids';
import { BRACKET_PHASES } from '@/domain/match/types';
import type { BracketPhase } from '@/domain/match/types';
import { rankTeams } from '@/domain/phase1/ranking';
import { groupOf, podiumOf } from '@/domain/phase2/podium';
import type { Podium } from '@/domain/phase2/podium';
import type { Tournament } from '@/domain/tournament/types';
import { useTournaments } from '@/store/useTournaments';

interface ResultsProps {
  tournament: Tournament;
  nav: ReactNode;
}

const BRACKET_LABELS: Record<BracketPhase, string> = {
  main: 'Tournoi principal',
  consolation: 'Consolante',
};

const RANKS: { key: keyof Podium; label: string; badge: string }[] = [
  { key: 'first', label: '1', badge: 'bg-accent text-accent-ink' },
  { key: 'second', label: '2', badge: 'bg-ink-faint text-surface' },
  { key: 'third', label: '3', badge: 'bg-warning text-surface' },
];

export default function Results({ tournament, nav }: ResultsProps) {
  const navigate = useNavigate();
  const { exportTournament } = useTournaments();

  const nameOf = (team: TeamId): string =>
    tournament.teams.find((candidate) => candidate.id === team)?.name ?? `Équipe ${team}`;

  const rail = (
    <Rail>
      <RailBrand />
      <RailTitle name={tournament.name} meta={`${tournament.teams.length} équipes · terminé`} />
      {nav}
      <Button
        tone="rail"
        onClick={() => {
          void exportTournament(tournament.id);
        }}
      >
        <IconExport size={16} />
        Exporter le tournoi
      </Button>
      <RailBack
        onClick={() => {
          void navigate('/');
        }}
      />
    </Rail>
  );

  return (
    <Shell
      rail={rail}
      eyebrow="Étape 5 sur 5"
      eyebrowTone="success"
      title="Résultats"
      lead="Rien n'est figé : une correction en phase 2 met ces podiums à jour."
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          {BRACKET_PHASES.map((phase) => {
            const podium = podiumOf(tournament, phase);
            const size = groupOf(tournament, phase).length;
            const hero = phase === 'main';

            return (
              <section
                key={phase}
                className={`overflow-hidden rounded-card border ${hero ? 'border-accent/40 bg-accent-ground/40' : 'border-line bg-surface'}`}
              >
                <header className="flex items-baseline justify-between gap-3 px-4 pt-4 pb-3">
                  <h2 className="font-display text-lg font-semibold">{BRACKET_LABELS[phase]}</h2>
                  <span className="text-xs text-ink-soft">
                    {size} {size > 1 ? 'équipes' : 'équipe'}
                  </span>
                </header>

                {size === 0 ? (
                  <p className="px-4 py-10 text-center text-ink-soft">
                    Aucune équipe dans ce groupe.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-1.5 px-3 pb-3">
                    {RANKS.map((rank, index) => {
                      const team = podium[rank.key];

                      return (
                        <li
                          key={rank.key}
                          className={`flex min-h-[50px] items-center gap-3 rounded-panel px-3.5 ${index === 0 ? 'border border-line bg-surface' : ''}`}
                        >
                          <span
                            className={`flex size-7 shrink-0 items-center justify-center rounded-full font-display text-[13px] font-bold ${rank.badge}`}
                          >
                            {rank.label}
                          </span>
                          <span
                            className={`min-w-0 truncate ${team === null ? 'text-ink-faint italic' : index === 0 ? 'font-display text-lg font-semibold' : 'font-medium'}`}
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
