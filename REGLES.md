# Règles de Cochonnet-18

**Version 1.4** — validée le 15 septembre 2026.

Ce document est la spécification de référence du logiciel. Chaque règle numérotée
correspond à un test du domaine (`src/domain/`). Toute modification d'une règle
implique une modification du test correspondant, et inversement.

> **Changements depuis 1.3** — la confrontation directe ordonne sur le différentiel
> des seuls matchs entre les équipes à égalité (R2.12) ; l'arrondi du crédit
> d'exemption s'éloigne de zéro, pour ne pas avantager les différentiels négatifs
> (R2.8) ; une égalité ne s'arbitre que si deux de ses équipes restent en lice (R3.5) ;
> à trois équipes, le troisième sort de l'unique demi-finale sans match (R4.14, R4.15).
>
> **Changements depuis 1.2** — la comparaison des noms d'équipe est normalisée et
> insensible à la casse (R1.3).
>
> **Changements depuis 1.1** — un événement par fichier et accueil en liste
> d'événements (R6.1, R6.6, R7.1) ; les verrous sont une propriété de l'état mais
> l'annulation est bornée (R6.8) ; pas de plafond au nombre d'équipes, avec
> avertissement au-delà de 64 (R1.4) ; une décision de départage est rejouée tant
> que l'égalité est inchangée (R2.14). Les règles de §7 au-delà de R7.2 sont
> décalées d'un rang.
>
> **Changements depuis 1.0** — écart minimum configurable et indépendant par phase
> (R1.5, R2.4, R4.9) ; crédit d'exemption calculé à la clôture de la phase 1 (R2.9) ;
> contrainte de non-réaffrontement au premier tour de phase 2 (R4.5) ; retrait
> d'équipes entre les deux phases (R3.2) ; impression retirée du périmètre (§9).

---

## 1. Événement et configuration

**R1.1** — Un événement se définit par un nom, une liste d'équipes et un nombre
*M* de matchs de phase 1.

**R1.2** — Une équipe est **un nom**. Aucune notion de doublette, triplette ni de
joueurs nommés. Elle possède un identifiant stable (`TeamId`) attribué à la
création et jamais réutilisé ; le nom est un simple libellé, modifiable à tout
moment sans conséquence sur les matchs déjà joués.

**R1.3** — Deux équipes ne peuvent pas porter le même nom. La comparaison se fait
sur le nom **normalisé** — espaces de bord retirés, espaces internes réduits à un
seul — et **sans distinction de casse** : « Les Boulistes » et « les boulistes »
sont le même nom et le second est refusé.

**R1.4** — Le nombre de matchs *M* doit vérifier `1 ≤ M ≤ N - 1`, où *N* est le
nombre d'équipes. Le minimum d'équipes est 2.

Il n'y a **pas de plafond** au nombre d'équipes. Les invariants du §8 sont garantis
de 2 à 64 ; au-delà, l'application fonctionne mais **le signale**. Aucun tournoi
légitime n'est refusé, et aucune garantie n'est promise sans être testée.

**R1.5** — Quatre paramètres complètent la configuration :

| Paramètre | Valeurs | Défaut | Portée |
|---|---|---|---|
| `ecartMinimumPhase1` | entier ≥ 0 | `0` | Phase 1 |
| `pointsExemption` | `moyenne` \| `zero` \| `forfait13` | `moyenne` | Phase 1 |
| `differentielForfait` | entier ≥ 0 | `5` | Phase 1 |
| `ecartMinimumPhase2` | entier ≥ 0 | `0` | Phase 2 |

**R1.6** — Chaque paramètre est **verrouillé dès la première saisie de score de la
phase qu'il gouverne**. Les paramètres de phase 1 restent donc modifiables jusqu'au
premier score de phase 1, et `ecartMinimumPhase2` jusqu'au premier score de phase 2.
Les modifier au-delà changerait un classement ou un tableau de façon rétroactive.

**R1.7** — Les deux écarts minimums sont **indépendants**. Une phase 1 au premier
à 13 suivie d'une phase 2 avec deux points d'écart est une configuration valide.

---

## 2. Phase 1 — matchs de qualification

### 2.1 Tirage

**R2.1** — Les appariements sont générés par la méthode du cercle sur l'ordre des
équipes préalablement mélangé.

**R2.2** — Si *N* est impair, une équipe fantôme est ajoutée et le tirage
s'effectue sur *N + 1*. L'équipe appariée au fantôme est **exemptée** pour ce round.

**R2.3** — Le tirage est intégralement produit au démarrage de la phase 1 et n'est
jamais régénéré ensuite.

