# 🧗 StickClimber

**StickClimber** est un jeu d'escalade expérimental en WebGL : tu pilotes un stickman à la manette, un bras par stick, et tu t'accroches aux prises d'un mur infini avec les gâchettes. Plus tu montes haut, plus ton score augmente.

👉 **[Jouer en ligne](http://stickclimber.julescorneille.fr/)**

> ⚠️ Pour l'instant, une **manette est nécessaire** pour jouer. La souris sert uniquement à naviguer dans le menu. Le jeu tactile sur mobile est prévu (voir la feuille de route).

## 🎯 Objectifs

- Un jeu d'escalade **physique, lisible et jouable en sessions courtes**, dont le cœur est le plaisir de grimper un bras après l'autre.
- Une **identité visuelle « encre »** cohérente, du menu au mur, avec une interface soignée.
- Un jeu **jouable dans le navigateur, sans installation**, à la **manette** (toute manette à deux joysticks, filaire ou Bluetooth) et sur **mobile**. Pas de contrôle clavier/souris.
- Un jeu **100 % local** : aucun compte, aucun serveur, les scores restent sur l'appareil.

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

## 🌿 Branche

Le projet n'utilise qu'une seule branche : `main`.

## 🗺️ Feuille de route

**✅ v0.1 : Prototype jouable (fait)**
- [x] Stickman articulé et contrôle bras par bras
- [x] Ancrage aux prises, pivot du corps, gravité
- [x] Mur infini généré procéduralement
- [x] Score selon la hauteur et classement local
- [x] Menu 3D, caméra orbitale, cinématique de lancement
- [x] DualSense : gâchettes adaptatives et vibration

**🔧 v0.2 : Manettes et solidité (prochaine étape)**
- [ ] Prise en charge de **toutes les manettes à deux joysticks**, en filaire comme en Bluetooth (Xbox, PlayStation, Switch, génériques) via la Gamepad API
- [ ] Cartographie des boutons et des axes selon le modèle de manette, avec zones mortes réglables
- [ ] Gravité indépendante du taux de rafraîchissement (`dt`)
- [ ] Verrouiller Three.js (import map ou copie locale)

**🎨 v0.3 : Interface (UI)**
- [ ] Refonte de l'interface : menu, HUD, panneaux, cohérents avec le style « encre »
- [ ] Écran de fin de partie : score, meilleur score, relance rapide
- [ ] Meilleure lisibilité des indications de contrôle selon la manette détectée
- [ ] Transitions et retours visuels plus soignés

**🧗 v0.4 : Animation de chute**
- [ ] Animation dédiée de chute : le stickman se débat puis tombe, au lieu de simplement descendre
- [ ] Réception au sol animée, avec retour de vibration
- [ ] Transition fluide entre la chute, l'écran de fin de partie et la relance

**📱 v0.5 : Mobile**
- [ ] Contrôles tactiles adaptés au jeu (un contrôle par bras et un par prise)
- [ ] Interface et rendu adaptés aux petits écrans et à l'orientation
- [ ] Optimisation des performances sur mobile
- [ ] Prise en charge d'une manette Bluetooth connectée au mobile

**⚖️ v0.6 : Légal et conformité**
- [ ] Compléter les mentions légales : l'hébergeur est encore un texte provisoire (« [OVH, adresse de l'hébergeur] ») dans `legalPanel.js`
- [ ] Ajouter une licence au dépôt (MIT par exemple) et la mentionner dans le jeu
- [ ] Rédiger une politique de confidentialité (aucune donnée collectée, scores en `localStorage` sur l'appareil)
- [ ] Informer clairement sur le stockage local et sur l'accès à la manette (WebHID)
- [ ] Ajouter les crédits et licences des dépendances (Three.js, polices, sons)
- [ ] Vérifier la conformité si des sons, images ou polices de tiers sont utilisés
- [ ] Revoir ces points si le jeu devient un jour connecté (comptes, classement en ligne)

**🚀 v1.0 : Sortie officielle**
- [ ] Design sonore (accroche, chute, ambiance)
- [ ] Page de présentation avec captures et vidéo

**💡 Idées pour plus tard**
- Prises spéciales (glissantes, fragiles, de repos)
- Fatigue des bras
- Difficulté progressive avec la hauteur

## 📄 Licence

Aucune licence n'est définie pour l'instant : tous droits réservés par défaut (voir la v0.6 de la feuille de route).
