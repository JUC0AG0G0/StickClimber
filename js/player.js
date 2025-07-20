import * as THREE from 'https://unpkg.com/three@0.155.0/build/three.module.js';
import { triggerGamepadFeedback } from './feedback.js';

export class Player {
    constructor(scene) {
        this.group = new THREE.Group();

        const headGeometry = new THREE.SphereGeometry(0.27, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({ color: "#fdd" });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 2.6;
        this.group.add(head);

        const bodyGeometry = new THREE.BoxGeometry(0.5, 1.0, 0.2);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: "#333" });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1.7;
        this.group.add(body);

        const armGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.2);
        armGeometry.translate(0, -0.4, 0);
        const armMaterial = new THREE.MeshStandardMaterial({ color: "#666" });

        this.leftArm = new THREE.Mesh(armGeometry, armMaterial);
        this.leftArm.position.set(-0.4, 2.2, 0);
        this.group.add(this.leftArm);

        this.rightArm = new THREE.Mesh(armGeometry, armMaterial);
        this.rightArm.position.set(0.4, 2.2, 0);
        this.group.add(this.rightArm);

        const handGeometry = new THREE.SphereGeometry(0.1, 16, 16);

        this.leftHand = new THREE.Mesh(handGeometry, new THREE.MeshStandardMaterial({ color: "#aaa" }));
        this.leftHand.position.set(0, -0.9, 0);
        this.leftArm.add(this.leftHand);

        this.rightHand = new THREE.Mesh(handGeometry, new THREE.MeshStandardMaterial({ color: "#aaa" }));
        this.rightHand.position.set(0, -0.9, 0);
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

        head.castShadow = true;
        body.castShadow = true;
        this.leftArm.castShadow = true;
        this.rightArm.castShadow = true;
        this.leftHand.castShadow = true;
        this.rightHand.castShadow = true;
        this.leftLeg.castShadow = true;
        this.rightLeg.castShadow = true;

        this.leftHandAnchored = false;
        this.rightHandAnchored = false;
        this.leftHandAnchorPos = new THREE.Vector3();
        this.rightHandAnchorPos = new THREE.Vector3();

        this.group.position.y = -0.28;

        this.wasOnGround = true;


        // === Ligne direction bras gauche dans le monde ===
        const leftMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
        const leftPoints = [new THREE.Vector3(), new THREE.Vector3()];
        const leftGeometry = new THREE.BufferGeometry().setFromPoints(leftPoints);
        this.leftArmWorldLine = new THREE.Line(leftGeometry, leftMaterial);
        scene.add(this.leftArmWorldLine);

        // === Ligne direction bras droit dans le monde ===
        const rightMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
        const rightPoints = [new THREE.Vector3(), new THREE.Vector3()];
        const rightGeometry = new THREE.BufferGeometry().setFromPoints(rightPoints);
        this.rightArmWorldLine = new THREE.Line(rightGeometry, rightMaterial);
        scene.add(this.rightArmWorldLine);



        scene.add(this.group);
    }

    update(input) {
        if (!input) return;

        // === 1. Gestion de l'ancrage des mains (L2 / R2) ===

        // Ancrage main gauche
        if (input.L2 && !this.leftHandAnchored) {
            this.leftHandAnchored = true;
            this.leftHand.getWorldPosition(this.leftHandAnchorPos); // Sauvegarde la position mondiale comme point d’ancrage
        } else if (!input.L2 && this.leftHandAnchored) {
            this.leftHandAnchored = false;
        }

        // Ancrage main droite
        if (input.R2 && !this.rightHandAnchored) {
            this.rightHandAnchored = true;
            this.rightHand.getWorldPosition(this.rightHandAnchorPos); // Sauvegarde la position mondiale comme point d’ancrage
        } else if (!input.R2 && this.rightHandAnchored) {
            this.rightHandAnchored = false;
        }






        // === 2. Calcul de la rotation des bras en fonction de l'entrée ou de l'ancrage ===

        // Bras gauche
        if (this.leftHandAnchored) {
            // Main ancrée



            // === Mise à jour de la ligne de direction pour le bras gauche ===
            const leftStart = new THREE.Vector3();
            this.leftHand.getWorldPosition(leftStart);

            let leftInput = new THREE.Vector2(input.leftStick.x, input.leftStick.y);

            if (leftInput.lengthSq() < 0.0001) { // Si stick immobile alors vers le bas
                leftInput.set(0, -1);
            }

            const leftDir = new THREE.Vector3(
                -leftInput.x,
                leftInput.y,
                0
            ).normalize().multiplyScalar(0.5); // longueur de la ligne

            const leftEnd = leftStart.clone().add(leftDir);
            this.leftArmWorldLine.geometry.setFromPoints([leftStart, leftEnd]);


        } else {
            // Main non ancrée
            const leftAngle = Math.atan2(input.leftStick.x, input.leftStick.y);
            this.leftArm.rotation.z = leftAngle;
        }

        // Bras droit
        if (this.rightHandAnchored) {
            // Main ancrée



            // === Mise à jour de la ligne de direction pour le bras droit ===
            const rightStart = new THREE.Vector3();
            this.rightHand.getWorldPosition(rightStart);

            let rightInput = new THREE.Vector2(input.rightStick.x, input.rightStick.y);

            if (rightInput.lengthSq() < 0.0001) { // Si stick immobile alors vers le bas
                rightInput.set(0, -1);
            }

            const rightDir = new THREE.Vector3(
                -rightInput.x,
                rightInput.y,
                0
            ).normalize().multiplyScalar(0.5); // longueur de la ligne

            const rightEnd = rightStart.clone().add(rightDir);
            this.rightArmWorldLine.geometry.setFromPoints([rightStart, rightEnd]);


        } else {
            // Main non ancrée
            const rightAngle = Math.atan2(input.rightStick.x, input.rightStick.y);
            this.rightArm.rotation.z = rightAngle;
        }




        // === 3. Mise à jour de la couleur des mains en fonction de l’ancrage ===

        this.leftHand.material.color.set(this.leftHandAnchored ? "#f00" : "#aaa");
        this.rightHand.material.color.set(this.rightHandAnchored ? "#f00" : "#aaa");

        // === 4. Gravité si aucune main n’est ancrée ===

        if (!this.leftHandAnchored && !this.rightHandAnchored) {
            this.group.position.y -= 0.0981; // Simule la chute
        }

        // === 5. Collision avec le sol ===

        const minY = -0.28;
        if (this.group.position.y < minY) {
            this.group.position.y = minY; // Ne descend pas sous le sol
        }

        const onGround = this.group.position.y <= minY;

        // === 6. Retour haptique (vibration manette) au contact avec le sol ===

        if (onGround && !this.wasOnGround) {
            triggerGamepadFeedback();
        }

        this.wasOnGround = onGround;


        // Debug
        const debugDiv = document.getElementById("debug");

        const leftHandWorldPos = new THREE.Vector3();
        this.leftHand.getWorldPosition(leftHandWorldPos);

        const rightHandWorldPos = new THREE.Vector3();
        this.rightHand.getWorldPosition(rightHandWorldPos);

        const groupPos = this.group.position;

        debugDiv.innerHTML = `
<b>=== DEBUG ===</b><br/>
<b>Group:</b> (${groupPos.x.toFixed(2)}, ${groupPos.y.toFixed(2)}, ${groupPos.z.toFixed(2)})<br/>
<b>Left Hand:</b> (${leftHandWorldPos.x.toFixed(2)}, ${leftHandWorldPos.y.toFixed(2)}, ${leftHandWorldPos.z.toFixed(2)})<br/>
<b>Right Hand:</b> (${rightHandWorldPos.x.toFixed(2)}, ${rightHandWorldPos.y.toFixed(2)}, ${rightHandWorldPos.z.toFixed(2)})<br/>
<b>Left Arm rot.z:</b> ${this.leftArm.rotation.z.toFixed(2)}<br/>
<b>Right Arm rot.z:</b> ${this.rightArm.rotation.z.toFixed(2)}<br/>
<b>L2 Anchored:</b> ${this.leftHandAnchored}<br/>
<b>R2 Anchored:</b> ${this.rightHandAnchored}<br/>
`;
    }

}