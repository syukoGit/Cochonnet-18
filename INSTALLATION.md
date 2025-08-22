# Installation de l'application Cochonnet-18

## Installation par paquet

### Linux (Ubuntu, Debian, Fedora, etc.)
1. Téléchargez le fichier `Cochonnet-18-X.X.X.AppImage`
2. Rendez le fichier exécutable : `chmod +x Cochonnet-18-X.X.X.AppImage`
3. Lancez l'application : `./Cochonnet-18-X.X.X.AppImage`

### Windows
1. Téléchargez le fichier `Cochonnet-18-Setup-X.X.X.exe`
2. Exécutez l'installateur et suivez les instructions
3. L'application sera disponible dans le menu Démarrer

### macOS
1. Téléchargez le fichier `Cochonnet-18-X.X.X.dmg`
2. Ouvrez le fichier DMG
3. Glissez l'application vers le dossier Applications
4. Lancez l'application depuis le Launchpad

## Compilation depuis les sources

### Prérequis
- Node.js 18 ou supérieur
- npm ou yarn

### Installation
```bash
# Cloner le repository
git clone https://github.com/syukoGit/Cochonnet-18.git
cd Cochonnet-18

# Installer les dépendances
npm install

# Lancer en mode développement
npm run electron-dev

# Construire l'application
npm run build

# Créer les installateurs
npm run dist           # Tous les OS
npm run dist-linux     # Linux AppImage
npm run dist-win       # Windows NSIS
npm run dist-mac       # macOS DMG
```

### Scripts disponibles

- `npm run dev` : Serveur de développement web
- `npm run build` : Construction de l'application web
- `npm run electron` : Lancement de l'application Electron
- `npm run electron-dev` : Mode développement Electron avec rechargement automatique
- `npm run build-electron` : Test de l'application Electron compilée
- `npm run dist` : Création de tous les installateurs
- `npm run dist-linux` : Création de l'AppImage Linux
- `npm run dist-win` : Création de l'installateur Windows
- `npm run dist-mac` : Création du DMG macOS

## Configuration système

### Linux
- Aucune configuration spéciale requise
- L'AppImage est portable et peut être lancée depuis n'importe où

### Windows
- Windows 10 ou supérieur recommandé
- L'installateur créera des raccourcis sur le bureau et dans le menu Démarrer

### macOS
- macOS 10.14 (Mojave) ou supérieur
- Vous pourriez voir un avertissement de sécurité au premier lancement
  - Allez dans Préférences Système > Sécurité et confidentialité
  - Cliquez sur "Ouvrir quand même" pour l'application Cochonnet-18

## Support

Pour obtenir de l'aide ou signaler des problèmes, veuillez créer une issue sur le repository GitHub.