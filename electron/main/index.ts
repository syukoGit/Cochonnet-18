import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { join } from 'node:path';
import type { Evenement } from '@/domain/event/types';
import { schemaEvenement } from '@/shared/save/schema';
import { ecrire, lire, lister, supprimer } from './depot';

const rendererDevServerUrl = process.env.ELECTRON_RENDERER_URL;

function repertoireDesEvenements(): string {
  return join(app.getPath('userData'), 'events');
}

function enregistrerLesCanaux(): void {
  ipcMain.handle('evenements:lister', () => lister(repertoireDesEvenements()));
  ipcMain.handle('evenements:lire', (_event, id: string) => lire(repertoireDesEvenements(), id));
  ipcMain.handle('evenements:supprimer', (_event, id: string) =>
    supprimer(repertoireDesEvenements(), id)
  );
  ipcMain.handle('evenements:ecrire', (_event, candidat: unknown) => {
    const analyse = schemaEvenement.safeParse(candidat);

    if (!analyse.success) {
      throw new Error("L'événement envoyé par l'interface ne respecte pas le schéma de sauvegarde");
    }

    return ecrire(repertoireDesEvenements(), analyse.data as Evenement);
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

  window.once('ready-to-show', () => window.show());

  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  window.webContents.on('did-fail-load', (_event, code, description, url) => {
    console.error('did-fail-load', code, description, url);
  });

  if (rendererDevServerUrl) {
    window.loadURL(rendererDevServerUrl);
    window.webContents.openDevTools({ mode: 'detach' });
  } else {
    window.loadFile(join(import.meta.dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  enregistrerLesCanaux();
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
