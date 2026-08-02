// game/game.js
// État d'une partie. Le joueur et le mur vivent en PERMANENCE dans la scène
// (le stickman du diorama EST le personnage du jeu).
//
// Appuyer sur JOUER lance une petite CINÉMATIQUE avant le gameplay :
//   'walk' : le personnage quitte sa pose d'attente et MARCHE jusqu'au pied
//            du mur (cycle de marche : jambes/bras balancés, petit rebond),
//            pendant que la caméra plonge derrière lui (rig en mode follow).
//   'prep' : arrivé au mur, il pivote pour se mettre en position puis
//            s'échauffe (secoue les bras) — et c'est parti.
//   'play' : gameplay normal.

import { getGamepadInput } from '../input/input.js';
import { triggerGamepadFeedback } from '../input/feedback.js';
import { Player } from './player.js';
import { ClimbingWall } from './wall.js';
import { saveScore } from '../ui/leaderboard.js';
import { syncTriggerEffect } from '../ui/controlsPanel.js';
import { GROUND_Y } from '../core/scene.js';

const WALK_SPEED = 1.7;        // unités monde / seconde
const WALK_CYCLE = 9;          // fréquence du cycle de marche
const TURN_DURATION = 0.35;    // s : pivot face au mur
const PREP_DURATION = 1.1;     // s : pivot + échauffement, avant le gameplay

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

function lerpAngle(a, b, t) {
    let d = b - a;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    return a + d * t;
}

export class Game {
    constructor({ scene, rig }) {
        this.rig = rig;
        this.player = new Player(scene);
        this.wall = new ClimbingWall(scene);
        this.wall.update(0); // premières sections visibles dès le menu

        this.running = false;
        this.phase = 'idle';   // 'idle' | 'walk' | 'prep' | 'play'
        this.onQuit = null;    // branché par main.js (retour au menu)

        this.score = 0;
        this.maxHeight = 0;
        this.lastL2 = false;
        this.lastR2 = false;

        this._animT = 0;   // horloge du cycle de marche
        this._prepT = 0;   // horloge de la phase de préparation
        this._walkYaw = 0; // orientation pendant la marche
    }

    /** JOUER : démarre la cinématique. Le personnage part de SA POSITION
     *  ACTUELLE (pose d'attente du menu) et marche vers le pied du mur. */
    start() {
        this.wall.reset();
        this.wall.update(0);
        this.score = 0;
        this.maxHeight = 0;
        this.lastL2 = false;
        this.lastR2 = false;
        this._displayScore();

        // Neutralise les restes de l'animation d'attente SANS téléporter.
        const p = this.player;
        p.head.position.y = 2.6;
        p.head.rotation.set(0, 0, 0);
        p.group.rotation.z = 0;
        p.leftArm.rotation.z = 0;
        p.rightArm.rotation.z = 0;

        // Oriente le personnage vers sa destination (il tourne le dos à la caméra).
        this._walkYaw = Math.atan2(0 - p.group.position.x, 0 - p.group.position.z);
        p.group.rotation.y = this._walkYaw;

        this.phase = 'walk';
        this._animT = 0;
        this._prepT = 0;
        this.running = true;
        this.rig.follow(p.group.position); // la caméra plonge derrière lui
    }

    quit() {
        if (!this.running) return;
        this.running = false;
        this.phase = 'idle';
        saveScore(this.score);
        this.player.resetPose(this.wall);
        this.wall.reset(); // sinon les prises de la tentative resteraient
        this.wall.update(0);
        this._displayScore();
        this.onQuit?.();
    }

    /** Une frame (appelée par la boucle unique de main.js). */
    update(dt) {
        // Options (bouton 9) => retour menu, à tout moment (même pendant l'intro).
        const pad = [...(navigator.getGamepads?.() || [])].find((p) => p);
        if (pad && pad.buttons[9]?.pressed) {
            this.quit();
            return;
        }

        if (this.phase === 'walk') this._updateWalk(dt);
        else if (this.phase === 'prep') this._updatePrep(dt);
        else this._updatePlay();
    }

    // ---------------- Phase 1 : marche vers le mur ----------------
    _updateWalk(dt) {
        const pl = this.player;
        const pos = pl.group.position;
        const dx = 0 - pos.x;
        const dz = 0 - pos.z;
        const dist = Math.hypot(dx, dz);
        const step = WALK_SPEED * dt;

        this._animT += dt;
        const swing = Math.sin(this._animT * WALK_CYCLE);
        pl.leftLeg.rotation.x = swing * 0.55;
        pl.rightLeg.rotation.x = -swing * 0.55;
        pl.leftArm.rotation.x = -swing * 0.32;
        pl.rightArm.rotation.x = swing * 0.32;
        pos.y = GROUND_Y + Math.abs(swing) * 0.03; // petit rebond de pas

        if (dist <= step) {
            pos.set(0, GROUND_Y, 0);
            this.phase = 'prep';
            this._prepT = 0;
            return;
        }
        pos.x += (dx / dist) * step;
        pos.z += (dz / dist) * step;
    }

    // ---------------- Phase 2 : face au mur + échauffement ----------------
    _updatePrep(dt) {
        this._prepT += dt;
        const pl = this.player;

        // Pivot vers la position de jeu (rotation.y = 0).
        const k = Math.min(this._prepT / TURN_DURATION, 1);
        pl.group.rotation.y = lerpAngle(this._walkYaw, 0, easeOutCubic(k));

        // Les jambes/bras de la marche se posent en douceur.
        pl.leftLeg.rotation.x *= 0.82;
        pl.rightLeg.rotation.x *= 0.82;
        pl.leftArm.rotation.x *= 0.82;
        pl.rightArm.rotation.x *= 0.82;

        // Échauffement : il secoue les bras avant de grimper.
        if (this._prepT > TURN_DURATION) {
            const wiggle = Math.sin(this._prepT * 16);
            pl.leftArm.rotation.z = -0.35 + wiggle * 0.14;
            pl.rightArm.rotation.z = 0.35 - wiggle * 0.14;
        }

        if (this._prepT >= PREP_DURATION) {
            pl.leftLeg.rotation.x = 0;
            pl.rightLeg.rotation.x = 0;
            pl.leftArm.rotation.x = 0;
            pl.rightArm.rotation.x = 0;
            pl.leftArm.rotation.z = 0;
            pl.rightArm.rotation.z = 0;
            pl.group.rotation.y = 0;
            syncTriggerEffect(); // applique l'état des gâchettes des Paramètres
            this.phase = 'play';
        }
    }

    // ---------------- Phase 3 : gameplay ----------------
    _updatePlay() {
        const input = getGamepadInput();
        this.wall.update(this.player.group.position.y);
        this.player.update(input, this.wall);
        this._grabFeedback(input);
        this._updateScore();
    }

    // Petite vibration quand une main s'accroche.
    _grabFeedback(input) {
        if (!input) return;
        if (input.L2 && !this.lastL2) triggerGamepadFeedback();
        if (input.R2 && !this.lastR2) triggerGamepadFeedback();
        this.lastL2 = input.L2;
        this.lastR2 = input.R2;
    }

    _updateScore() {
        const h = this.player.group.position.y;
        if (h > this.maxHeight) {
            this.maxHeight = h;
            this.score = Math.floor(this.maxHeight * 3);
        }
        this._displayScore();
    }

    _displayScore() {
        const el = document.getElementById('score-display');
        if (el) el.textContent = `Score : ${this.score}`;
    }
}
