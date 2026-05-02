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
   - [Réorganiser les exercices](#réorganiser-les-exercices)
   - [Notes par exercice](#notes-par-exercice)
   - [Terminer la séance](#terminer-la-séance)
5. [LOG — Historique & statistiques](#log--historique--statistiques)
6. [Corps & Mensurations](#corps--mensurations)
7. [Forme & Fatigue](#forme--fatigue)
8. [PLAN — Planning & periodisation](#plan--planning--periodisation)
9. [EXOS — Catalogue d'exercices](#exos--catalogue-dexercices)
10. [CFG — Réglages](#cfg--réglages)
11. [Concepts clés](#concepts-clés)

---

## Vue d'ensemble

MyPerf enregistre tes séances en détail — chaque série, chaque kilo, chaque tempo — et te donne les données du **dernier passage** en temps réel pendant l'effort. Tout fonctionne hors-ligne, rien ne part sur un serveur.

Il est pensé pour des pratiquants qui suivent une vraie programmation (PPL, Upper/Lower, etc.) et veulent des métriques précises : tonnage, e1RM estimé, volume par groupe musculaire, records personnels, suivi du poids de corps, et auto-régulation de la fatigue.

---

## Navigation

La barre en bas donne accès aux 5 sections de l'app :

| Onglet | Icône | Rôle |
|--------|-------|------|
| **TODAY** | ⚡ | Écran principal — démarre ou continue ta séance du jour |
| **PLAN** | 📅 | Calendrier + templates + macrocycles |
| **LOG** | 📊 | Historique des séances + statistiques de volume |
| **EXOS** | 🏋️ | Catalogue d'exercices — consultation et création |
| **CFG** | ⚙️ | Thème visuel + export des données |

Le bouton **TODAY** est centré et surélevé — c'est l'action principale. Chaque appui sur un onglet déclenche un retour haptique et une animation de rebond.

---

## TODAY — Démarrer une séance

### L'écran d'accueil

En haut à gauche : la date du jour. En haut à droite : un **chip "X séances cette semaine"** apparaît dès que tu as complété au moins une séance dans les 7 derniers jours.

Si tu as un mésocycle actif, une **bannière colorée** s'affiche sous la date :
- La couleur correspond au **type de bloc** (bleu = hypertrophie, rouge = force, jaune = puissance, etc.)
- Elle indique la **semaine en cours** sur le total (ex : S2/6) et le nom du mésocycle

### Badge de forme

Un badge compact **"Évaluer ta forme →"** s'affiche sous la bannière de mésocycle. Appuie dessus pour enregistrer ton état du jour (sommeil, courbatures, stress, motivation).

Si tu as déjà évalué ta forme aujourd'hui, le badge affiche ton score coloré : **vert** (≥ 3.5/5), **orange** (2.5–3.5), **rouge** (< 2.5).

### Démarrer

**Séance planifiée ce jour** — une carte s'affiche avec le nom du template et le type de bloc. Appuie sur **"Lancer la séance"** pour démarrer directement depuis le template.

**Aucune séance planifiée** — le bouton **"Séance libre"** démarre une séance vierge.

---

## Séance active

### En-tête

- **Chrono** (32px, à gauche) : temps écoulé, mis à jour chaque seconde. Un point vert pulse à côté.
- **Nom de la séance** + nombre d'exercices
- **"≡ Ordre"** (apparaît dès 2+ exercices) : active le mode réorganisation
- **Bouton "Fin"** (rouge) : ouvre la fenêtre de fin de séance

### Ajouter un exercice

Appuie sur le bouton **"+ Exercice"** (pill en bas à droite).

Le panneau s'ouvre avec :
- Une **barre de recherche** autofocus avec compteur de résultats
- Des **chips de filtre par groupe musculaire**, chacun coloré (rouge = Pecto, bleu = Dos, vert = Jambes, jaune = Épaules, violet = Bras, gris = Core)
- La liste des exercices avec une barre colorée à gauche indiquant le groupe musculaire

### Carte exercice

Chaque exercice est une carte avec une **barre colorée de 4px** à gauche indiquant l'intention.

**En-tête de la carte :**
- **Nom de l'exercice** (17px bold)
- **Badge d'intention** tappable pour changer
- **Compteur de séries** + **pill de progression** (vire au vert quand tout est fait)
- **Tonnage** et **e1RM live** en chips dès que des séries de travail sont validées
- **Croix** pour retirer l'exercice

**Changer d'intention :** appuie sur le badge pour dérouler le sélecteur avec icônes et couleurs.

### Renseigner une série

```
 #   TYPE        POIDS       REPS       ✓
 1  TRAVAIL    70.0 kg     12 ×        ○
               ↑ 65.0      ↑ 10
     [RPE 8]  ·  [RIR 1]  ·  [⏱ 3-0-X-0]
```

- **Type** (badge) : appuie pour cycler (Chauffe → Travail → Drop → R+P → Myoreps)
- **Poids / Reps** : chiffres en 22px, tap pour éditer au clavier
- **↑ valeurs en bleu** : dernier passage sur cet exercice
- **Bouton ✓** : valide la série → fond vert + animation de pop + timer de repos
- **Glisse à gauche** pour supprimer la ligne

**RPE, RIR, Tempo** : chips en bas de chaque ligne. Tap tempo → éditeur 4 champs (Ecc / Bas / Con / Haut, `X` = explosif).

### Timer de repos

Panneau flottant qui remonte depuis le bas dès qu'une série est validée.

- **Barre de progression** + grand chrono coloré (rouge à 10 secondes)
- **-30s / +30s** pour ajuster
- **Tap sur le chrono** → deux roues de sélection (minutes 0-15 / secondes 0/15/30/45) pour une durée personnalisée
- **"Passer"** pour ignorer

| Intention | Repos par défaut |
|-----------|-----------------|
| Puissance | 4 min |
| Force | 3 min |
| Hypertrophie | 1 min 30 |
| Endurance | 1 min |
| Métabolique | 45 sec |

### Réorganiser les exercices

Avec 2+ exercices dans la séance, appuie sur **"≡ Ordre"** dans le header.

Chaque carte affiche des boutons **↑** et **↓** (désactivés aux extrémités). L'ordre est sauvegardé immédiatement en base. Appuie sur **"✓ Terminé"** pour quitter ce mode.

### Notes par exercice

En bas de chaque carte exercice, un champ **"Notes sur cet exercice…"** permet d'annoter une sensation, une technique particulière ou un ajustement. La note est sauvegardée automatiquement.

### Terminer la séance

Appuie sur **"Fin"**. Une fenêtre s'ouvre avec :
- La durée totale et le nombre d'exercices
- Un champ **notes libres** pour la séance
- Un switch **"Sauvegarder comme template"** : si activé, un TextInput apparaît pour nommer le template. Appuie sur "Sauvegarder" — la séance est enregistrée **et** un template réutilisable est créé.

---

## LOG — Historique & statistiques

### Volume hebdomadaire avec landmarks MEV/MAV/MRV

La carte **"Volume 7 derniers jours"** affiche des barres pour chaque groupe musculaire. La couleur indique où tu te situes par rapport aux seuils scientifiques :

| Couleur | Zone | Signification |
|---------|------|---------------|
| **Gris** | < MEV | Volume insuffisant pour stimuler la croissance |
| **Vert** | MEV → MAV | Zone optimale — progression maximale |
| **Orange** | MAV → MRV | Volume élevé — récupération à surveiller |
| **Rouge** | > MRV | Surentraînement probable |

Deux repères verticaux sur chaque barre marquent le MEV et le plafond de la MAV. La légende de couleur est affichée sous les barres.

### Corps & Mensurations (lien vers page dédiée)

Un bouton **"Corps & Mensurations"** renvoie vers la page dédiée au suivi du poids de corps et des mensurations. Voir section [Corps & Mensurations](#corps--mensurations).

### Forme & Charge (Readiness)

La carte **"Forme & Charge"** affiche :
- La **timeline des 7 derniers jours** de forme (dots colorés vert/orange/rouge)
- Le **ratio Aiguë/Chronique (A:C)** : charge des 7 derniers jours vs moyenne des 28 derniers jours — vert < 1.3, orange 1.3–1.5, rouge > 1.5
- Une **bannière de déload suggéré** si ratio > 1.3 ET forme < 3/5
- Si aucune évaluation aujourd'hui : le formulaire de check-in s'affiche directement dans la carte

### Records personnels (PRs)

La carte **"Records personnels"** liste tes meilleurs poids max et e1RM par exercice, triés par e1RM décroissant. Se met à jour automatiquement quand une séance est terminée.

### Heatmap de fréquence

Grille 4 semaines × 6 groupes musculaires. Chaque cellule = nombre de séances pour ce groupe cette semaine. Légende de densité en bas.

### Recherche dans l'historique

Une barre de recherche au-dessus de la liste filtre les séances par **nom** ou **notes**. Un compteur de résultats s'affiche. Efface la recherche avec la croix ou le bouton "×".

### Détail d'une séance

Tap sur une carte → détail complet avec toutes les séries (type, poids, reps, RPE, RIR, tempo).

Tap sur l'**icône graphique** à droite d'un exercice → graphique de progression (poids max / e1RM / volume) avec détection PR et tableau des 8 dernières valeurs.

---

## Corps & Mensurations

Accessible depuis le bouton "Corps & Mensurations" dans LOG (ou directement depuis une URL interne `/body`).

### Saisir une mesure

Appuie sur le bouton **"+"** (en haut à droite). Le formulaire s'ouvre :
- **Date** : navigue avec ← → (défaut = aujourd'hui, mais tu peux saisir rétrospectivement n'importe quand)
- **Poids** (kg) — champ principal, affiché en grand
- Toggle **"Mensurations détaillées"** pour afficher les champs optionnels : % masse grasse, poitrine, taille, hanches, bras gauche/droit, cuisse gauche/droite (tous en cm)
- **Notes** optionnelles

Il n'y a **aucune fréquence imposée** — tu saisis quand tu veux, une fois par semaine ou plus rarement.

### Statistiques rapides

En haut de la page :
- Dernier poids en grand (36px)
- **Delta** par rapport à l'entrée précédente (vert = perte de poids, rouge = prise)
- Date de la dernière saisie
- % masse grasse si renseigné

### Graphique de poids

Courbe des 16 dernières entrées (pleine largeur). Le dernier point est mis en évidence. Les dates extrêmes et médianes sont affichées sur l'axe X.

### Mensurations

Grille 2 colonnes avec toutes les mesures qui ont au moins une valeur saisie. Chaque case affiche :
- Le libellé (ex : "Taille")
- La dernière valeur
- Le delta par rapport à la saisie précédente (sens positif/négatif adapté : moins = vert pour taille/hanches/MG, plus = vert pour bras/cuisses)

### Historique complet

Toutes les entrées en ordre chronologique inverse. Chaque ligne affiche la date, le poids, et les mensurations non-nulles sous forme de chips. **Glisse à gauche** pour supprimer une entrée.

---

## Forme & Fatigue

### Check-in quotidien

Accessible depuis :
- Le badge "Évaluer ta forme" sur l'écran **TODAY**
- La carte "Forme & Charge" dans **LOG** (si pas encore fait aujourd'hui)

Le formulaire demande 4 évaluations sur une échelle de 1 à 5 :

| Critère | 1 | 5 |
|---------|---|---|
| 😴 **Sommeil** | Très mauvais | Excellent |
| 💪 **Courbatures** | Très courbaturé | Aucune douleur |
| 🧠 **Stress** | Très stressé | Aucun stress |
| 🔥 **Motivation** | Aucune | Maximale |

Les boutons sont colorés intelligemment : vert pour les valeurs favorables, orange/rouge pour les valeurs défavorables (le sens est inversé pour courbatures et stress).

Une fois les 4 critères remplis, le bouton "Enregistrer" s'active. Les notes sont optionnelles.

### Score de forme

Le score est calculé automatiquement : `(sommeil + (6−courbatures) + (6−stress) + motivation) / 4`

Résultat sur 5 : **vert ≥ 3.5**, **orange 2.5–3.5**, **rouge < 2.5**.

### Ratio Aiguë/Chronique (A:C)

Indicateur standard en science du sport pour prévenir les blessures par surmenage :

- **Charge aiguë** = nombre de séries de travail complétées cette semaine
- **Charge chronique** = moyenne hebdomadaire sur les 28 derniers jours
- **Ratio A:C** = charge aiguë / charge chronique

| Ratio | Interprétation |
|-------|----------------|
| < 0.8 | Sous-entraînement |
| 0.8 – 1.3 | Zone optimale |
| 1.3 – 1.5 | Surveiller la fatigue |
| > 1.5 | Risque élevé — déload recommandé |

Si le ratio > 1.3 **et** la forme < 3/5, MyPerf affiche une bannière **"Déload recommandé"**.

---

## PLAN — Planning & periodisation

### Calendrier semaine

Vue à 7 jours navigable avec ← →. Indicateurs par jour :
- **Point bleu** : séance planifiée
- **Point vert** : séance réalisée

Tap sur un jour → détail du jour. Bouton "Planifier" pour ajouter une séance.

### Planifier une séance

Choisir le template et le type de bloc. La séance planifiée apparaît sur le calendrier et sur TODAY le jour J.

**Jour sans séance planifiée** (futur) : bouton **"Planifier une séance"** directement sur la page du jour vide.

**Supprimer** : appuie sur la corbeille sur la carte de la séance planifiée.

### Templates

Modèles de séance réutilisables avec exercices ordonnés, intentions, plages de reps, RPE cible, temps de repos.

**Créer depuis une séance existante** : à la fin d'une séance, active le switch "Sauvegarder comme template" et donne un nom.

**Créer manuellement** : PLAN → Templates → "+ Nouveau template".

### Macrocycles et mésocycles

**Macrocycle** = plan à grande échelle (ex : 6 mois).
**Mésocycle** = bloc de programmation (ex : 6 semaines d'hypertrophie).

Un assistant en plusieurs étapes guide la création du mésocycle : nom, type de bloc, durée, date de début, jours d'entraînement, répartition du volume semaine par semaine. Les séances sont générées automatiquement.

---

## EXOS — Catalogue d'exercices

### Consulter

Filtres par groupe musculaire, équipement, et recherche textuelle. Chaque exercice affiche son groupe et son équipement.

### Créer / Modifier

| Champ | Description |
|-------|-------------|
| Nom | Nom de l'exercice |
| Groupe musculaire principal | Chest / Back / Legs / Shoulders / Arms / Core |
| Muscles secondaires | Sélection multiple |
| Équipement | Barre / Haltères / Câble / Machine / Poids de corps / etc. |
| Type | Polyarticulaire ou Isolation |
| Unilatéral | Toggle |
| Prise | Pronation / Supination / Neutre / Mixte |
| Angle | Plat / Incliné / Overhead / Bas de poulie… |

---

## CFG — Réglages

### Thèmes

| Thème | Identité visuelle |
|-------|-----------------|
| **Automatique** | Suit le mode clair/sombre du système |
| **Clair** | Fond `#F5F5F7`, bleu profond `#2563EB` |
| **Sombre** | Charcoal `#1C1C1E`, bleu iOS `#0A84FF` |
| **OLED** | Noir pur, accents iOS — économise la batterie OLED |
| **Néo** | Bleu-noir `#080E1C` + cyan `#00D4FF` — thème signature |

### Exporter mes données

Bouton dans **CFG → Données**. Génère un fichier JSON complet contenant :
- Toutes les séances avec exercices, séries, RPE, RIR, tempo
- Toutes les mesures corporelles
- Toutes les évaluations de forme

Le fichier est partagé via le menu natif iOS/Android (AirDrop, email, cloud, clipboard…).

---

## Concepts clés

### MEV / MAV / MRV

Seuils de volume hebdomadaire par groupe musculaire issus de la littérature scientifique :

| Seuil | Définition |
|-------|-----------|
| **MEV** — Minimum Effective Volume | En-dessous : pas assez de stimulus pour progresser |
| **MAV** — Maximum Adaptive Volume | Zone optimale : progression maximale |
| **MRV** — Maximum Recoverable Volume | Au-dessus : récupération insuffisante, régression possible |

Les barres de volume dans LOG sont colorées selon ces seuils. Les repères MEV et MAV sont marqués d'un trait sur chaque barre.

### Intentions d'exercice

| Intention | Profil type | Repos par défaut |
|-----------|-------------|-----------------|
| **Puissance** | 1-3 reps, charges max | 4 min |
| **Force** | 3-6 reps, haute intensité | 3 min |
| **Hypertrophie** | 6-20 reps, tension mécanique | 1 min 30 |
| **Endurance** | 20+ reps, courts repos | 1 min |
| **Métabolique** | Brûlure, techniques avancées | 45 sec |

### Types de séries

- **Chauffe** — montée en charge, non comptée dans tonnage/e1RM
- **Travail** — série principale
- **Drop** — enchaîne en réduisant le poids immédiatement
- **R+P** — courte pause intra-série (5-15 sec) puis continuation
- **Myoreps** — activation + mini-séries courtes avec repos minimaux

### RPE et RIR

**RPE (Rate of Perceived Exertion)** : effort de 0 à 10. RPE 8 = 2 reps en réserve.
**RIR (Reps In Reserve)** : reps restantes. RIR 2 = RPE 8.

> Utiliser RPE/RIR permet de réguler l'intensité selon la forme du jour, sans être esclave d'un % de RM fixe.

### Notation de tempo

Format : **Excentrique - Pause bas - Concentrique - Pause haut** (secondes). `X` = explosif.

| Exemple | Lecture |
|---------|---------|
| `3-1-X-0` | 3s descente, 1s pause bas, explosif, 0s haut |
| `4-2-1-0` | 4s descente, 2s pause, 1s montée |

### e1RM estimé

**e1RM = poids × (1 + reps ÷ 30)** (formule d'Epley)

Ex : 80 kg × 10 reps = **106.7 kg** e1RM — indicateur de force indépendant du protocole du jour.

### Ghost (données du dernier passage)

Flèches **↑** bleues sous les champs poids et reps = valeurs de ta dernière séance sur cet exercice. Référence pour progresser ou conserver.

### Types de blocs

| Bloc | Objectif |
|------|----------|
| **Accumulation** | Construire le volume progressivement |
| **Hypertrophie** | Volume élevé, intensité modérée |
| **Transmutation** | Convertir le volume en force |
| **Réalisation** | Pic de force (taper) |
| **Deload** | Récupération active (−40% volume) |
| **Puissance** | Force-vitesse, explosivité |

---

*MyPerf — tout reste sur ton téléphone, rien dans le cloud.*
