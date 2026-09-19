import { useMemo } from 'react';
import type { PointerEvent } from 'react';
import Button from '@/components/Button';
import IconButton from '@/components/IconButton';
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  GHOST_HEIGHT,
  LABEL_BAND,
  layoutBracket,
} from '@/components/bracketLayout';
import { IconMinus, IconPlus, IconRest } from '@/components/icons';
import { roundLabel, slotLabel } from '@/components/labels';
import { usePanZoom } from '@/components/usePanZoom';
import type { TeamId } from '@/domain/ids';
import { isReady, occupantsIn, winnerIn } from '@/domain/match/resolve';
import { hasResult } from '@/domain/match/types';
import type { Match } from '@/domain/match/types';

interface BracketGridProps {
  matches: Match[];
  allMatches: Match[];
  nameOf: (team: TeamId) => string;
  onSelect: (match: Match) => void;
}

export default function BracketGrid({ matches, allMatches, nameOf, onSelect }: BracketGridProps) {
  const layout = useMemo(() => layoutBracket(matches), [matches]);
  const { viewport, view, dragging, fit, zoomIn, zoomOut, wasDragged, surface } = usePanZoom(
    layout.width,
    layout.height,
    LABEL_BAND
  );

  const stopPan = (pointerEvent: PointerEvent<HTMLDivElement>) => {
    pointerEvent.stopPropagation();
  };

  const card = (match: Match, x: number, y: number, third: boolean) => {
    const winner = winnerIn(allMatches, match);
    const open = isReady(allMatches, match);
    const played = hasResult(match);

    const border = played
      ? 'border border-line'
      : open
        ? 'border-2 border-accent'
        : 'border border-dashed border-line';

    return (
      <button
        key={match.id}
        type="button"
        disabled={!open}
        onClick={() => {
          if (!wasDragged()) {
            onSelect(match);
          }
        }}
        style={{ left: x, top: y, width: CARD_WIDTH, height: CARD_HEIGHT }}
        className={`absolute overflow-hidden rounded-card text-left transition-colors disabled:cursor-default ${border} ${third ? 'bg-ground shadow-[inset_3px_0_0_var(--c-jack)]' : 'bg-surface'} ${open ? 'hover:border-accent' : ''} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
      >
        {([0, 1] as const).map((index) => {
          const occupant = occupantsIn(allMatches, match)[index];
          const wins = occupant !== null && occupant === winner;

          return (
            <span
              key={index}
              className={`flex h-8.5 items-center justify-between gap-2 px-3 text-[13px] ${index === 0 ? 'border-b border-line-soft' : ''} ${wins ? 'bg-success-ground' : ''}`}
            >
              <span
                className={`truncate ${occupant === null ? 'text-ink-faint italic' : wins ? 'font-semibold' : 'text-ink-soft'}`}
              >
                {slotLabel(allMatches, match, index, nameOf)}
              </span>
              {match.status === 'forfeit' ? (
                <span className="shrink-0 text-[11px] font-semibold text-warning">
                  {occupant !== null && occupant === match.forfeitBy ? 'forfait' : 'gagne'}
                </span>
              ) : (
                match.score && (
                  <span
                    className={`shrink-0 font-display text-[15px] font-bold tabular-nums ${wins ? 'text-success' : 'text-ink-faint'}`}
                  >
                    {match.score[index]}
                  </span>
                )
              )}
            </span>
          );
        })}
      </button>
    );
  };

  if (layout.matches.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-line px-4 py-10 text-center text-ink-soft">
        Ce groupe est trop petit pour un tableau.
      </p>
    );
  }

  return (
    <div
      ref={viewport}
      {...surface}
      className={`relative min-h-0 flex-1 touch-none overflow-hidden rounded-card border border-line bg-ground select-none ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
    >
      <div
        style={{
          width: layout.width,
          height: layout.height,
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
          transformOrigin: '0 0',
        }}
        className="absolute top-0 left-0"
      >
        <svg
          width={layout.width}
          height={layout.height}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          className="pointer-events-none absolute top-0 left-0 overflow-visible"
          aria-hidden
        >
          {layout.links.map((link) => (
            <path
              key={link.key}
              d={link.path}
              fill="none"
              strokeWidth={1.5}
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray={link.loser ? '5 5' : undefined}
              className={link.loser ? 'stroke-jack/70' : 'stroke-line'}
            />
          ))}
        </svg>

        {layout.columns.map((column) => (
          <span
            key={column.round}
            style={{ left: column.x, top: -34, width: CARD_WIDTH }}
            className="absolute font-display text-[11.5px] font-bold tracking-widest text-ink-faint uppercase"
          >
            {roundLabel(column.round, layout.lastRound)}
          </span>
        ))}

        {layout.seats.map((seat) => (
          <span
            key={seat.key}
            style={{
              left: seat.x + CARD_WIDTH - 150,
              top: seat.y,
              width: 150,
              height: GHOST_HEIGHT,
            }}
            className="absolute flex items-center justify-between gap-2 rounded-full border border-dashed border-line bg-sunken px-2.5"
          >
            <span className="truncate text-[13px] text-ink-soft">{nameOf(seat.team)}</span>
            <IconRest size={13} className="shrink-0 text-ink-faint" />
          </span>
        ))}

        {layout.matches.map((placed) => card(placed.match, placed.x, placed.y, false))}

        {layout.thirdPlace && (
          <>
            <span
              style={{
                left: layout.thirdPlace.x,
                top: layout.thirdPlace.y - 26,
                width: CARD_WIDTH,
              }}
              className="absolute text-center font-display text-[11.5px] font-bold tracking-widest text-warning uppercase"
            >
              Petite finale
            </span>
            {card(layout.thirdPlace.match, layout.thirdPlace.x, layout.thirdPlace.y, true)}
          </>
        )}
      </div>

      <div
        onPointerDown={stopPan}
        className="absolute bottom-3.5 left-3.5 flex items-center gap-3.5 rounded-full border border-line bg-surface/90 px-3 py-1.5 text-[11.5px] text-ink-soft"
      >
        <span className="flex items-center gap-2">
          <span className="h-0 w-4.5 border-t-2 border-line" />
          vainqueur
        </span>
        <span className="flex items-center gap-2">
          <span className="h-0 w-4.5 border-t-2 border-dashed border-jack" />
          perdant
        </span>
      </div>

      <div
        onPointerDown={stopPan}
        className="absolute right-3.5 bottom-3.5 flex items-center gap-1.5"
      >
        <IconButton label="Dézoomer" onClick={zoomOut}>
          <IconMinus size={16} />
        </IconButton>
        <span className="flex h-11 min-w-14 items-center justify-center rounded-panel border border-line bg-surface text-[13px] font-semibold tabular-nums">
          {Math.round(view.scale * 100)} %
        </span>
        <IconButton label="Zoomer" onClick={zoomIn}>
          <IconPlus size={16} />
        </IconButton>
        <Button onClick={fit}>Recadrer</Button>
      </div>
    </div>
  );
}
