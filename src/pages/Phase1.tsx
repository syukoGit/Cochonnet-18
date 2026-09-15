import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/Button';
import Shell from '@/components/Shell';
import { isBye, opponents } from '@/domain/match/types';
import type { Match } from '@/domain/match/types';
import type { TeamId, Tournament } from '@/domain/tournament/types';

interface Phase1Props {
  tournament: Tournament;
}

function roundsOf(matches: Match[]): number[] {
  return [...new Set(matches.map((match) => match.round))].sort((a, b) => a - b);
}

export default function Phase1({ tournament }: Phase1Props) {
  const navigate = useNavigate();
  const rounds = roundsOf(tournament.matches);
  const [activeRound, setActiveRound] = useState(rounds[0] ?? 1);

  const nameOf = (team: TeamId): string =>
    tournament.teams.find((candidate) => candidate.id === team)?.name ?? `Équipe ${team}`;

  const inRound = tournament.matches.filter((match) => match.round === activeRound);
  const played = inRound.filter((match) => !isBye(match));
  const resting = inRound.filter(isBye).flatMap(opponents);

  return (
    <Shell
      title={tournament.name}
      subtitle={`Phase 1 · ${rounds.length} ${rounds.length > 1 ? 'tours' : 'tour'} · ${tournament.teams.length} équipes`}
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
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-4 flex flex-wrap gap-2">
          {rounds.map((round) => (
            <Button
              key={round}
              tone={round === activeRound ? 'primary' : 'quiet'}
              onClick={() => {
                setActiveRound(round);
              }}
            >
              Tour {round}
            </Button>
          ))}
        </div>

        <ul className="divide-y divide-line-soft overflow-hidden rounded-panel border border-line bg-surface">
          {played.map((match) => {
            const [home, away] = opponents(match);

            return (
              <li
                key={match.id}
                className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-3"
              >
                <span className="truncate text-right">
                  {home === undefined ? '' : nameOf(home)}
                </span>
                <span className="text-sm text-ink-faint">contre</span>
                <span className="truncate">{away === undefined ? '' : nameOf(away)}</span>
              </li>
            );
          })}
        </ul>

        {resting.length > 0 && (
          <p className="mt-4 rounded-panel border border-line bg-sunken px-4 py-3 text-sm">
            <span className="text-ink-soft">Exemptée ce tour :</span>{' '}
            <span className="font-medium">{resting.map(nameOf).join(', ')}</span>
          </p>
        )}
      </div>
    </Shell>
  );
}
