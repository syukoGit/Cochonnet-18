import { contextBridge, ipcRenderer } from 'electron';

const evenements = {
  lister: () => ipcRenderer.invoke('evenements:lister'),
  lire: (id: string) => ipcRenderer.invoke('evenements:lire', id),
  ecrire: (evenement: unknown) => ipcRenderer.invoke('evenements:ecrire', evenement),
  supprimer: (id: string) => ipcRenderer.invoke('evenements:supprimer', id),
};

contextBridge.exposeInMainWorld('cochonnet', { evenements });
