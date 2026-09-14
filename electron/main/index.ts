import { app, BrowserWindow, shell } from 'electron';
import { join } from 'node:path';

const rendererDevServerUrl = process.env.ELECTRON_RENDERER_URL;

function createWindow(): void {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    show: false,
    backgroundColor: '#f1f3f5',
    webPreferences: {
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
