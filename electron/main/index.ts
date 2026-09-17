import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import { join } from 'node:path';
import { tournamentSchema } from '@/shared/save/schema';
import { list, read, remove, write } from './repository';
import { exportTo, importFrom, suggestedFileName } from './transfer';

const rendererDevServerUrl = process.env.ELECTRON_RENDERER_URL;

function tournamentsDirectory(): string {
  return join(app.getPath('userData'), 'tournaments');
}

function registerChannels(): void {
  ipcMain.handle('tournaments:list', () => list(tournamentsDirectory()));
  ipcMain.handle('tournaments:read', (_event, id: string) => read(tournamentsDirectory(), id));
  ipcMain.handle('tournaments:remove', (_event, id: string) => remove(tournamentsDirectory(), id));
  ipcMain.handle('tournaments:write', (_event, candidate: unknown) => {
    const parsed = tournamentSchema.safeParse(candidate);

    if (!parsed.success) {
      throw new Error('The tournament sent by the renderer does not match the save schema');
    }

    return write(tournamentsDirectory(), parsed.data);
  });

  ipcMain.handle('tournaments:export', async (_event, id: string) => {
    const tournament = await read(tournamentsDirectory(), id);

    if (!tournament) {
      return { status: 'failed', detail: `no readable tournament for ${id}` };
    }

    const chosen = await dialog.showSaveDialog({
      title: 'Exporter le tournoi',
      defaultPath: suggestedFileName(tournament),
      filters: [{ name: 'Tournoi Cochonnet', extensions: ['json'] }],
    });

    if (chosen.canceled || chosen.filePath.length === 0) {
      return { status: 'cancelled' };
    }

    try {
      await exportTo(chosen.filePath, tournament);
    } catch (error) {
      return { status: 'failed', detail: String(error) };
    }

    return { status: 'written', path: chosen.filePath };
  });

  ipcMain.handle('tournaments:import', async () => {
    const chosen = await dialog.showOpenDialog({
      title: 'Importer un tournoi',
      properties: ['openFile'],
      filters: [{ name: 'Tournoi Cochonnet', extensions: ['json'] }],
    });

    const path = chosen.canceled ? undefined : chosen.filePaths[0];

    if (path === undefined) {
      return { status: 'cancelled' };
    }

    const outcome = await importFrom(path);

    return outcome.ok
      ? { status: 'read', tournament: outcome.tournament }
      : { status: 'invalid', reason: outcome.reason, detail: outcome.detail };
  });
}

function createWindow(): void {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    show: false,
    backgroundColor: '#f1f3f5',
    webPreferences: {
      preload: join(import.meta.dirname, '../preload/index.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.once('ready-to-show', () => {
    window.show();
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  window.webContents.on('did-fail-load', (_event, code, description, url) => {
    console.error('did-fail-load', code, description, url);
  });

  if (rendererDevServerUrl) {
    void window.loadURL(rendererDevServerUrl);
    window.webContents.openDevTools({ mode: 'detach' });
  } else {
    void window.loadFile(join(import.meta.dirname, '../renderer/index.html'));
  }
}

void app.whenReady().then(() => {
  registerChannels();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
