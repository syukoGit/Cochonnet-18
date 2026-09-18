import { useEffect, useState } from 'react';
import IconButton from '@/components/IconButton';
import { IconTrash } from '@/components/icons';
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
    <li className="flex items-center gap-3 border-b border-line-soft py-1 pr-2 pl-4 last:border-b-0">
      <span className="w-7 shrink-0 text-right font-mono text-xs text-ink-faint">{team.id}</span>
      <div className="min-w-0 flex-1">
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
          className="h-10 w-full rounded-panel border border-transparent bg-transparent px-2.5 hover:border-line focus-visible:border-line focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
        />
        {issue && <p className="px-2.5 pb-1 text-xs text-warning">{ISSUE_MESSAGES[issue]}</p>}
      </div>
      <IconButton tone="ghost" label={`Retirer ${team.name}`} onClick={onRemove}>
        <IconTrash size={16} />
      </IconButton>
    </li>
  );
}