### 2.2 Saisie des scores

**R2.4** — Soit un score `(a, b)`, `v = max(a, b)`, `p = min(a, b)`, la cible
`C = 13` et l'écart requis `E = max(1, ecartMinimumPhase1)`.

Une partie s'arrête au **premier point** où le vainqueur atteint la cible *et* mène
de l'écart requis. Un score est valide si et seulement si :

```
a ≠ b                                   (pas de match nul)

ET   v = C  et  p ≤ C - E               (la partie s'est conclue à la cible)
OU   E ≥ 2  et  v > C  et  v - p = E    (elle s'est prolongée jusqu'à l'écart)
```

Deux lectures de cette règle méritent d'être retenues :

- Quand `ecartMinimumPhase1` vaut 0 ou 1, la seconde branche est vide et il ne
  reste que `v = 13` — la règle du premier à 13. Le cas particulier n'a pas à être
  écrit, il découle de la formule.
- Au-delà de la cible, la partie se termine toujours sur un écart **exactement**
  égal à *E*, jamais davantage : chaque point du vainqueur augmente l'écart d'une
  unité à partir d'un écart insuffisant, donc il ne peut pas le dépasser.

| Score | `E = 0` | `E = 2` |
|---|---|---|
| 13–12 | valide | refusé — écart insuffisant |
| 13–0 | valide | valide |
| 14–12 | refusé — la partie finissait à 13–12 | valide |
| 15–13 | refusé | valide |
| 15–12 | refusé | refusé — la partie finissait à 14–12 |
| 14–13 | refusé — 13–13 est inatteignable | refusé — écart insuffisant |

**R2.5** — Cette validation est **bloquante**. Elle ne rejette que des scores
réellement inatteignables, jamais un résultat légitime. Une partie interrompue
parce qu'une équipe renonce relève du forfait (§5), pas d'un score.

**R2.6** — Un match non saisi n'entre dans aucun calcul.

### 2.3 Classement

**R2.7** — Le score de classement est le **différentiel cumulé** : le vainqueur
d'un match ajoute l'écart à son total, le perdant le soustrait.

**R2.8** — Une équipe exemptée est créditée selon `pointsExemption` :

- `moyenne` — la moyenne des différentiels de ses matchs **effectivement joués**,
  arrondie au plus proche. Un demi s'arrondit **en s'éloignant de zéro** : +3,5 donne
  +4 et −3,5 donne −4. L'arrondi natif de la plupart des langages penche vers +∞,
  ce qui avantagerait les différentiels négatifs. Si l'équipe n'a joué aucun match,
  le crédit est de 0.
- `zero` — aucun point.
- `forfait13` — +13.

**R2.9** — Le crédit d'exemption n'est appliqué qu'à la **clôture de la phase 1**,
lorsque tous les matchs sont saisis. Pendant la phase, le classement affiché est
calculé sur les seuls matchs joués et les équipes exemptées sont signalées comme
telles.

> Sans cette règle, une équipe exemptée au premier round serait créditée de 0 —
> n'ayant encore joué aucun match — tandis qu'une équipe exemptée au dernier round
> serait créditée de sa moyenne réelle. Le classement intermédiaire serait
> mécaniquement faussé au détriment de la première.

**R2.10** — Le classement affiché pendant la phase 1 est donc explicitement
**provisoire**, et l'interface le signale.

**R2.11** — Le crédit d'exemption est une valeur **dérivée**, recalculée à partir
des scores. Il n'est jamais stocké.

### 2.4 Départage

**R2.12** — À égalité de différentiel, les équipes sont départagées dans cet ordre :

1. **Nombre de victoires** (les victoires par forfait comptent).
2. **Confrontation directe** — ce critère n'est appliqué que si *toutes* les
   équipes encore à égalité se sont rencontrées entre elles. Sinon il est ignoré.
   Lorsqu'il s'applique, les équipes sont ordonnées sur le **différentiel cumulé de
   leurs seuls matchs les opposant entre elles**, à l'exclusion de tout autre match.
   Sur un groupe de deux équipes, cela revient à donner l'avantage à celle qui a
   gagné leur confrontation.
3. **Total de points marqués** (un forfait ne contribue pas à ce total).

**R2.13** — Une égalité qui subsiste après ces trois critères est **affichée comme
telle**. L'application demande alors un tirage au sort explicite à l'organisateur
et n'ordonne jamais silencieusement. Cette décision est enregistrée avec
**l'ensemble des équipes qu'elle départage**.

