# Redux State Persistence

This application implements automatic localStorage persistence for the Redux state with the following features:

## Overview

The persistence system automatically saves the entire Redux state to localStorage every 5 minutes, with a maximum of 3 rotating backups. Users can load any of these backups through a dedicated UI.

## Features

### Auto-Save Mechanism
- **Interval**: Every 5 minutes
- **Trigger conditions**: Only when meaningful data exists (event name or teams configured)
- **Critical saves**: Immediate saves on important state changes (rounds, phase2 data) with 30-second cooldown
- **Location**: Implemented in `src/hooks/useAutoSave.ts`

### Backup Management
- **Maximum backups**: 3 (oldest automatically deleted when creating 4th)
- **Naming format**: `cochonnet-backup-YYYY-MM-DD-hh-mm-sss`
- **Storage**: Browser localStorage
- **Utilities**: Implemented in `src/utils/persistence.ts`

### User Interface
- **Load button**: "Charger une sauvegarde" on home page next to "Créer un évènement"
- **Selection dialog**: Modal showing available backups with timestamps and file sizes
- **Error handling**: User feedback for failed operations
- **Component**: `src/components/LoadSaveDialog.tsx`

## State Persistence

The following Redux state slices are persisted:

### Event Slice (`state.event`)
- `name`: Event name
- `matches`: Number of matches per team
- `teams`: Array of team objects with id and name
- `rounds`: Generated tournament rounds
- `phase2Groups`: Winners and consolation groups for knockout phase
- `phase2Brackets`: Generated bracket trees for phase 2

All data from the `eventSlice` is preserved to maintain complete tournament state.

## Technical Implementation

### Files Created/Modified
- `src/utils/persistence.ts` - localStorage utility functions
- `src/hooks/useAutoSave.ts` - Auto-save React hook
- `src/components/LoadSaveDialog.tsx` - Backup selection UI
- `src/components/LoadSaveDialog.css` - Dialog styling
- `src/store/eventSlice.ts` - Added `restoreState` action
- `src/pages/Home.tsx` - Added load save button
- `src/pages/Home.css` - Button styling
- `src/App.tsx` - Initialize auto-save hook

### Error Handling
- Try/catch blocks around all localStorage operations
- User-friendly error messages in French
- Graceful fallback when localStorage is unavailable
- Console logging for debugging

### Browser Compatibility
- Uses standard localStorage API
- Compatible with all modern browsers
- Handles localStorage quota exceeded gracefully

## Usage

1. **Automatic saving**: Configure an event with teams - auto-save triggers every 5 minutes
2. **Manual loading**: Click "Charger une sauvegarde" on home page
3. **Select backup**: Choose from available backups in the dialog
4. **Restore state**: Click "Charger" to restore the selected backup

The system maintains tournament progress across browser sessions and provides reliable data recovery.