# MyPerf — Guide utilisateur

> Tracker d'entraînement offline, conçu pour l'hypertrophie avec un niveau de détail maximal.

---

## Sommaire

1. [Vue d'ensemble](#vue-densemble)
2. [Navigation](#navigation)
3. [TODAY — Démarrer une séance](#today--démarrer-une-séance)
4. [Séance active](#séance-active)
   - [Ajouter un exercice](#ajouter-un-exercice)
   - [Renseigner une série](#renseigner-une-série)
   - [Timer de repos](#timer-de-repos)
   - [Terminer la séance](#terminer-la-séance)
5. [LOG — Historique & statistiques](#log--historique--statistiques)
6. [PLAN — Planning & periodisation](#plan--planning--periodisation)
7. [EXOS — Catalogue d'exercices](#exos--catalogue-dexercices)
8. [CFG — Réglages](#cfg--réglages)
9. [Concepts clés](#concepts-clés)

---

## Vue d'ensemble

MyPerf enregistre tes séances en détail — chaque série, chaque kilo, chaque tempo — et te donne les données du **dernier passage** en temps réel pendant l'effort. Tout fonctionne hors-ligne, rien ne part sur un serveur.

Il est pensé pour des pratiquants qui suivent une vraie programmation (PPL, Upper/Lower, etc.) et veulent des métriques précises : tonnage, e1RM estimé, volume par groupe musculaire, fréquence d'entraînement.

---

## Navigation

La barre en bas donne accès aux 5 sections de l'app :

| Onglet | Icône | Rôle |
|--------|-------|------|
| **TODAY** | ⚡ | Écran principal — démarre ou continue ta séance du jour |
| **PLAN** | 📅 | Calendrier + templates + macrocycles |
| **LOG** | 📊 | Historique de toutes tes séances + stats |
| **EXOS** | 🏋️ | Catalogue d'exercices — consultation et création |
| **CFG** | ⚙️ | Thème visuel de l'app |

Le bouton **TODAY** est centré et légèrement surélevé — c'est l'action principale.

---

## TODAY — Démarrer une séance

### L'écran d'accueil

En haut à gauche : la date du jour. En haut à droite : un **chip "X séances cette semaine"** apparaît dès que tu as complété au moins une séance dans les 7 derniers jours.

Si tu as un mésocycle actif, une **bannière colorée** s'affiche sous la date :
- La couleur correspond au **type de bloc** (bleu = hypertrophie, rouge = force, jaune = puissance, etc.)
- Elle indique la **semaine en cours** sur le total (ex : S2/6) et le nom du mésocycle

### Démarrer

**Séance planifiée ce jour** — une carte s'affiche avec le nom du template et le type de bloc. Appuie sur **"Lancer la séance"** pour démarrer directement depuis le template (les exercices et paramètres sont pré-remplis).

**Aucune séance planifiée** — le bouton **"Séance libre"** démarre une séance vierge. Tu ajoutes les exercices toi-même.

> Si une séance planifiée est affichée mais que tu préfères faire autre chose, le lien **"Démarrer une séance libre à la place"** est disponible en dessous.

---

## Séance active

Une fois la séance lancée, l'écran de séance active apparaît.

### En-tête

- **Chrono** (grand chiffre à gauche) : temps écoulé depuis le début, mis à jour chaque seconde
- **Nom de la séance** + nombre d'exercices ajoutés
- **Bouton "Fin"** (rouge, en haut à droite) : ouvre la fenêtre de fin de séance

### Ajouter un exercice

Appuie sur le bouton **"+ Exercice"** en bas à droite de l'écran.

Un panneau s'ouvre avec :
- Une **barre de recherche** (autofocus)
- Des **chips de filtre par groupe musculaire**, chacun avec sa couleur
  - Rouge = Pecto · Bleu = Dos · Vert = Jambes · Jaune = Épaules · Violet = Bras · Gris = Core
- La liste des exercices avec, pour chacun : nom, groupe musculaire, équipement

Appuie sur un exercice pour l'ajouter à la séance. Tu peux fermer le panneau avec la croix en haut.

### Carte exercice

Chaque exercice ajouté apparaît sous forme de carte. Sur la gauche de la carte, une **barre colorée de 4px** indique l'intention active (voir [Concepts clés](#concepts-clés)).

**En-tête de la carte :**
- **Nom de l'exercice** (gros, gras)
- **Badge d'intention** (ex : "Hypertrophie") — appuie dessus pour en changer
- **Compteur de séries** (ex : "2/5 séries")
- **Pill de progression** à droite (ex : 2/5) — vire au vert quand toutes les séries sont complètes
- **Tonnage** et **e1RM estimé** s'affichent en chips dès que des séries de travail sont complétées
- La **croix** en haut à droite retire l'exercice et ses séries

**Changer d'intention :**
Appuie sur le badge (ex : "Hypertrophie") pour dérouler le sélecteur. Choisis parmi :
- **Puissance** (jaune) — tempo explosif, longs repos
- **Force** (rouge) — charges lourdes, peu de reps
- **Hypertrophie** (bleu) — volume modéré, tension mécanique
- **Endurance** (vert) — hautes reps, courts repos
- **Métabolique** (violet) — brûlure musculaire, rest-pause / drop sets

L'intention influence la **durée de repos par défaut** du timer automatique.

### Renseigner une série

Chaque ligne de série contient :

```
 #   TYPE      POIDS      REPS      ✓
 1  TRAVAIL    70.0 kg    12 ×      ○
              ↑ 65.0     ↑ 10
     RPE 8   ·  RIR 1  · ⏱ 3-0-X-0
```

**Numéro** — à gauche, non modifiable.

**Type de série** (badge coloré) — appuie pour le faire tourner dans le cycle :
- **Chauffe** (jaune) — non comptée dans le tonnage
- **Travail** (bleu) — série principale
- **Drop** (rouge) — drop set enchaîné
- **R+P** (violet) — rest-pause
- **Myoreps** (vert)

**Poids** et **Reps** — appuie sur le chiffre pour éditer. Le clavier numérique s'ouvre. Valide avec la touche "Suivant" ou "OK" pour passer au champ suivant.

**Flèches de référence (↑)** — si tu as déjà fait cet exercice dans une séance précédente, les valeurs du **dernier passage** s'affichent en petit sous les champs (en bleu). Elles te donnent un repère pour progresser.

**Bouton ✓** (cercle à droite) — appuie pour **valider la série**. La ligne vire au vert, le timer de repos se déclenche automatiquement.

**Supprimer une série** — glisse la ligne vers la **gauche** pour faire apparaître le bouton de suppression rouge.

#### RPE, RIR et Tempo

En bas de chaque ligne de série, trois champs optionnels :

- **RPE** (Rate of Perceived Exertion) : ton effort ressenti de 0 à 10. 10 = échec absolu, 8 = 2 reps en réserve.
- **RIR** (Reps In Reserve) : nombre de reps que tu aurais pu faire en plus.
- **Tempo** (⏱) : appuie sur le chrono pour ouvrir l'éditeur. Format `Ecc - Bas - Con - Haut` en secondes. `X` = explosif.
  - Exemple `3-1-X-0` : 3s de descente, 1s en bas, explosif à la montée, 0s en haut.

### Timer de repos

Dès qu'une série est complétée (bouton ✓), le **timer de repos** apparaît en bas de l'écran. Il affiche :
- Le type de séance (ex : HYPERTROPHIE)
- Une **barre de progression** qui se vide
- Le **temps restant** en grand
- Les boutons **-30s** et **+30s** pour ajuster à la volée
- Le bouton **"Passer"** pour ignorer le repos et enchaîner

**Modifier la durée de repos :** appuie directement sur le grand chrono. Deux roues (minutes et secondes) apparaissent pour choisir une durée personnalisée. Confirme avec le bouton vert ✓.

**Durées par défaut selon l'intention :**
| Intention | Repos |
|-----------|-------|
| Puissance | 4 min |
| Force | 3 min |
| Hypertrophie | 1 min 30 |
| Endurance | 1 min |
| Métabolique | 45 sec |

Le timer se ferme automatiquement à zéro (vibration d'alerte à 10 secondes).

### Terminer la séance

Appuie sur **"Fin"** en haut à droite. Une fenêtre de confirmation s'ouvre avec :
- La durée totale et le nombre d'exercices
- Un champ **notes libres** (optionnel) — idéal pour noter un PR, une sensation, un ajustement

Appuie sur **"Sauvegarder"** pour enregistrer la séance. Elle apparaît immédiatement dans l'historique.

---

## LOG — Historique & statistiques

### En-tête : volume hebdomadaire

Une carte **"Volume 7 derniers jours"** affiche des barres horizontales pour chaque groupe musculaire. La couleur des barres indique le niveau de volume :
- **Bleu / accent** : volume normal
- **Orange** : volume élevé (≥ 5 séries)
- **Rouge** : volume très élevé (≥ 10 séries)

Sous les barres, la **Body Map** colorise les muscles travaillés sur un schéma corporel.

### Fréquence d'entraînement

La carte **"Fréquence 4 dernières semaines"** est une grille (muscles × semaines). Chaque cellule indique combien de fois ce groupe musculaire a été entraîné cette semaine :
- Cellule vide = 0 séance
- Cellule foncée = 1 séance
- Cellule encore plus foncée = 2 séances
- Cellule pleine = 3+ séances

La légende en bas à droite rappelle l'échelle.

### Liste des séances

En dessous des statistiques, toutes les séances terminées apparaissent, les plus récentes en premier.

**Chaque carte de séance affiche :**
- Le nom et la date/heure
- La durée
- Le nombre de séries et le tonnage total
- La liste des exercices (max 4, puis "+X exercices")
- Les notes de séance si renseignées

**Appuie sur une carte** pour ouvrir le **détail complet** de la séance.

### Détail d'une séance

- **En-tête** : date, heure, durée
- **Stats** : séries complétées / total, nb d'exercices, volume total en tonnes
- **Par exercice** : toutes les séries avec type, poids, reps, RPE, RIR, tempo

**Icône graphique** (bouton ≈ à droite du nom de l'exercice) : ouvre le **graphique de progression** pour cet exercice.

### Graphique de progression

Trois métriques disponibles :
- **Poids max** : le poids le plus lourd soulevé à chaque séance
- **e1RM** : force maximale estimée (formule de Epley : poids × (1 + reps/30))
- **Volume** : tonnage total de la séance pour cet exercice

Un **badge "PR"** apparaît si ta dernière séance dépasse ton précédent maximum sur la métrique sélectionnée.

L'historique détaillé en bas du graphique montre les 8 dernières valeurs avec le delta (variation) par rapport à la séance précédente.

---

## PLAN — Planning & periodisation

### Calendrier semaine

La vue principale est un calendrier à 7 jours. Navigue entre les semaines avec les flèches `←` `→`.

Chaque jour affiche des **indicateurs** :
- **Point bleu** : une séance est planifiée ce jour
- **Point vert** : une séance a été réalisée ce jour

Appuie sur un jour pour voir les séances planifiées et réalisées de ce jour.

### Planifier une séance

Avec un jour sélectionné, appuie sur **"Planifier"**. Une fenêtre s'ouvre pour choisir :
- Le **template** à utiliser
- Le **type de bloc** (accumulation, hypertrophie, transmutation, réalisation, deload, puissance) — définit la couleur et l'intention générale de la séance

La séance planifiée apparaît alors sur le calendrier et sera visible sur l'écran TODAY quand ce jour arrive.

**Supprimer une séance planifiée** : appuie longuement ou glisse sur la carte dans le calendrier.

### Templates

Les **templates** sont des modèles de séance réutilisables. Ils contiennent une liste d'exercices avec leurs paramètres par défaut.

**Créer un template :**
1. Appuie sur **"+ Nouveau template"** dans la section Templates
2. Donne-lui un nom (ex : "Push A")
3. Ajoute des exercices dans l'ordre souhaité
4. Pour chaque exercice : définis l'intention, les plages de reps, le RPE cible, le temps de repos
5. Sauvegarde

Quand tu lances une séance depuis un template, les séries sont **pré-remplies avec le dernier poids utilisé** pour chaque exercice.

### Macrocycles et mésocycles

Un **macrocycle** est ton plan d'entraînement à grande échelle (ex : 6 mois de prépa).
Un **mésocycle** est un bloc au sein du macrocycle (ex : 6 semaines d'hypertrophie).

**Créer un macrocycle :**
Appuie sur **"+ Macrocycle"**. Donne un nom et une date de début/fin.

**Créer un mésocycle :**
Depuis la timeline du macrocycle, appuie sur **"+ Mésocycle"**. Un assistant en plusieurs étapes te guide pour définir :
1. Le **nom** et le **type de bloc** (couleur associée)
2. La **durée** (nombre de semaines)
3. La **date de début**
4. Le **template** à utiliser
5. Les **jours d'entraînement** dans la semaine (ex : Lundi, Mercredi, Vendredi)
6. La **répartition du volume** semaine par semaine (ex : 80% → 90% → 100% → 110% → déload 60%)

Une fois créé, le mésocycle génère automatiquement toutes les séances planifiées dans le calendrier. La **bannière TODAY** s'active et affiche ta semaine en cours.

---

## EXOS — Catalogue d'exercices

### Consulter le catalogue

La liste affiche tous les exercices disponibles. Tu peux **filtrer** par :
- Groupe musculaire (chips en haut)
- Équipement (chips en haut)
- Recherche textuelle

Chaque exercice affiche son groupe musculaire principal et son équipement.

### Créer un exercice

Appuie sur le **bouton +** en bas à droite (ou sur "Créer un exercice" si la liste est vide).

**Champs disponibles :**

| Champ | Description |
|-------|-------------|
| Nom | Nom de l'exercice |
| Groupe musculaire principal | Chest / Back / Legs / Shoulders / Arms / Core |
| Muscles secondaires | Plusieurs sélectionnables (pec upper, lats, quads…) |
| Équipement | Barre / Haltères / Câble / Machine / Poids de corps / etc. |
| Type | Polyarticulaire ou Isolation |
| Unilatéral | Switch on/off |
| Prise | Pronation / Supination / Neutre / Mixte |
| Angle de travail | Plat / Incliné / Overhead / Bas de poulie… |

**Modifier un exercice** : appuie sur son nom dans la liste.

**Supprimer un exercice** : bouton "Supprimer" en bas du formulaire d'édition.

---

## CFG — Réglages

### Choisir le thème

Quatre thèmes disponibles :

| Thème | Description |
|-------|-------------|
| **Automatique** | Suit le mode clair/sombre du téléphone |
| **Clair** | Fond blanc, texte sombre |
| **Sombre** | Fond gris foncé, texte clair |
| **OLED** | Fond noir absolu (économise la batterie sur dalles OLED) |
| **Néo** | Bleu-noir profond + cyan électrique — thème signature de MyPerf |

Appuie sur un thème pour l'activer instantanément.

---

## Concepts clés

### Intention d'exercice

L'intention définit **l'objectif de l'exercice** dans la séance. Elle influence le timer de repos par défaut et permet de contextualiser tes données dans l'historique.

| Intention | Profil type |
|-----------|-------------|
| **Puissance** | 1-3 reps, charges max, repos 4 min |
| **Force** | 3-6 reps, haute intensité, repos 3 min |
| **Hypertrophie** | 6-20 reps, tension métabolique, repos 90 sec |
| **Endurance** | 20+ reps, courts repos, 60 sec |
| **Métabolique** | Brûlure musculaire, techniques avancées, 45 sec |

### Types de séries

- **Chauffe** — série de montée en charge. Non comptée dans le tonnage.
- **Travail** — série principale. Compte dans le tonnage et le calcul d'e1RM.
- **Drop** — enchaîne immédiatement après une série travail en réduisant le poids.
- **R+P (Rest-Pause)** — courte pause intra-série (5-15 sec) puis continuation.
- **Myoreps** — activation puis mini-séries très courtes avec repos minimaux.

### RPE et RIR

**RPE (Rate of Perceived Exertion)** mesure l'effort ressenti de 0 à 10 :
- **10** = échec musculaire, impossible de faire une rep de plus
- **9** = 1 rep en réserve
- **8** = 2 reps en réserve
- **7** = 3 reps en réserve

**RIR (Reps In Reserve)** est l'inverse : le nombre de reps que tu aurais pu faire. RPE 8 = RIR 2.

> Utiliser RPE/RIR permet de réguler l'intensité automatiquement selon les jours de forme, sans être esclave d'un % de RM fixe.

### Notation de tempo

Le tempo est noté en 4 phases : **Excentrique - Pause bas - Concentrique - Pause haut**.

Chaque chiffre = durée en secondes. `X` = explosif (aussi vite que possible).

| Notation | Signification |
|----------|---------------|
| `3-1-X-0` | 3 sec de descente, 1 sec pause en bas, remontée explosive, pas de pause en haut |
| `2-0-2-0` | Tempo contrôlé à 2 secondes dans les deux phases |
| `4-2-1-0` | Descente lente 4 sec, pause 2 sec en étirement, remontée normale |

### e1RM (force max estimée)

L'**e1RM** (estimated 1 Rep Max) est le poids maximal que tu pourrais théoriquement soulever en 1 rep, calculé depuis tes séries à plus haute répétition. MyPerf utilise la formule de Epley :

**e1RM = poids × (1 + reps ÷ 30)**

Exemple : 80 kg × 10 reps → e1RM = 80 × 1.33 = **106.7 kg**

C'est un indicateur de progression objectif, indépendant du nombre de reps choisi ce jour-là.

### Ghost (données du dernier passage)

Quand tu renseignes une série, les **flèches bleues ↑** sous les champs poids et reps montrent les valeurs que tu avais faites **la dernière fois que tu as effectué cet exercice**. C'est ton point de référence pour progresser ou maintenir.

### Types de blocs (mésocycles)

| Bloc | Couleur | Objectif |
|------|---------|----------|
| **Accumulation** | Vert | Construire le volume progressivement |
| **Hypertrophie** | Bleu | Volume élevé, modéré en intensité |
| **Transmutation** | Orange | Convertir le volume en force |
| **Réalisation** | Rouge | Peaks de force, taper |
| **Deload** | Gris | Récupération active (-40% de volume) |
| **Puissance** | Jaune | Vitesse d'exécution, force-vitesse |

---

*MyPerf — tout reste sur ton téléphone, rien dans le cloud.*
