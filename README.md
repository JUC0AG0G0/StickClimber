# StickClimber

Jeu d'escalade à la manette (DualSense recommandée), en Three.js vanilla, sans build.
Direction artistique "encre sur papier" : tout est d'un BLANC PUR (#ffffff),
seuls les arêtes, contours et détails sont noirs (voir `js/core/ink.js`).
Les matériaux sont des `MeshBasicMaterial` (insensibles à la lumière : aucun
grisé de shading) ; le seul "gris" restant est le tapis d'ombres transparent
(`ShadowMaterial`, opacité 0.1) posé sur le sol blanc pour ancrer les objets.

## Lancer

```bash
npx serve .        # ou : python3 -m http.server 8000
```

## Le concept du menu : un diorama

Il n'y a AUCUN bouton HTML dans le menu : **le menu est le décor**, vu en
trois-quarts. Le personnage attend devant le mur avec une animation d'idle
(respiration, regard qui balaie, transfert de poids). Le menu principal est un
**poteau indicateur à panneaux fléchés** planté à côté de lui — les pancartes
sont des objets 3D cliquables (raycasting) qui s'inversent au survol / focus
manette. Autour : un tableau Classement à gauche, un tableau Paramètres à
droite (DualSense + visualisation temps réel des sticks dessinée sur le
panneau), un pupitre Compte (maquette de connexion) et une plaque Mentions
légales au sol — sa plaque est SCROLLABLE (molette, dpad, barre de
défilement dessinée) et contient des LIENS cliquables directement sur le
panneau 3D (raycast UV -> `ui/legalPanel.js`). Chaque clic fait **orbiter**
la caméra vers la zone
(`core/cameraRig.js` interpole direction + rayon autour du point regardé, avec
une micro-dérive permanente pour que la scène reste vivante). "Jouer"
déclenche une petite CINÉMATIQUE (`game/game.js`) : le personnage quitte sa
pose d'attente, MARCHE jusqu'au pied du mur (cycle jambes/bras + rebond,
caméra qui plonge derrière lui), pivote face au mur, secoue les bras pour
s'échauffer… et le gameplay démarre.

## Arborescence

```
index.html            Canvas + HUD de jeu (le menu n'a plus de HTML)
css/style.css         Uniquement le HUD et la ligne d'aide
js/
├── main.js           Point d'entrée : assemble tout, boucle de rendu unique
├── core/
│   ├── ink.js        Style "blanc + arêtes/contours noirs" (edgedMesh, outlinedMesh)
│   ├── scene.js      Scène blanche, lumières, sol, brouillard
│   └── cameraRig.js  Caméra : orbites avec easing, micro-dérive, suivi du joueur
├── menu/
│   ├── menuHub.js    LE menu : diorama, poteau fléché, zones, poses caméra, idle
│   ├── menuNav.js    Raycast souris + focus manette sur les boutons 3D
│   ├── button3d.js   Pancartes 3D cliquables (pill / flèche, inversion au survol)
│   ├── panel3d.js    Panneaux 3D à contenu canvas (classement, paramètres…)
│   └── textPlane.js  Texte "peint" en 3D (titre, intitulés de zones)
├── game/
│   ├── stickman.js   Construction du bonhomme papier découpé
│   ├── player.js     Logique du joueur (bras, ancrage, gravité)
│   ├── wall.js       Mur procédural infini (chunks + bag randomizer)
│   └── game.js       État d'une partie : start / update / quit, score
├── input/
│   ├── input.js      ← TON fichier existant, à copier tel quel
│   ├── dualsense.js  Gâchettes adaptatives / vibration PS5 (WebHID)
│   └── feedback.js   Haptique (respecte le toggle Vibration)
└── ui/
    ├── leaderboard.js   Stockage localStorage + dessin du panneau Classement
    ├── controlsPanel.js Paramètres : DualSense + visualisation live sur panneau
    ├── legalPanel.js    Mentions légales : contenu, scroll, liens cliquables
    ├── auth.js          Service d'auth FACTICE (interface prête pour un backend)
    └── accountPanel.js  Pupitre Compte (maquette de connexion via auth.js)
```

## Ajouter une zone au menu (tout se passe dans menu/)

1. Dans `menuHub.js` : construire le décor de la zone (groupe positionné avec
   son propre azimut), ajouter une pose caméra dans `poses`, et déclarer ses
   `Button3D` dans `zones` (l'ordre = l'ordre du focus manette).
2. Un bouton du poteau indicateur avec `action: 'maZone'`.
C'est tout : `menuNav.js` gère raycast, focus manette et orbites génériquement.

## Brancher la connexion plus tard

Toute l'UI du Compte passe par `ui/auth.js` (login/logout/onChange). Remplace
le corps de `auth.login` / `auth.logout` par tes appels réseau : le bouton et
le panneau se mettront à jour tout seuls via `onChange`. Pour la saisie réelle
du pseudo/mot de passe, le plus simple sera un petit formulaire HTML superposé
ouvert par `submitBtn.onClick` (ou une saisie au clavier dessinée sur le
panneau si tu veux rester 100 % 3D).

## Notes de style

- `edgedMesh` (arêtes noires) pour les géométries anguleuses, `outlinedMesh`
  (coque inversée) pour les sphères.
- "Remplir" un objet d'encre = passer la couleur de son matériau principal à
  `INK` (main ancrée, prise tenue).
- Le toggle **Vibration** est réellement appliqué par `input/feedback.js`.

## Éditer les mentions légales

Tout est dans `CONTENT` en tête de `ui/legalPanel.js` :
`{ h: '...' }` pour un titre, `{ t: '...' }` pour une ligne,
`{ link: '...', url: '...' }` pour un lien cliquable (souligné, curseur main,
surligné au survol). Le scroll et la barre de défilement s'adaptent tout seuls
à la longueur du contenu.
