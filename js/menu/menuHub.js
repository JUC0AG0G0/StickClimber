// menu/menuHub.js
// LE MENU EST LE DÉCOR. Un diorama blanc vu en trois-quarts :
//  - le joueur, tourné vers la caméra, avec une animation d'attente
//  - un POTEAU INDICATEUR à panneaux fléchés = le menu principal (3D, cliquable)
//  - un tableau CLASSEMENT planté à gauche, un tableau PARAMÈTRES à droite
//  - un pupitre COMPTE (connexion, maquette) sur le côté
//  - une plaque MENTIONS LÉGALES inclinée au sol
//
// Chaque zone a sa pose caméra dans `poses` : le CameraRig ORBITE de l'une à
// l'autre (les azimuts sont volontairement différents pour que la caméra
// pivote vraiment autour de la scène).
//
// Ajouter une zone : un groupe de décor ici + une pose + une entrée dans
// `zones` (avec ses Button3D) ; menuNav s'occupe du reste.

import * as THREE from 'https://unpkg.com/three@0.155.0/build/three.module.js';
import { makeTextPlane } from './textPlane.js';
import { Button3D } from './button3d.js';
import { Panel3D } from './panel3d.js';
import { edgedMesh } from '../core/ink.js';
import { GROUND_Y } from '../core/scene.js';
import { drawLeaderboard } from '../ui/leaderboard.js';
import { initLegalPanel } from '../ui/legalPanel.js';

