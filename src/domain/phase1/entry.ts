import { isBye } from '@/domain/match/types';
import type { Tournament } from '@/domain/tournament/types';

export function phase1SettingsLocked(tournament: Tournament): boolean {
  return tournament.matches.some(
    (match) => match.phase === 'phase1' && !isBye(match) && match.status !== 'waiting'
  );
}
