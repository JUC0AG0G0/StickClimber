# 🧗 StickClimber

**StickClimber** est un jeu d'escalade expérimental en WebGL : tu pilotes un stickman à la manette, un bras par stick, et tu t'accroches aux prises d'un mur infini avec les gâchettes. Plus tu montes haut, plus ton score augmente.

👉 **[Jouer à la dernière version (branche `dev`)](http://stickclimber.julescorneille.fr/)**

> ⚠️ Une **manette est nécessaire** pour jouer (il n'y a pas encore de contrôle clavier/souris). La souris sert uniquement à naviguer dans le menu.

---

## 🎮 Principe de jeu

- **Stick gauche / droit** : orientent le bras gauche / droit.
- **L2 / R2** : agrippent une prise à portée de la main correspondante (relâcher = lâcher prise).
- Le corps pivote autour de la main accrochée ; sans main accrochée, le stickman tombe. Avec les deux mains accrochées, il reste bloqué : il faut en lâcher une pour progresser.
- **Score** = hauteur maximale atteinte (× 3).
- **Options** (manette) ou bouton *Menu* : retour au menu à tout moment ; le score est alors enregistré.
- Le mur est **généré procéduralement et sans fin** : des sections de prises tirées « en sac » (comme dans Tetris), créées au-dessus du joueur et nettoyées en dessous.

## ✨ Fonctionnalités

- Menu **entièrement dans la scène 3D** (boutons et panneaux cliquables par raycasting), navigable à la souris ou à la manette
- Direction artistique « encre » : décor blanc, traits noirs, prises qui se remplissent d'encre quand elles sont tenues
- Cinématique de lancement : le personnage marche jusqu'au mur et s'échauffe
- Caméra orbitale entre les zones du menu et caméra de suivi en jeu
- **Manette PS5 DualSense** : gâchettes adaptatives, vibration et LED via WebHID (USB uniquement, Chrome/Edge)
- Vibration à l'accroche d'une prise et à l'atterrissage
- Classement local (top 10, `localStorage`)
- Panneau de réglages avec visualisation en temps réel des sticks et gâchettes
- Mentions légales intégrées (texte défilant, liens cliquables)

## 🚀 Lancer le projet en local

Le projet est 100 % côté client, sans backend ni étape de build : il suffit d'un serveur statique.

```bash
git clone https://github.com/JUC0AG0G0/StickClimber.git
cd StickClimber
git checkout dev   # le code du jeu est sur dev
```

Puis servir le dossier, par exemple avec l'extension **Live Server** de VS Code (`http://127.0.0.1:5500`) ou :

```bash
python3 -m http.server 5500
```

> Les modules ES et WebHID exigent `http://localhost` ou `https`. Ouvrir `index.html` directement via `file://` ne fonctionne pas.

## 🗂️ Structure

```
index.html          page unique (canvas + HUD)
css/style.css       styles du HUD
js/
  main.js           point d'entrée, boucle de rendu unique
  core/             scène, style « encre », rig de caméra
  menu/             hub 3D : boutons, panneaux, navigation
  game/             stickman, joueur, mur procédural, état de partie
  input/            manette (Gamepad API), DualSense (WebHID), retour haptique
  ui/               contenu des panneaux : classement, réglages, compte, légal
test.html, test.js  essais manuels des gâchettes adaptatives
```

## 🛠️ Stack technique

- **[Three.js](https://threejs.org)** 0.155 (rendu 3D), chargé via CDN unpkg
- **Gamepad API** (contrôles) et **WebHID** (fonctions avancées DualSense)
- **HTML / CSS / JavaScript** (modules ES), sans framework
- La physique (ancrage, pivot, gravité) est codée à la main ; Cannon-es n'est plus utilisé.

## 🌿 Branches

- `main` : version stable, mise à jour uniquement lors des sorties officielles
- `dev` : développement actif (c'est la version en ligne)
- `<fonctionnalité>` : branches temporaires, fusionnées puis supprimées

## 🗺️ Feuille de route

- [x] Personnage stickman articulé et contrôle bras par bras
- [x] Ancrage aux prises, pivot du corps, gravité
- [x] Mur infini généré procéduralement
- [x] Score selon la hauteur et classement local
- [x] Menu principal 3D, animation de caméra et cinématique de lancement
- [x] Gâchettes adaptatives et vibration (DualSense)
- [ ] Contrôles clavier / souris
- [ ] Gravité indépendante du taux de rafraîchissement (`dt`)
- [ ] Classement et comptes en ligne (l'authentification actuelle est une maquette)
- [ ] Design sonore
- [ ] Publication finale sur `main`

## 📄 Licence

Aucune licence n'est définie pour l'instant : tous droits réservés par défaut.
