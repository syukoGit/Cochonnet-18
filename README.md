# Cochonnet-18
Logiciel de gestion de tournoi de pétanque. Il permet d'organiser un événement structuré en deux étapes :
- Une phase de matchs aléatoires pour établir un classement initial
- Deux tournois à élimination directe

## Règles
- La première équipe atteignant 13 points remporte la partie
- Aucun écart minimum n'est requis pour gagner : un score de 13-12 suffit pour l'emporter

## Configuration
Avant de lancer le tournoi, il est nécessaire de renseigner :
- Le nombre de matchs à disputer pendant la première phase
- Le nom des équipes participantes

## Phase 1 : Matchs de classement
Cette étape permet d'évaluer le niveau des équipes.  
Les confrontations sont générées aléatoirement, avec l'assurance que deux équipes ne s'affronteront qu'une seule fois.  
Chaque équipe joue un nombre de matchs défini lors de la configuration.

### Attribution des points
Le score obtenu correspond à l'écart de points entre les deux équipes.  
L'équipe victorieuse ajoute cette différence à son total.  
L'équipe perdante la soustrait de son score cumulé.

Le classement est calculé sur la base des points cumulés tout au long de cette phase.

## Phase 2 : Tournois à élimination directe
Le classement général est divisé en deux groupes :
- La moitié supérieure accède au tournoi principal
- La moitié inférieure dispute la consolante

Dans chaque tournoi, les résultats déterminent le podium.  
La troisième place revient au gagnant du match opposant les deux demi-finalistes battus.