export function buildMenuHub(scene, player) {
    const group = new THREE.Group();
    scene.add(group);

    // ------------------- Poses caméra (une par zone) -------------------
    // Azimuts variés = la caméra pivote autour du diorama à chaque clic.
    const poses = {
        home:        { pos: [3.4, 2.0, 5.2],  look: [0.8, 1.7, 1.0] },
        leaderboard: { pos: [-1.8, 2.2, 5.8], look: [-4.4, 2.0, 1.8] },
        settings:    { pos: [2.5, 2.2, 6.2],  look: [5.4, 2.0, 2.8] },
        account:     { pos: [3.7, 1.9, 7.6],  look: [7.0, 1.7, 5.2] },
        legal:       { pos: [-1.4, 1.9, 7.5], look: [-3.6, 0.5, 5.4] },
    };

    // ------------------- Titre peint sur le mur -------------------
    const title = makeTextPlane('STICKCLIMBER', { width: 4.6 });
    title.position.set(0, 3.7, 0.02);
    group.add(title);

    // ------------------- Le poteau indicateur (menu principal) -------------------
    const signpost = new THREE.Group();
    signpost.position.set(2.3, 0, 1.9);
    signpost.rotation.y = 0.55; // orienté vers la caméra d'accueil
    group.add(signpost);

    const pole = edgedMesh(new THREE.BoxGeometry(0.09, 2.7, 0.09));
    pole.position.y = 1.35;
    signpost.add(pole);

    const playBtn = new Button3D('JOUER', { shape: 'arrowLeft', width: 1.25, height: 0.36, action: 'play' });
    const lbBtn = new Button3D('CLASSEMENT', { shape: 'arrowLeft', width: 1.6, height: 0.32, action: 'leaderboard' });
    const stBtn = new Button3D('PARAMÈTRES', { shape: 'arrowRight', width: 1.6, height: 0.32, action: 'settings' });
    const acBtn = new Button3D('COMPTE', { shape: 'arrowRight', width: 1.3, height: 0.32, action: 'account' });
    const lgBtn = new Button3D('Mentions légales', { shape: 'pill', width: 1.35, height: 0.24, action: 'legal' });

    const signs = [
        [playBtn, 2.42, -0.12],
        [lbBtn, 2.02, -0.16],
        [stBtn, 1.62, 0.16],
        [acBtn, 1.22, 0.12],
        [lgBtn, 0.78, 0.0],
    ];
    for (const [btn, y, x] of signs) {
        btn.mesh.position.set(x, y, 0.06);
        signpost.add(btn.mesh);
    }

    // ------------------- Fabrique de "tableaux" de zone -------------------
    function makeBoardZone({ x, z, rotY, titleText, panel, panelY = 2.02 }) {
        const zone = new THREE.Group();
        zone.position.set(x, 0, z);
        zone.rotation.y = rotY;
        group.add(zone);

        const post = edgedMesh(new THREE.BoxGeometry(0.09, panelY, 0.09));
        post.position.set(0, panelY / 2, -0.05);
        zone.add(post);

        panel.mesh.position.set(0, panelY, 0);
        zone.add(panel.mesh);

        const zoneTitle = makeTextPlane(titleText, { width: 2.1 });
        zoneTitle.position.set(0, panelY + panel.height / 2 + 0.32, 0.02);
        zone.add(zoneTitle);

        return zone;
    }

    // ------------------- Zone Classement (gauche) -------------------
    const lbPanel = new Panel3D({ width: 2.6, height: 2.0 });
    const lbZone = makeBoardZone({ x: -4.4, z: 1.8, rotY: 0.55, titleText: 'CLASSEMENT', panel: lbPanel });
    const lbBack = new Button3D('RETOUR', { shape: 'pill', width: 1.1, height: 0.3, action: 'back' });
    lbBack.mesh.position.set(0, 0.64, 0.08);
    lbZone.add(lbBack.mesh);

    // ------------------- Zone Paramètres (droite) -------------------
    const stPanel = new Panel3D({ width: 2.5, height: 1.5 });
    const stZone = makeBoardZone({ x: 5.4, z: 2.8, rotY: -0.7, titleText: 'PARAMÈTRES', panel: stPanel, panelY: 2.35 });
    const connectBtn = new Button3D('Connecter la DualSense', { shape: 'pill', width: 2.0, height: 0.3 });
    const triggersBtn = new Button3D('Gâchettes : Inactif', { shape: 'pill', width: 1.8, height: 0.28 });
    const vibrationBtn = new Button3D('Vibration : Actif', { shape: 'pill', width: 1.8, height: 0.28 });
    const stBack = new Button3D('RETOUR', { shape: 'pill', width: 1.1, height: 0.3, action: 'back' });
    connectBtn.mesh.position.set(0, 1.38, 0.08);
    triggersBtn.mesh.position.set(0, 1.02, 0.08);
    vibrationBtn.mesh.position.set(0, 0.68, 0.08);
    stBack.mesh.position.set(0, 0.32, 0.08);
    stZone.add(connectBtn.mesh, triggersBtn.mesh, vibrationBtn.mesh, stBack.mesh);

    // ------------------- Zone Compte (pupitre de connexion) -------------------
    const acPanel = new Panel3D({ width: 2.0, height: 1.5 });
    const acZone = makeBoardZone({ x: 7.0, z: 5.2, rotY: -0.95, titleText: 'COMPTE', panel: acPanel, panelY: 1.95 });
    const submitBtn = new Button3D('Se connecter', { shape: 'pill', width: 1.5, height: 0.3 });
    const acBack = new Button3D('RETOUR', { shape: 'pill', width: 1.1, height: 0.28, action: 'back' });
    submitBtn.mesh.position.set(0, 0.96, 0.08);
    acBack.mesh.position.set(0, 0.6, 0.08);
    acZone.add(submitBtn.mesh, acBack.mesh);

    // ------------------- Zone Mentions légales (plaque au sol) -------------------
    const legalZone = new THREE.Group();
    legalZone.position.set(-3.6, 0, 5.4);
    legalZone.rotation.y = 0.8;
    group.add(legalZone);

    const legalPanel = new Panel3D({ width: 2.0, height: 1.5 });
    legalPanel.mesh.rotation.x = -Math.PI / 3; // plaque inclinée, posée au sol
    legalPanel.mesh.position.set(0, 0.5, 0);
    legalZone.add(legalPanel.mesh);
    // Contenu scrollable + liens cliquables (voir ui/legalPanel.js)
    const legalCtl = initLegalPanel({ panel: legalPanel });

    const legalBack = new Button3D('RETOUR', { shape: 'pill', width: 1.0, height: 0.28, action: 'back' });
    legalBack.mesh.position.set(1.35, 0.4, 0.25);
    legalZone.add(legalBack.mesh);

    // ------------------- Pose "menu" du joueur + animation d'attente -------------------
    let playerMenuMode = false;

    function setPlayerMenuMode(on) {
        playerMenuMode = on;
        if (on) {
            // Trois-quarts face caméra, décalé du mur : il "attend" devant le poteau.
            player.group.position.set(0.85, GROUND_Y, 1.25);
            player.group.rotation.y = 0.6;
        }
        // En sortie de menu, resetPose() (game/player.js) remet tout à zéro.
    }
    setPlayerMenuMode(true);

    return {
        group,
        poses,
        // Boutons cliquables de chaque zone (dans l'ordre du focus manette).
        zones: {
            home: { buttons: [playBtn, lbBtn, stBtn, acBtn, lgBtn] },
            leaderboard: {
                buttons: [lbBack],
                onEnter: () => lbPanel.redraw(drawLeaderboard),
            },
            settings: { buttons: [connectBtn, triggersBtn, vibrationBtn, stBack] },
            account: { buttons: [submitBtn, acBack] },
            legal: {
                buttons: [legalBack],
                hotMeshes: [legalPanel.mesh],          // liens cliquables (UV)
                scroll: (dy) => legalCtl.scrollBy(dy), // molette / dpad
            },
        },
        panels: { leaderboard: lbPanel, settings: stPanel, account: acPanel, legal: legalPanel },
        settingsButtons: { connect: connectBtn, triggers: triggersBtn, vibration: vibrationBtn },
        accountButtons: { submit: submitBtn },
        setPlayerMenuMode,

        /** Animations idle du hub (t en secondes). */
        update(t) {
            if (!playerMenuMode) return;
            // Respiration + regard qui balaie la scène + léger transfert de poids.
            player.head.position.y = 2.6 + Math.sin(t * 1.7) * 0.02;
            player.head.rotation.y = Math.sin(t * 0.45) * 0.3;
            player.leftArm.rotation.z = -0.09 + Math.sin(t * 1.7 + 0.5) * 0.045;
            player.rightArm.rotation.z = 0.09 + Math.sin(t * 1.7 + 1.2) * 0.045;
            player.group.rotation.z = Math.sin(t * 0.8) * 0.014;
        },
    };
}