import * as THREE from 'https://unpkg.com/three@0.155.0/build/three.module.js';
import { triggerGamepadFeedback } from './feedback.js';

// --- Constantes de géométrie / physique ---
const LEFT_SHOULDER = new THREE.Vector3(-0.4, 2.2, 0);
const RIGHT_SHOULDER = new THREE.Vector3(0.4, 2.2, 0);
const ARM_LENGTH = 0.9;   // distance épaule -> main
const GRAVITY = 0.0981;
const GROUND_Y = -0.28;
const RELAX_SPEED = 0.05;   // vitesse de retour du bras au repos (0 = figé, 1 = instantané)

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

// Position de la main RELATIVE à l'origine du groupe, pour un bras donné à un angle donné.
function handLocalOffset(shoulder, angle) {
    return new THREE.Vector3(
        shoulder.x + ARM_LENGTH * Math.sin(angle),
        shoulder.y - ARM_LENGTH * Math.cos(angle),
        0
    );
}

export class Player {
    constructor(scene) {
        this.group = new THREE.Group();

        const headGeometry = new THREE.SphereGeometry(0.27, 16, 16);
        const head = new THREE.Mesh(headGeometry, new THREE.MeshStandardMaterial({ color: "#fdd" }));
        head.position.y = 2.6;
        this.group.add(head);

        const bodyGeometry = new THREE.BoxGeometry(0.5, 1.0, 0.2);
        const body = new THREE.Mesh(bodyGeometry, new THREE.MeshStandardMaterial({ color: "#333" }));
        body.position.y = 1.7;
        this.group.add(body);

        const armGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.2);
        armGeometry.translate(0, -0.4, 0);
        const armMaterial = new THREE.MeshStandardMaterial({ color: "#666" });

        this.leftArm = new THREE.Mesh(armGeometry, armMaterial);
        this.leftArm.position.copy(LEFT_SHOULDER);
        this.group.add(this.leftArm);

        this.rightArm = new THREE.Mesh(armGeometry, armMaterial);
        this.rightArm.position.copy(RIGHT_SHOULDER);
        this.group.add(this.rightArm);

        const handGeometry = new THREE.SphereGeometry(0.1, 16, 16);

        this.leftHand = new THREE.Mesh(handGeometry, new THREE.MeshStandardMaterial({ color: "#aaa" }));
        this.leftHand.position.set(0, -ARM_LENGTH, 0);
        this.leftArm.add(this.leftHand);

        this.rightHand = new THREE.Mesh(handGeometry, new THREE.MeshStandardMaterial({ color: "#aaa" }));
        this.rightHand.position.set(0, -ARM_LENGTH, 0);
        this.rightArm.add(this.rightHand);

        const legGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.2);
        legGeometry.translate(0, -0.4, 0);
        const legMaterial = new THREE.MeshStandardMaterial({ color: "#444" });

        this.leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        this.leftLeg.position.set(-0.15, 1.1, 0);
        this.group.add(this.leftLeg);

        this.rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        this.rightLeg.position.set(0.15, 1.1, 0);
        this.group.add(this.rightLeg);

        this.group.traverse((obj) => { if (obj.isMesh) obj.castShadow = true; });

        // --- État d'ancrage ---
        this.leftAnchored = false;
        this.rightAnchored = false;
        this.leftAnchorPos = new THREE.Vector3();   // position MONDE fixe de la main gauche
        this.rightAnchorPos = new THREE.Vector3();

        // Référence vers la prise (wall.js) actuellement tenue par chaque main,
        // pour pouvoir la libérer proprement (wall.release) quand on lâche.
        this.leftHold = null;
        this.rightHold = null;

        this.group.position.y = GROUND_Y;
        this.wasOnGround = true;

        scene.add(this.group);
    }

    // Position monde actuelle de la main pour un bras/angle donné.
    handWorldPos(shoulder, angle) {
        return this.group.position.clone().add(handLocalOffset(shoulder, angle));
    }

    // `wall` (ClimbingWall, voir wall.js) est optionnel : sans lui, aucune main
    // ne peut plus jamais s'ancrer (il n'y a alors aucune prise à trouver).
    update(input, wall) {
        if (!input) return;

        // Angle de chaque bras (suit le stick, ou revient au repos / en suspension si relâché).
        const leftAngle = armAngle(input.leftStick, this.leftArm.rotation.z, input.L2);
        const rightAngle = armAngle(input.rightStick, this.rightArm.rotation.z, input.R2);

        // --- Tentative d'agrippement (tant que la gâchette est pressée et pas
        // encore ancré) : on ne s'ancre QUE si une prise est réellement à
        // portée de la main à cet instant. Si aucune prise n'est trouvée, rien
        // ne se passe et on retentera la frame suivante tant que la gâchette
        // reste enfoncée (permet de "rattraper" une prise en balançant le bras
        // sans avoir à retimer précisément l'appui).
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

        // --- Relâchement (la gâchette repasse en dessous du seuil) ---
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

        // Retour visuel des mains ancrées
        this.leftHand.material.color.set(this.leftAnchored ? "#f00" : "#aaa");
        this.rightHand.material.color.set(this.rightAnchored ? "#f00" : "#aaa");

        // --- Deux mains ancrées => personnage totalement bloqué (rien ne bouge). ---
        if (this.leftAnchored && this.rightAnchored) return;

        // Sinon les bras suivent les sticks
        this.leftArm.rotation.z = leftAngle;
        this.rightArm.rotation.z = rightAngle;

        if (this.leftAnchored) {
            // Le corps pivote autour de la main gauche restée fixe dans le monde.
            this.group.position.copy(this.leftAnchorPos).sub(handLocalOffset(LEFT_SHOULDER, leftAngle));
        } else if (this.rightAnchored) {
            this.group.position.copy(this.rightAnchorPos).sub(handLocalOffset(RIGHT_SHOULDER, rightAngle));
        } else {
            // Aucune main accrochée => chute.
            this.group.position.y -= GRAVITY;
        }

        // Collision avec le sol
        if (this.group.position.y < GROUND_Y) this.group.position.y = GROUND_Y;

        const onGround = this.group.position.y <= GROUND_Y;
        if (onGround && !this.wasOnGround) triggerGamepadFeedback();
        this.wasOnGround = onGround;
    }
}