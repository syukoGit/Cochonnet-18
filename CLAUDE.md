# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Cochonnet-18 is a **local desktop application** that runs a pétanque tournament: a qualification phase of drawn
matches ranked on cumulative point differential, then two knockout brackets — main and consolation — fed by the two
halves of that ranking. It runs on one laptop at the boulodrome. **No server, no network, no phone layout**, and the
organiser is the only user.

**[`REGLES.md`](REGLES.md) is the source of truth**, at the repository root, versioned with the code. It carries 62
numbered rules (`R1.1`, `R2.4`, `R4.5`, …) and 14 testable invariants (`I1` … `I14`) that define how a tournament
runs, from the phase 1 draw to the final podium. **Read it before planning any feature.** When a rule changes, amend
`REGLES.md` first, then the code, then the test — never the other way round.

**Every numbered rule maps to a test in `src/domain/`.** Changing one without the other is the failure mode this
project is built to prevent. §9 of that file lists what was examined and deliberately left out of scope — printing,
terrain assignment, timed games, seeded brackets, team rosters. Do not reopen those in an implementation task.

`REGLES.md` is written in French; **the code, the identifiers and the commit messages are English**. The UI is French.

## Environment

- **Node 26**, npm 11. Windows development machine; PowerShell is the primary shell, Git Bash is available.
- **electron-vite** drives the build: main, preload and renderer are bundled together, TypeScript on both sides, with
  HMR on the renderer. `electron-builder` produces the installers.
- **React 19** and **TypeScript** in `strict` mode, with `noUnusedLocals`, `noUnusedParameters` and
  `noUncheckedSideEffectImports`. `tsc` and `eslint` pass clean — keep them that way.
- **Zustand + Immer** for state, **Zod** for versioned save schemas, **Vitest + fast-check** for the domain,
  **Playwright** for the end-to-end run, **Tailwind v4 + Radix** for the interface.

**The renderer runs from `file://` in the packaged application, and three things follow from that.** They are cheap to
get wrong and only fail once the installer is built, never in the dev server:

- The main process loads the renderer from the **build output**, not from a path relative to itself.
- **`BrowserRouter` does not resolve under `file://`** — routing is `HashRouter`, and screen access is derived from
  tournament state rather than from navigation history (R7.2).
- External resources are unavailable. Fonts, icons and styles ship with the bundle.

The application id is **`com.cochonnet18.app`** and the data directory that follows from it is the one the organiser's
tournaments live in. **Never change either casually**: a new id installs a second application beside the first and
silently leaves every past event behind in the old directory.

Keep the `electron-builder` `files` glob tight — an installer that bundles the whole of `node_modules` is several
hundred megabytes of nothing. On Windows, check that an unsigned build still opens past SmartScreen; an installer that
frightens the organiser is a broken installer.

## Commands

**This section lists the scripts that exist in [`package.json`](package.json), and nothing else.** A commit that adds
or renames a script updates this section in the same commit — a command documented here that does not run is worse
than one that is missing.

```bash
npm run dev              # electron-vite dev, the application with HMR — the normal loop
npm run test             # Vitest over the domain, runs in seconds
npm run test:watch       # the same, in watch mode
npm run typecheck        # tsc -b across the electron and renderer projects
npm run lint             # eslint over the whole tree
npm run format           # prettier over everything but the Markdown
npm run build            # typecheck then electron-vite build into out/
npm run dist-win         # NSIS installer into release/
```

`preview` runs the built output inside Electron, and `dist` builds the current platform's target; both are rarely
useful on their own.

The suite carries the whole regression net and runs in seconds, so there is no reason to skip it. It covers
`src/**/*.test.ts` and `electron/**/*.test.ts`, under the `node` environment and with `@` aliased to `src` — the
absence of a DOM is deliberate, and it is a second guard on the purity of `src/domain`.

The fourteen invariants are not all in place yet. Until one lands, the rule it pins down is verified by nothing, and
a change checked only by running the application should be reported as exactly that.

## Architecture

Strictly one-way layering:

```
electron/main + preload          atomic file writes, second-screen window, IPC
        ↓
src/pages, src/components        React, Tailwind, Radix
        ↓
src/store                        Zustand + Immer, holds state, decides nothing
        ↓
src/domain                       pure TypeScript — the rules, the algorithms, the invariants
```

**Arrows never point back up.** `src/domain` does not know that React, Zustand, Electron or the DOM exist.

**Golden rule: `src/domain` imports nothing outside itself and the TypeScript standard library.** No `react`, no
`zustand`, no `electron`, no `window`, no `Date.now()`, no `Math.random()` — a draw takes its seed as an argument
(R4.7), and anything time-dependent is passed in. That is what makes the rules testable without launching the
application, and what makes a tournament reproducible from a save file.

The store holds state and calls domain functions. **It contains no rule.** A reducer that computes a ranking, splits a
bracket or validates a score is a defect in the layering, not a shortcut.

### The match model

A knockout bracket is **not a tree**. It is a flat list of matches joined by explicit outgoing links:

```
Match = {
  id, phase, tour
  slots: [Slot, Slot]        team, bye, or "winner of M12"
  score?: [number, number]
  statut: waiting | in_progress | played | forfeit
  alimente?: { match, slot }
  alimenteConsolante?: { match, slot }
}
```

Entering a result is a pure function `appliquerResultat(tournoi, matchId, score) → tournoi`. Because the outgoing links
are explicit, it walks downstream and **clears every dependent match before injecting the new qualifier** (R4.11). A
tree mutated in place cannot do that: it propagates a winner upward and leaves stale results behind, which crowns a
team that played no further match. The flat shape makes that class of bug unwritable.