**R2.14** — Lors d'une réévaluation du classement (R3.5), une décision enregistrée
est **rejouée à l'identique tant que le même ensemble d'équipes est encore à
égalité**. Si cet ensemble change, la décision est écartée et la question reposée.
L'organisateur ne retire jamais au sort une égalité qu'il a déjà tranchée, et ne
voit jamais une décision s'appliquer à une égalité qui n'est plus la sienne.

---

## 3. Clôture de la phase 1 et répartition

**R3.1** — La phase 1 est close lorsque tous ses matchs sont saisis. Le classement
devient définitif et les crédits d'exemption (R2.9) sont appliqués.

**R3.2** — Entre la clôture de la phase 1 et le tirage de la phase 2,
l'organisateur peut **retirer des équipes** — celles qui quittent le tournoi avant
les finales. Le retrait est réversible tant que le tirage n'est pas figé (R4.8).

**R3.3** — Un retrait **ne modifie ni les scores ni le classement de la phase 1**.
Les matchs de l'équipe retirée ont eu lieu et les points que ses adversaires y ont
gagnés leur restent acquis. L'équipe est simplement marquée « retirée » et exclue
de la répartition.

**R3.4** — La coupure est franche, à la moitié du classement **des équipes
restantes**. Si leur nombre *N'* est impair, l'équipe supplémentaire va au
**tournoi principal**.

```
principal  = ceil(N' / 2)   équipes les mieux classées parmi les restantes
consolante = floor(N' / 2)  équipes restantes
```

**R3.5** — Tout retrait **recalcule la répartition**. La ligne de coupure se
déplaçant, une égalité de classement jusque-là sans conséquence peut devenir
décisive : R2.13 est donc réévaluée après chaque retrait.

Une égalité n'est soumise à l'arbitrage que si **au moins deux de ses équipes sont
encore en lice**. Le classement de phase 1 conserve les équipes retirées (R3.3),
mais départager deux équipes dont l'une ne dispute pas la phase 2 ne décide plus
rien : l'égalité s'éteint, et la décision enregistrée qui la concernait est écartée
au titre de R2.14.

**R3.6** — La répartition est figée au tirage de la phase 2.

---

## 4. Phase 2 — élimination directe

### 4.1 Construction du tableau

**R4.1** — Un tableau est construit pour chaque groupe. Sa taille est la
**puissance de deux immédiatement supérieure ou égale** à l'effectif du groupe.

**R4.2** — Les places non pourvues deviennent des **exemptions** de premier tour.
Leur nombre vaut `taille - effectif`, et il est toujours strictement inférieur au
nombre de matchs de premier tour.

**R4.3** — Toutes les branches ont ainsi la **même profondeur** : deux équipes
sans exemption disputent le même nombre de matchs pour atteindre la finale.

### 4.2 Tirage

**R4.4** — Le placement est **intégralement tiré au sort**, exemptions comprises.
Le classement de phase 1 ne détermine que le groupe d'appartenance (R3.4), jamais
la position dans le tableau.

**R4.5** — Le tirage **évite les réaffrontements au premier tour** : deux équipes
qui se sont rencontrées en phase 1 ne doivent pas se retrouver appariées d'entrée.

Cette contrainte n'est pas toujours satisfiable — si les équipes d'un groupe se
sont toutes rencontrées en phase 1, tout appariement est un remake. Le tirage la
traite donc comme un objectif à **minimiser**, non comme une interdiction :

- jusqu'à 1000 tirages sont évalués, avec arrêt immédiat dès qu'un tirage sans
  aucun réaffrontement est trouvé ;
- à défaut, le tirage retenu est celui qui en compte le moins ;
- si ce minimum n'est pas nul, **l'organisateur en est informé** avec le nombre de
  réaffrontements inévitables.

La contrainte ne porte que sur le premier tour : au-delà, les adversaires dépendent
des résultats et rien ne peut être garanti à l'avance.

**R4.6** — Deux exemptions ne peuvent jamais tomber dans le même match de premier
tour. R4.2 garantit que ce placement est toujours possible.

**R4.7** — La graine du tirage est enregistrée avec l'événement, afin que le
tableau soit reproductible après un rechargement.

**R4.8** — L'organisateur peut relancer le tirage d'un tableau **tant qu'aucun
score n'y a été saisi**. Passé cette limite, le tirage est figé, et les retraits
d'équipes (R3.2) ne sont plus possibles.

### 4.3 Saisie et propagation

**R4.9** — Le résultat d'un match se saisit au score et suit la règle de validité
R2.4, appliquée avec `ecartMinimumPhase2`. Le vainqueur en est déduit — il n'est
jamais désigné directement.

