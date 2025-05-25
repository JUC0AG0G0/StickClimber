import * as THREE from 'https://unpkg.com/three@0.155.0/build/three.module.js';

export class Player {
    constructor(scene) {
        this.group = new THREE.Group();

        const bodyGeometry = new THREE.BoxGeometry(0.5, 1.5, 0.2);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: "#333" });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1.5;
        this.group.add(body);

        const armGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.2);
        const armMaterial = new THREE.MeshStandardMaterial({ color: "#666" });

        this.leftArm = new THREE.Mesh(armGeometry, armMaterial);
        this.leftArm.position.set(-0.4, 1.6, 0);
        this.group.add(this.leftArm);

        this.rightArm = new THREE.Mesh(armGeometry, armMaterial);
        this.rightArm.position.set(0.4, 1.6, 0);
        this.group.add(this.rightArm);

        const handGeometry = new THREE.SphereGeometry(0.1, 16, 16);

        this.leftHand = new THREE.Mesh(handGeometry, new THREE.MeshStandardMaterial({ color: "#aaa" }));
        this.leftHand.position.set(0, -0.5, 0);
        this.leftArm.add(this.leftHand);

        this.rightHand = new THREE.Mesh(handGeometry, new THREE.MeshStandardMaterial({ color: "#aaa" }));
        this.rightHand.position.set(0, -0.5, 0);
        this.rightArm.add(this.rightHand);

        scene.add(this.group);
    }

    update(input) {
        if (!input) return;

        this.leftArm.rotation.z = input.leftStick.y;
        this.rightArm.rotation.z = input.rightStick.y;

        this.leftHand.material.color.set(input.L2 ? "#f00" : "#aaa");
        this.rightHand.material.color.set(input.R2 ? "#f00" : "#aaa");
    }
}