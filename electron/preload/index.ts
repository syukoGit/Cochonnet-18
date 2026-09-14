import { contextBridge, ipcRenderer } from 'electron';

const tournaments = {
  list: () => ipcRenderer.invoke('tournaments:list'),
  read: (id: string) => ipcRenderer.invoke('tournaments:read', id),
  write: (tournament: unknown) => ipcRenderer.invoke('tournaments:write', tournament),
  remove: (id: string) => ipcRenderer.invoke('tournaments:remove', id),
};

contextBridge.exposeInMainWorld('cochonnet', { tournaments });
