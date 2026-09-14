import { maxMatchCount } from '@/domain/phase1/draw';
import { BYE_POINTS_MODES } from '@/domain/tournament/settings';
import type { ByePointsMode, Settings } from '@/domain/tournament/settings';
import type { Tournament } from '@/domain/tournament/types';

const BYE_POINTS_LABELS: Record<ByePointsMode, string> = {
  average: 'sa propre moyenne',
  zero: 'aucun point',
  forfeit13: 'un forfait gagné (+13)',
};

interface SettingsPanelProps {
  tournament: Tournament;
  onMatchCountChange: (matchCount: number) => void;
  onSettingChange: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-4 py-3">
      <span className="font-medium">{label}</span>
      {children}
      <span className="col-span-2 text-sm text-ink-soft">{hint}</span>
    </label>
  );
}

const numberField =
  'w-24 rounded-panel border border-line bg-ground px-3 py-1.5 text-right tabular-nums focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent';

export default function SettingsPanel({
  tournament,
  onMatchCountChange,
  onSettingChange,
}: SettingsPanelProps) {
  const limit = maxMatchCount(tournament.teams.length);
  const outOfRange = tournament.matchCount < 1 || tournament.matchCount > limit;

  return (
    <div className="divide-y divide-line-soft overflow-hidden rounded-panel border border-line bg-surface">
      <Field
        label="Matchs par équipe"
        hint={
          limit === 0
            ? 'Ajoute au moins deux équipes.'
            : `Entre 1 et ${limit} pour ${tournament.teams.length} équipes.`
        }
      >
        <input
          type="number"
          min={1}
          max={Math.max(limit, 1)}
          value={tournament.matchCount}
          onChange={(changeEvent) => {
            onMatchCountChange(Number(changeEvent.target.value));
          }}
          className={outOfRange ? `${numberField} border-warning` : numberField}
        />
      </Field>

      <Field
        label="Écart minimum en phase 1"
        hint="0 : la partie s'arrête au premier à 13. 2 : elle se prolonge jusqu'à deux points d'écart."
      >
        <input
          type="number"
          min={0}
          max={16}
          value={tournament.settings.minimumGapPhase1}
          onChange={(changeEvent) => {
            onSettingChange('minimumGapPhase1', Number(changeEvent.target.value));
          }}
          className={numberField}
        />
      </Field>

      <Field label="Écart minimum en phase 2" hint="Indépendant de la phase 1.">
        <input
          type="number"
          min={0}
          max={16}
          value={tournament.settings.minimumGapPhase2}
          onChange={(changeEvent) => {
            onSettingChange('minimumGapPhase2', Number(changeEvent.target.value));
          }}
          className={numberField}
        />
      </Field>

      <Field
        label="Une équipe exemptée marque"
        hint="Appliqué seulement à la clôture de la phase 1, pour ne pénaliser personne."
      >
        <select
          value={tournament.settings.byePoints}
          onChange={(changeEvent) => {
            onSettingChange('byePoints', changeEvent.target.value as ByePointsMode);
          }}
          className="rounded-panel border border-line bg-ground px-3 py-1.5 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
        >
          {BYE_POINTS_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {BYE_POINTS_LABELS[mode]}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Différentiel d'un forfait"
        hint="Gagné par l'équipe présente, perdu par l'absente. Compte comme une victoire."
      >
        <input
          type="number"
          min={0}
          max={13}
          value={tournament.settings.forfeitDifferential}
          onChange={(changeEvent) => {
            onSettingChange('forfeitDifferential', Number(changeEvent.target.value));
          }}
          className={numberField}
        />
      </Field>
    </div>
  );
}
