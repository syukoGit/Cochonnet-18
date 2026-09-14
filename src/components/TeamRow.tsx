import { useEffect, useState } from 'react';
import Button from '@/components/Button';
import type { TeamNameIssue } from '@/domain/tournament/teams';
import type { Team } from '@/domain/tournament/types';

const ISSUE_MESSAGES: Record<TeamNameIssue, string> = {
  empty: 'Le nom ne peut pas être vide.',
  duplicate: 'Une autre équipe porte déjà ce nom.',
};

interface TeamRowProps {
  team: Team;
  issueOf: (name: string) => TeamNameIssue | null;
  onRename: (name: string) => void;
  onRemove: () => void;
}

export default function TeamRow({ team, issueOf, onRename, onRemove }: TeamRowProps) {
  const [draft, setDraft] = useState(team.name);

  useEffect(() => {
    setDraft(team.name);
  }, [team.name]);

  const issue = draft === team.name ? null : issueOf(draft);

  const commit = () => {
    if (issue !== null) {
      setDraft(team.name);
      return;
    }

    onRename(draft);
  };

  return (
    <li className="flex items-start gap-2 px-4 py-2">
      <span className="w-10 pt-2 text-right font-mono text-sm text-ink-faint">{team.id}</span>
      <div className="flex-1">
        <input
          value={draft}
          onChange={(changeEvent) => {
            setDraft(changeEvent.target.value);
          }}
          onBlur={commit}
          onKeyDown={(keyEvent) => {
            if (keyEvent.key === 'Enter') {
              keyEvent.currentTarget.blur();
            }
            if (keyEvent.key === 'Escape') {
              setDraft(team.name);
            }
          }}
          aria-label={`Nom de l'équipe ${team.id}`}
          className="w-full rounded-panel border border-transparent bg-transparent px-3 py-2 hover:border-line focus-visible:border-line focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
        />
        {issue && <p className="mt-1 px-3 text-sm text-warning">{ISSUE_MESSAGES[issue]}</p>}
      </div>
      <Button tone="danger" onClick={onRemove}>
        Retirer
      </Button>
    </li>
  );
}
