// core/cameraRig.js
// Pilote unique de la caméra. Trois modes :
//  - 'fixed'      : posée devant une zone, avec une micro-dérive lente
//                   (la caméra "respire", la scène reste vivante)
//  - 'transition' : ORBITE d'une zone à l'autre. Au lieu d'une ligne droite,
//                   la position est interpolée en direction+rayon autour du
//                   point regardé -> la caméra PIVOTE autour du décor.
//  - 'follow'     : suit le joueur pendant la partie (amorti exponentiel)
//
// Une "pose" = { pos: [x, y, z], look: [x, y, z] }.

import * as THREE from 'https://unpkg.com/three@0.155.0/build/three.module.js';

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// Cadrage du mode "follow" (partie en cours) : caméra reculée et surélevée,
// regard porté AU-DESSUS du joueur -> l'avatar occupe le tiers bas de l'écran
// et on voit le haut du mur (les prochaines prises) arriver.
const FOLLOW_BACK = 7.4;     // recul de la caméra (z)
const FOLLOW_UP = 3.4;       // hauteur de la caméra au-dessus du joueur
const FOLLOW_LOOK_UP = 1.25; // le regard vise ce décalage au-dessus du joueur

export class CameraRig {
    constructor(camera) {
        this.camera = camera;
        this.look = new THREE.Vector3();
        this.mode = 'fixed';

        this._time = 0;
        this._basePos = new THREE.Vector3();
        this._baseLook = new THREE.Vector3();

        this._from = { pos: new THREE.Vector3(), look: new THREE.Vector3() };
        this._to = { pos: new THREE.Vector3(), look: new THREE.Vector3() };
        this._t = 0;
        this._duration = 1;
        this._onArrive = null;

        this._followTarget = null;
        this._desired = new THREE.Vector3();
        this._followLook = new THREE.Vector3();

        // Tampons de calcul (pas d'allocation par frame)
        this._dir0 = new THREE.Vector3();
        this._dir1 = new THREE.Vector3();
        this._dir = new THREE.Vector3();
        this._lookK = new THREE.Vector3();
    }

    /** Téléportation immédiate (au chargement). */
    snapTo(pose) {
        this.mode = 'fixed';
        this._basePos.set(...pose.pos);
        this._baseLook.set(...pose.look);
        this.camera.position.copy(this._basePos);
        this.look.copy(this._baseLook);
        this.camera.lookAt(this.look);
    }

    /** Orbite vers une pose ; onArrive est appelé une fois arrivé. */
    goTo(pose, duration = 1.1, onArrive = null) {
        this._from.pos.copy(this.camera.position);
        this._from.look.copy(this.look);
        this._to.pos.set(...pose.pos);
        this._to.look.set(...pose.look);
        this._t = 0;
        this._duration = duration;
        this._onArrive = onArrive;
        this.mode = 'transition';
    }

    /** Suivi du joueur. `target` doit être une référence vivante
     *  (ex: player.group.position), relue à chaque frame. */
    follow(target) {
        this._followTarget = target;
        this.mode = 'follow';
    }

    update(dt) {
        this._time += dt;

        if (this.mode === 'transition') {
            this._t = Math.min(this._t + dt / this._duration, 1);
            const k = easeInOutCubic(this._t);

            // Point regardé : interpolation directe.
            this._lookK.lerpVectors(this._from.look, this._to.look, k);

            // Position : interpolation en DIRECTION + RAYON autour du point
            // regardé (nlerp) -> trajectoire courbe, la caméra orbite.
            this._dir0.subVectors(this._from.pos, this._from.look);
            const r0 = this._dir0.length();
            this._dir0.normalize();
            this._dir1.subVectors(this._to.pos, this._to.look);
            const r1 = this._dir1.length();
            this._dir1.normalize();
            this._dir.lerpVectors(this._dir0, this._dir1, k);
            // Garde : si les deux directions sont opposées, le lerp peut
            // passer par un vecteur quasi nul -> on retombe sur la cible.
            if (this._dir.lengthSq() < 1e-6) this._dir.copy(this._dir1);
            this._dir.normalize();

            this.camera.position.copy(this._lookK).addScaledVector(this._dir, r0 + (r1 - r0) * k);
            this.look.copy(this._lookK);
            this.camera.lookAt(this.look);

            if (this._t >= 1) {
                this.mode = 'fixed';
                this._basePos.copy(this._to.pos);
                this._baseLook.copy(this._to.look);
                const cb = this._onArrive;
                this._onArrive = null;
                cb?.();
            }
        } else if (this.mode === 'fixed') {
            // Micro-dérive : la caméra flotte très légèrement autour de sa pose.
            const t = this._time;
            this.camera.position.set(
                this._basePos.x + Math.sin(t * 0.42) * 0.07,
                this._basePos.y + Math.sin(t * 0.31 + 2.0) * 0.045,
                this._basePos.z + Math.sin(t * 0.23 + 4.0) * 0.05
            );
            this.look.copy(this._baseLook);
            this.camera.lookAt(this.look);
        } else if (this.mode === 'follow' && this._followTarget) {
            const t = this._followTarget;
            this._desired.set(t.x, t.y + FOLLOW_UP, FOLLOW_BACK);
            this._followLook.set(t.x, t.y + FOLLOW_LOOK_UP, t.z);
            const k = 1 - Math.pow(0.0005, dt); // amorti indépendant du framerate
            this.camera.position.lerp(this._desired, k);
            this.look.lerp(this._followLook, k);
            this.camera.lookAt(this.look);
        }
    }
}