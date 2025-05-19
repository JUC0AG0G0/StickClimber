# 🎮 StickClimber – Prototype en cours de développement

**StickClimber** est un jeu expérimental en WebGL utilisant **Three.js**, **Cannon-es**, et la **Gamepad API**.  
L'objectif est de grimper avec un personnage de type stickman dans un environnement simple et réactif, avec un gameplay basé sur la physique et les contrôles manette.


## 🚀 Démarrage rapide

Pour exécuter le jeu en local :

1. **Cloner le dépôt** :
   ```bash
   git clone https://github.com/JUC0AG0G0/StickClimber.git
   cd stickclimber
   ```
   
## 🚀 Lancer un serveur local

Le projet ne nécessite **aucun backend**, juste un **serveur statique**.

Le plus simple est d'utiliser **Live Server** dans Visual Studio Code.

Une fois lancé, accédez à l'URL affichée (généralement `http://127.0.0.1:5500`).

---

## 🌐 Lien vers la dernière version (développement)

👉 [Dernière version en ligne (branche `dev`)](http://stickclimber.julescorneille.fr/)

> ⚠️ La branche `dev` contient les dernières fonctionnalités en cours.  
> La branche `main` ne sera mise à jour que lors de la sortie officielle.

---

## 📌 Étapes de développement

Voici les grandes étapes du développement du projet :

### ✅ Étapes déjà implémentées

- [x] Structure HTML, CSS et fichiers JS
- [x] Intégration de Three.js & Cannon-es via CDN
- [x] Système de détection de manette
- [x] Affichage et lecture des inputs (sticks + gâchettes)
- [x] Architecture modulaire avec séparation logique des fichiers

### 🔜 Prochaine étape

- 🔧 **Création du personnage stickman**
  - Représentation basique en Three.js
  - Corps segmenté avec articulation physique via Cannon-es

---

## 🛠️ Stack technique

- **Three.js** (3D rendering)
- **Cannon-es** (moteur physique)
- **Gamepad API** (contrôles à la manette)
- **HTML / CSS / JS** (100% client-side, sans backend)

---

## 📂 Organisation des branches

- `main` : branche stable pour les releases officielles
- `dev` : branche de développement active
- `/*` : branches spécifiques à des fonctionnalités (fusionnées ensuite sur `dev`)

---

## 📅 Roadmap à venir

- [ ] Ajout du personnage et de ses articulations physiques
- [ ] Création terrain infini
- [ ] Création physique
- [ ] Système de score en fonction de la hauteur atteinte
- [ ] Mise en place du menu principal
- [ ] Animation de caméra lors du lancement
- [ ] Interface UI : score, redémarrage
- [ ] Design visuel et sonore amélioré
- [ ] Publication finale sur `main`
