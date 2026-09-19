import type { ReactNode } from 'react';
import IconButton from '@/components/IconButton';
import { IconMinus, IconPlus } from '@/components/icons';
import { maxMatchCount } from '@/domain/phase1/draw';
import { BYE_POINTS_MODES } from '@/domain/tournament/settings';
import type { ByePointsMode, Settings } from '@/domain/tournament/settings';
import type { Tournament } from '@/domain/tournament/types';

const BYE_POINTS_LABELS: Record<ByePointsMode, string> = {
  average: 'sa propre moyenne',
  zero: 'aucun point',
  forfeit13: 'un forfait gagné (+13)',
};

const NUMBER_FIELD =
  'h-11 w-20 rounded-panel border border-line bg-ground px-3 text-right font-display text-lg font-bold tabular-nums disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent';

interface FieldProps {
  id: string;
  label: string;
  hint: string;
  children: ReactNode;
}

function Field({ id, label, hint, children }: FieldProps) {
  return (
    <div className="flex items-start gap-4 px-4 py-3.5">
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="text-[14.5px] font-semibold">
          {label}
        </label>
        <p className="mt-0.5 text-[13px] leading-relaxed text-ink-soft">{hint}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  );
}

interface SettingsPanelProps {
  tournament: Tournament;
  disabled?: boolean;
  includeMatchCount?: boolean;
  onMatchCountChange: (matchCount: number) => void;
  onSettingChange: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

export default function SettingsPanel({
  tournament,
  disabled = false,
  includeMatchCount = true,
  onMatchCountChange,
  onSettingChange,
}: SettingsPanelProps) {
  const limit = maxMatchCount(tournament.teams.length);
  const outOfRange = tournament.matchCount < 1 || tournament.matchCount > limit;

  return (
    <div className="divide-y divide-line-soft overflow-hidden rounded-card border border-line bg-surface">
      {includeMatchCount && (
        <Field
          id="setting-match-count"
          label="Matchs par équipe"
          hint={
            limit === 0
              ? 'Ajoute au moins deux équipes.'
              : `Entre 1 et ${limit} pour ${tournament.teams.length} équipes.`
          }
        >
          <IconButton
            label="Un tour de moins"
            disabled={disabled || tournament.matchCount <= 1}
            onClick={() => {
              onMatchCountChange(tournament.matchCount - 1);
            }}
          >
            <IconMinus size={16} />
          </IconButton>
          <input
            id="setting-match-count"
            type="number"
            min={1}
            max={Math.max(limit, 1)}
            value={tournament.matchCount}
            disabled={disabled}
            onChange={(changeEvent) => {
              onMatchCountChange(Number(changeEvent.target.value));
            }}
            className={outOfRange ? `${NUMBER_FIELD} border-warning text-warning` : NUMBER_FIELD}
          />
          <IconButton
            label="Un tour de plus"
            disabled={disabled || tournament.matchCount >= limit}
            onClick={() => {
              onMatchCountChange(tournament.matchCount + 1);
            }}
          >
            <IconPlus size={16} />
          </IconButton>
        </Field>
      )}

      <Field
        id="setting-gap-phase1"
        label="Écart minimum en phase 1"
        hint="0 : la partie s'arrête au premier à 13. 2 : elle se prolonge jusqu'à deux points d'écart."
      >
        <input
          id="setting-gap-phase1"
          type="number"
          min={0}
          max={16}
          disabled={disabled}
          value={tournament.settings.minimumGapPhase1}
          onChange={(changeEvent) => {
            onSettingChange('minimumGapPhase1', Number(changeEvent.target.value));
          }}
          className={NUMBER_FIELD}
        />
      </Field>

      <Field
        id="setting-gap-phase2"
        label="Écart minimum en phase 2"
        hint="Indépendant de la phase 1."
      >
        <input
          id="setting-gap-phase2"
          type="number"
          min={0}
          max={16}
          disabled={disabled}
          value={tournament.settings.minimumGapPhase2}
          onChange={(changeEvent) => {
            onSettingChange('minimumGapPhase2', Number(changeEvent.target.value));
          }}
          className={NUMBER_FIELD}
        />
      </Field>

      <Field
        id="setting-bye-points"
        label="Une équipe exemptée marque"
        hint="Appliqué seulement à la clôture de la phase 1, pour ne pénaliser personne."
      >
        <select
          id="setting-bye-points"
          disabled={disabled}
          value={tournament.settings.byePoints}
          onChange={(changeEvent) => {
            onSettingChange('byePoints', changeEvent.target.value as ByePointsMode);
          }}
          className="h-11 rounded-panel border border-line bg-ground px-3 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
        >
          {BYE_POINTS_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {BYE_POINTS_LABELS[mode]}
            </option>
          ))}
        </select>
      </Field>

      <Field
        id="setting-forfeit"
        label="Différentiel d'un forfait"
        hint="Gagné par l'équipe présente, perdu par l'absente. Compte comme une victoire."
      >
        <input
          id="setting-forfeit"
          type="number"
          min={0}
          max={13}
          disabled={disabled}
          value={tournament.settings.forfeitDifferential}
          onChange={(changeEvent) => {
            onSettingChange('forfeitDifferential', Number(changeEvent.target.value));
          }}
          className={NUMBER_FIELD}
        />
      </Field>
    </div>
  );
}
