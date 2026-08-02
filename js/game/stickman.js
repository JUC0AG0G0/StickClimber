// game/stickman.js
// Le bonhomme "papier découpé" : membres blancs soulignés d'arêtes noires,
// tête et mains blanches cerclées d'une silhouette d'encre.
// Utilisé par le joueur (game/player.js) ; le style vient de core/ink.js.
//
// Les constantes d'épaules / longueur de bras sont exportées ici car la
// physique du joueur en dépend.

import * as THREE from 'https://unpkg.com/three@0.155.0/build/three.module.js';
import { edgedMesh, outlinedMesh } from '../core/ink.js';

export const LEFT_SHOULDER = new THREE.Vector3(-0.4, 2.2, 0);
export const RIGHT_SHOULDER = new THREE.Vector3(0.4, 2.2, 0);
export const ARM_LENGTH = 0.9;   // distance épaule -> main

export function createStickman() {
    const group = new THREE.Group();

    const head = outlinedMesh(new THREE.SphereGeometry(0.27, 20, 16), { outline: 1.1 });
    head.position.y = 2.6;
    group.add(head);

    const body = edgedMesh(new THREE.BoxGeometry(0.18, 1.0, 0.18));
    body.position.y = 1.7;
    group.add(body);

    // Bras : pivot à l'épaule (géométrie décalée vers le bas).
    const armGeometry = new THREE.BoxGeometry(0.13, 0.8, 0.13);
    armGeometry.translate(0, -0.4, 0);

    const leftArm = edgedMesh(armGeometry);
    leftArm.position.copy(LEFT_SHOULDER);
    group.add(leftArm);

    const rightArm = edgedMesh(armGeometry);
    rightArm.position.copy(RIGHT_SHOULDER);
    group.add(rightArm);

    // Mains : matériaux SÉPARÉS (outlinedMesh en crée un neuf à chaque appel)
    // pour pouvoir les "remplir" d'encre indépendamment (retour d'ancrage).
    const handGeometry = new THREE.SphereGeometry(0.1, 16, 16);

    const leftHand = outlinedMesh(handGeometry, { outline: 1.28 });
    leftHand.position.set(0, -ARM_LENGTH, 0);
    leftArm.add(leftHand);

    const rightHand = outlinedMesh(handGeometry, { outline: 1.28 });
    rightHand.position.set(0, -ARM_LENGTH, 0);
    rightArm.add(rightHand);

    // Jambes légèrement écartées : posture stickman.
    const legGeometry = new THREE.BoxGeometry(0.13, 0.8, 0.13);
    legGeometry.translate(0, -0.4, 0);

    const leftLeg = edgedMesh(legGeometry);
    leftLeg.position.set(-0.15, 1.1, 0);
    leftLeg.rotation.z = -0.1;
    group.add(leftLeg);

    const rightLeg = edgedMesh(legGeometry);
    rightLeg.position.set(0.15, 1.1, 0);
    rightLeg.rotation.z = 0.1;
    group.add(rightLeg);

    return { group, head, body, leftArm, rightArm, leftHand, rightHand, leftLeg, rightLeg };
}