**R4.10** — Chaque match porte un lien sortant explicite vers le match qu'il
alimente et la place qu'il y occupe.

**R4.11** — Modifier ou effacer le résultat d'un match déjà saisi **invalide en
cascade** tous les matchs situés en aval. L'application affiche la liste des
matchs qui seront effacés et demande confirmation avant d'appliquer.

**R4.12** — Un match dont le résultat est saisi est **verrouillé**. Le déverrouiller
est une action explicite, soumise à R4.11.

### 4.4 Podium

**R4.13** — Le vainqueur de la finale est premier, son adversaire deuxième.

**R4.14** — Une petite finale est créée **dès que le tableau comporte deux
demi-finales**, alimentée par leurs perdants. Son vainqueur est troisième.

Un tableau de trois équipes n'en comporte qu'une : la troisième place revient alors
directement au perdant de cette unique demi-finale, sans match supplémentaire. Le
podium est complet, mais il n'y a rien à jouer pour la troisième place.

**R4.15** — Les groupes de petite taille sont traités explicitement :

| Effectif du groupe | Conséquence |
|---|---|
| 0 | Aucun tableau, aucun podium |
| 1 | L'équipe est première d'office. Pas de deuxième ni de troisième |
| 2 | Une finale. Pas de petite finale, donc pas de troisième |
| 3 | Une demi-finale et une finale. Le troisième est le perdant de la demi-finale, sans match de classement (R4.14) |
| ≥ 4 | Tableau complet, petite finale comprise |

**R4.16** — Les résultats s'affichent dès que **chaque tableau existant** a désigné
son vainqueur. Un groupe vide ne bloque pas l'affichage.

---

## 5. Forfaits et abandons

**R5.1** — Un match peut être marqué **forfait**. L'équipe présente gagne le match ;
l'absente le perd. Un forfait n'est pas un score et échappe donc à R2.4.

**R5.2** — Au classement de phase 1, un forfait vaut `+differentielForfait` pour
l'équipe présente et `-differentielForfait` pour l'absente. Il compte comme une
victoire pour R2.12.1 et ne contribue pas au total de points marqués (R2.12.3).

**R5.3** — En phase 2, un forfait qualifie l'adversaire pour le tour suivant. Le
match est marqué comme tel et la propagation R4.10 s'applique normalement.

**R5.4** — Les cas suivants sont **hors périmètre** : retrait d'une équipe en cours
de phase 1, ajout d'une équipe après le tirage. Le tirage de phase 1 n'est donc
jamais régénéré (R2.3). Le retrait entre les deux phases, lui, est prévu (R3.2).

---

## 6. Persistance

**R6.1** — **Un événement est un fichier**, dans un dossier d'événements sous le
répertoire de données de l'application. Créer un événement n'en détruit aucun autre,
et les tournois passés restent consultables indéfiniment, palmarès compris.

**R6.2** — L'état est écrit sur disque à chaque mutation, avec un anti-rebond de
500 ms. Au plus une saisie peut être perdue.

**R6.3** — L'écriture est atomique : fichier temporaire puis renommage. Une
coupure ne peut pas produire un fichier partiel.

**R6.4** — Dix sauvegardes horodatées sont conservées en rotation **par événement**,
en plus de son fichier courant.

**R6.5** — Toute sauvegarde relue est validée contre un schéma versionné. Un
fichier invalide est refusé avec un message explicite, jamais chargé partiellement,
et **n'empêche pas les autres événements de s'ouvrir**.

**R6.6** — Au démarrage, l'accueil **liste les événements**, le dernier ouvert en
tête, chacun avec sa date de dernière saisie et son état d'avancement.

**R6.7** — Chaque mutation est journalisée avec ses patches inverses. Annuler et
rétablir sont disponibles, **dans les limites de R6.8**.

**R6.8** — Un verrou — paramètres figés (R1.6), tirage figé (R4.8), match verrouillé
(R4.12) — est une **propriété de l'état**, pas un événement irréversible : il vit
dans le journal comme le reste. Mais **l'annulation est bornée** : elle ne franchit
ni la clôture de la phase 1, ni le gel d'un tirage.

> Annuler sert à rattraper une faute de frappe. Défaire une décision de structure
> passe par son chemin explicite — l'invalidation en cascade (R4.11) ou le retrait
> d'équipe (R3.2) — qui annonce ses conséquences et demande confirmation. Sans cette
> borne, une longue série d'annulations deviendrait une porte dérobée contournant
> tous les verrous, sans que rien ne soit confirmé ni affiché.

**R6.9** — Un événement peut être exporté et réimporté sous forme d'un fichier
`.cochonnet.json`.

---