A stored result is **locked** (R4.12). Unlocking is an explicit action that names, before confirming, every match it
will erase.

### The two algorithms

**Phase 1 draw** — circle method over a shuffled order. When the team count is odd, a **phantom team** is added and
the draw runs on `N + 1`, so exactly one real team is exempt each round (R2.2). The circle method does not support an
odd count on its own: pairings repeat and the team held at the head of the circle plays one match more than the rest.
Invariants `I1` to `I3` pin this down — no pair meets twice, at most one match of difference between the busiest and
the least busy team, exemptions rotate fairly.

**Phase 2 bracket** — pad the group to the next power of two and turn the unfilled seats into first-round byes, so
**every branch has the same depth** (R4.1 – R4.3). Placement is **fully random**, byes included: the phase 1 ranking
decides the group and nothing else (R4.4). The draw minimises first-round rematches rather than forbidding them — the
constraint is not always satisfiable, since a group whose teams all met in phase 1 admits no clean pairing. It
evaluates up to a thousand draws, stops at the first clean one, and **reports the number of unavoidable rematches** to
the organiser (R4.5, `I7`).

### Score validity

One shared pure function for both phases, parameterised by the gap (R2.4, R4.9). With `v = max`, `p = min`, target
`C = 13` and `E = max(1, ecartMinimum)`, a score is valid when `a ≠ b` and:

```
v = C  and  p ≤ C - E                    concluded at the target
or   E ≥ 2  and  v > C  and  v - p = E   extended until the required gap
```

The two phases carry **independent** gap settings (R1.7), so the parameter travels as an argument and never as a phase
discriminant. Past the target a game always ends on a gap of **exactly** `E`: each point taken by the winner raises the
gap by one from an insufficient gap, so it cannot overshoot.

### Persistence

**One event is one JSON file**, in an events directory under `app.getPath('userData')` (R6.1). The home screen is the
list of those events (R6.6, R7.1); creating a tournament destroys nothing, and last season's is still there with its
podium. Each file stands alone — an unreadable one must not keep the others from opening (`I14`).

Writes are **atomic** — temporary file then rename — on every mutation with a 500 ms debounce (R6.2, R6.3). Not
`localStorage`: on a desktop application it hides the data inside a Chromium profile, where the organiser can neither
copy it nor back it up. Every save is validated against a **versioned Zod schema** with explicit migrations, and a
file that fails validation is refused with a message rather than partially loaded (R6.5).

Mutations are journalled with their inverse Immer patches, which is where undo comes from (R6.7). **A lock is a
property of the state**, not an irreversible event, so it lives in the journal like everything else — but **undo is
bounded**: it crosses neither the phase 1 closure nor a frozen draw (R6.8, `I13`). Undo is for a typo. Undoing a
structural decision goes through its own path — cascade invalidation (R4.11) or team withdrawal (R3.2) — which names
its consequences and asks for confirmation. Without that bound, a long undo run would be a back door around every
lock, with nothing confirmed and nothing shown.

## Conventions

- **No comments — the code must be self-descriptive.** No JSDoc, no descriptive, explanatory, example or warning
  comments, in any file (`.ts`, `.tsx`, `.css`, `.json`, config files). Make intent clear through names and structure;
  if a comment feels necessary, extract a well-named function or constant. User-facing strings are not comments and
  stay.
- **No branching on a phase.** Score validity takes a gap parameter, not a `'phase1' | 'phase2'` discriminant; a match
  is a match. A rule that differs between phases differs by its **parameters**, declared in configuration (R1.5), never
  by a `switch` scattered through the engine.
- **Identifiers, never names, as keys.** A `TeamId` is stable and never reused; a team name is a label the organiser
  can change at any time without touching a played match (R1.2). Any `find(t => t.name === …)` is a defect: it splits
  one identity in two and leaves ghost matches behind the moment a team is removed.
- **No side effects inside a state updater.** React re-runs updaters freely, and always does under `StrictMode`.
  Effects belong in effects.
- Domain functions are **pure and total**: same input, same output, no throw on a foreseeable case. A tournament that
  cannot have a third place returns no third place (R4.15); it does not raise.
- The UI is French, the code is English. Keep user-facing strings out of components and reference them by key. The
  vocabulary of `REGLES.md` is authoritative for both: *tour*, *exemption*, *forfait*, *consolante*, *différentiel*.
- **The fourteen invariants are the executable spec.** Write them before the feature. `I1` to `I3` and `I7` are
  property-based (fast-check) over every team count from 2 to 64 and every valid match count — a draw is not verified
  by inspecting one example.
- **A rule about reachable states is tested against a simulation, not against hand-picked cases.** The score formula
  above is validated by enumerating games point by point and comparing every score across gaps 0 to 16 (`I4`). An
  earlier formulation reasoned about the preceding point, looked right, read right, and accepted 14–13 — a score no
  game can reach. Cases you choose yourself only confirm what you already believe.
- Interface work is verified in the packaged application as well as in the dev server. The `file://` traps above
  appear nowhere else.

## Git

- **Never run `git commit` without an explicit go for that specific commit.** Editing files, staging them and proposing
  a message is fine; creating the commit is not. An instruction to "make the changes for commit N" is **not**
  permission to commit them, and permission for one commit never carries over to the next.
- The same rule covers every history rewrite (`reset`, `commit --amend`, `rebase`, `cherry-pick`) and `git push`.
- Commit messages are a **single Conventional Commits line** — no body, no `Co-Authored-By` trailer.
