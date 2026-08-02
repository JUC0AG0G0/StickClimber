// game/player.js
// Logique du joueur : bras qui suivent les sticks, ancrage aux prises,
// pivot du corps autour de la main ancrée, gravité.
// L'apparence est construite dans stickman.js.

import * as THREE from 'https://unpkg.com/three@0.155.0/build/three.module.js';
import { triggerGamepadFeedback } from '../input/feedback.js';
import { createStickman, LEFT_SHOULDER, RIGHT_SHOULDER, ARM_LENGTH } from './stickman.js';
import { INK, PAPER } from '../core/ink.js';
import { GROUND_Y } from '../core/scene.js';

const GRAVITY = 0.0981;
const RELAX_SPEED = 0.05;   // vitesse de retour du bras au repos

function approachAngle(current, target, speed) {
    let diff = target - current;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    return current + diff * speed;
}

function armAngle(stick, currentAngle, gripping) {
    if (stick.x !== 0 || stick.y !== 0) return Math.atan2(stick.x, stick.y);
    const target = gripping ? Math.PI : 0;
    return approachAngle(currentAngle, target, RELAX_SPEED);
}

// Position de la main RELATIVE à l'origine du groupe, pour un bras à un angle donné.
function handLocalOffset(shoulder, angle) {
    return new THREE.Vector3(
        shoulder.x + ARM_LENGTH * Math.sin(angle),
        shoulder.y - ARM_LENGTH * Math.cos(angle),
        0
    );
}

export class Player {
    constructor(scene) {
        const rig = createStickman();
        this.group = rig.group;
        this.head = rig.head;
        this.leftArm = rig.leftArm;
        this.rightArm = rig.rightArm;
        this.leftHand = rig.leftHand;
        this.rightHand = rig.rightHand;
        this.leftLeg = rig.leftLeg;
        this.rightLeg = rig.rightLeg;

        // --- État d'ancrage ---
        this.leftAnchored = false;
        this.rightAnchored = false;
        this.leftAnchorPos = new THREE.Vector3();   // position MONDE fixe de la main
        this.rightAnchorPos = new THREE.Vector3();

        // Prise (wall.js) actuellement tenue par chaque main.
        this.leftHold = null;
        this.rightHold = null;

        this.group.position.y = GROUND_Y;
        this.wasOnGround = true;

        scene.add(this.group);
    }

    /** Remet le joueur debout, face au mur, bras au repos, mains libres.
     *  (Le hub de menu le repositionnera ensuite s'il le faut.) */
    resetPose(wall) {
        wall?.release(this.leftHold);
        wall?.release(this.rightHold);
        this.leftHold = null;
        this.rightHold = null;
        this.leftAnchored = false;
        this.rightAnchored = false;
        this.leftArm.rotation.set(0, 0, 0);
        this.rightArm.rotation.set(0, 0, 0);
        this.leftLeg.rotation.x = 0;   // la marche de l'intro anime rotation.x
        this.rightLeg.rotation.x = 0;  // (l'écart des jambes en .z est conservé)
        this.leftHand.material.color.set(PAPER);
        this.rightHand.material.color.set(PAPER);
        this.group.position.set(0, GROUND_Y, 0);
        this.group.rotation.set(0, 0, 0);
        this.head.position.y = 2.6;
        this.head.rotation.set(0, 0, 0);
        this.wasOnGround = true;
    }

    // Position monde actuelle de la main pour un bras/angle donné.
    handWorldPos(shoulder, angle) {
        return this.group.position.clone().add(handLocalOffset(shoulder, angle));
    }

    update(input, wall) {
        if (!input) return;

        const leftAngle = armAngle(input.leftStick, this.leftArm.rotation.z, input.L2);
        const rightAngle = armAngle(input.rightStick, this.rightArm.rotation.z, input.R2);

        // --- Tentative d'agrippement : on ne s'ancre QUE si une prise est
        // réellement à portée ; on retente chaque frame tant que la gâchette
        // reste pressée (permet de "rattraper" une prise au balancé).
        if (input.L2 && !this.leftAnchored) {
            const handPos = this.handWorldPos(LEFT_SHOULDER, leftAngle);
            const hold = wall?.findGrabbableHold(handPos);
            if (hold) {
                this.leftArm.rotation.z = leftAngle;
                this.leftAnchorPos.set(hold.x, hold.y, hold.z);
                this.leftHold = hold;
                this.leftAnchored = true;
                wall.grab(hold, 'left');
            }
        }
        if (input.R2 && !this.rightAnchored) {
            const handPos = this.handWorldPos(RIGHT_SHOULDER, rightAngle);
            const hold = wall?.findGrabbableHold(handPos);
            if (hold) {
                this.rightArm.rotation.z = rightAngle;
                this.rightAnchorPos.set(hold.x, hold.y, hold.z);
                this.rightHold = hold;
                this.rightAnchored = true;
                wall.grab(hold, 'right');
            }
        }

        // --- Relâchement ---
        if (!input.L2 && this.leftAnchored) {
            wall?.release(this.leftHold);
            this.leftHold = null;
            this.leftAnchored = false;
        }
        if (!input.R2 && this.rightAnchored) {
            wall?.release(this.rightHold);
            this.rightHold = null;
            this.rightAnchored = false;
        }

        // Retour visuel : la main ancrée se "remplit" d'encre.
        this.leftHand.material.color.set(this.leftAnchored ? INK : PAPER);
        this.rightHand.material.color.set(this.rightAnchored ? INK : PAPER);

        // Deux mains ancrées => personnage totalement bloqué.
        if (this.leftAnchored && this.rightAnchored) return;

        this.leftArm.rotation.z = leftAngle;
        this.rightArm.rotation.z = rightAngle;

        if (this.leftAnchored) {
            // Le corps pivote autour de la main gauche fixe dans le monde.
            this.group.position.copy(this.leftAnchorPos).sub(handLocalOffset(LEFT_SHOULDER, leftAngle));
        } else if (this.rightAnchored) {
            this.group.position.copy(this.rightAnchorPos).sub(handLocalOffset(RIGHT_SHOULDER, rightAngle));
        } else {
            // Aucune main accrochée => chute.
            this.group.position.y -= GRAVITY;
        }

        if (this.group.position.y < GROUND_Y) this.group.position.y = GROUND_Y;

        const onGround = this.group.position.y <= GROUND_Y;
        if (onGround && !this.wasOnGround) triggerGamepadFeedback();
        this.wasOnGround = onGround;
    }
}