## 7. Interface

**R7.1** — L'accueil est la **liste des événements** (R6.6) : on en ouvre un, on en
crée un, on en supprime un. Rien d'autre ne s'y trouve.

**R7.2** — À l'intérieur d'un événement, la navigation est linéaire : Configuration
→ Phase 1 → Clôture → Phase 2 → Résultats. L'accès à un écran est **dérivé de
l'état du tournoi**, jamais d'un historique de navigation.

**R7.3** — Un écran intermédiaire, entre la phase 1 et le tirage de la phase 2,
présente le classement définitif, permet les retraits (R3.2) et affiche la
répartition résultante avant validation.

**R7.4** — Un **affichage public** est disponible dans une fenêtre dédiée, ouverte
sur un second écran lorsqu'il est détecté. Il alterne automatiquement entre le
classement et les matchs en cours, en très grands caractères, pendant que
l'organisateur continue de saisir dans la fenêtre principale.

**R7.5** — La saisie des scores se fait entièrement au clavier : `Tab` enchaîne les
champs, `Entrée` valide le match. Un score refusé par R2.4 est signalé sur-le-champ,
avec la raison du refus.

**R7.6** — Toute action destructrice — supprimer une équipe, retirer une équipe
avant la phase 2, déverrouiller un match, relancer un tirage — demande confirmation
et annonce ses conséquences.

---

## 8. Invariants testables

Ces propriétés sont vérifiées automatiquement, pour tout effectif de 2 à 64 et
toute valeur valide de *M*.

**I1** — Aucune paire d'équipes ne se rencontre deux fois en phase 1.

**I2** — L'écart entre le nombre de matchs de l'équipe la plus sollicitée et celle
qui l'est le moins ne dépasse jamais 1.

**I3** — Aucune équipe n'est exemptée deux fois tant qu'une autre ne l'a pas été
une fois.

**I4** — Un score accepté par R2.4 est toujours atteignable, et tout score
atteignable est accepté. Le test compare la formule de R2.4 à une **simulation
point par point** d'une partie, pour tout `ecartMinimum` de 0 à 16 et tout score
jusqu'à 40–40. La formule a été établie de cette façon : une première rédaction,
qui raisonnait sur le point précédent plutôt que sur l'écart final, acceptait à
tort 14–13 — c'est la simulation qui l'a révélé.

**I5** — Toutes les branches d'un tableau de phase 2 ont la même profondeur.

**I6** — Deux exemptions ne partagent jamais un match de premier tour.

**I7** — Le tirage de phase 2 ne produit aucun réaffrontement de premier tour dès
lors qu'un tel tirage existe ; sinon il en produit le minimum possible, et ce
nombre est remonté à l'appelant.

**I8** — Après invalidation en cascade (R4.11), aucun match en aval ne conserve de
résultat.

**I9** — Aucune équipe ne peut apparaître dans un match de phase 2 sans avoir
gagné le match qui l'y a amenée, ou bénéficié d'une exemption.

**I10** — Retirer une équipe entre les deux phases ne modifie aucun score ni aucun
rang de phase 1.

**I11** — Le classement est une fonction pure des scores saisis : recharger une
sauvegarde reproduit exactement le même ordre.

**I12** — Une décision de départage enregistrée (R2.13) est rejouée à l'identique
tant que l'ensemble des équipes qu'elle départage est inchangé, et écartée dès que
cet ensemble change.

**I13** — Annuler et rétablir ne franchissent jamais la clôture de la phase 1 ni le
gel d'un tirage (R6.8). Aucune séquence d'annulations ne lève un verrou.

**I14** — Créer, ouvrir ou supprimer un événement ne modifie aucun autre événement.
Un fichier d'événement illisible n'empêche pas les autres de s'ouvrir.

---

## 9. Hors périmètre, explicitement

Ces points ont été examinés et écartés. Les inscrire ici évite de les rouvrir par
inadvertance.

- **Parties arrêtées au temps.** Toute partie va à son terme. R2.4 refuse un score
  qui ne conclut pas une partie ; une équipe qui renonce relève du forfait.
- **Composition des équipes.** Une équipe est un nom (R1.2).
- **Impression et export PDF.** Aucune sortie imprimable. L'affichage public (R7.3)
  couvre le besoin de diffusion.
- **Gestion des terrains.** Les matchs sont listés sans emplacement.
- **Retrait ou ajout d'équipe en cours de phase 1.** Seul le retrait entre les deux
  phases est prévu (R3.2).
- **Têtes de série en phase 2.** Le tirage est intégralement aléatoire (R4.4), sous
  la seule contrainte R4.5.
