// main.js
// Point d'entrée : assemble scène, caméra, hub de menu 3D, jeu et navigation,
// puis fait tourner UNE SEULE boucle de rendu (menu ET jeu).
//
// Architecture :
//   core/   scène blanche, style "encre" (ink.js), rig de caméra (orbites)
//   menu/   hub 3D natif : décor = menu (boutons/panneaux cliquables)
//   game/   stickman, joueur, mur, état de partie
//   input/  manette (gamepad, DualSense WebHID, haptique)
//   ui/     contenus des panneaux (classement, paramètres, compte)

import { createScene } from './core/scene.js';
import { CameraRig } from './core/cameraRig.js';
import { buildMenuHub } from './menu/menuHub.js';
import { initMenuNav, returnToMenu, getCurrentSection } from './menu/menuNav.js';
import { Game } from './game/game.js';
import { initControlsPanel } from './ui/controlsPanel.js';
import { initAccountPanel } from './ui/accountPanel.js';

// ---------- Mise en place ----------
const canvas = document.getElementById('game-canvas');
const { scene, camera, renderer } = createScene(canvas);

const rig = new CameraRig(camera);

// Le joueur + le mur sont créés une fois et restent dans la scène :
// le stickman qui attend dans le diorama EST le personnage du jeu.
const game = new Game({ scene, rig });

const hub = buildMenuHub(scene, game.player);
rig.snapTo(hub.poses.home);

game.onQuit = () => {
    hub.setPlayerMenuMode(true); // repositionne le perso en pose d'attente
    returnToMenu();
};

initControlsPanel({
    panel: hub.panels.settings,
    buttons: hub.settingsButtons,
    isActive: () => getCurrentSection() === 'settings',
});
initAccountPanel({
    panel: hub.panels.account,
    buttons: hub.accountButtons,
});
initMenuNav({
    rig,
    hub,
    camera,
    canvas,
    onPlay: () => {
        hub.setPlayerMenuMode(false);
        game.start(); // cinématique : il marche jusqu'au mur, puis grimpe
    },
    onQuitRequest: () => game.quit(), // bouton "Menu" du HUD
});

// ---------- Boucle unique ----------
let last = performance.now();

function tick(now) {
    const dt = Math.min((now - last) / 1000, 0.05); // clamp si l'onglet a dormi
    last = now;

    rig.update(dt);
    if (game.running) game.update(dt); // intro (marche/échauffement) puis gameplay
    else hub.update(now / 1000);       // idle du perso + vie du diorama

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
