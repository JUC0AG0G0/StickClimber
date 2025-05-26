import * as THREE from 'https://unpkg.com/three@0.155.0/build/three.module.js';

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

        scene.add(this.group);
    }

    update(input) {
        if (!input) return;

        const leftAngle = Math.atan2(input.leftStick.x, input.leftStick.y);
        const rightAngle = Math.atan2(input.rightStick.x, input.rightStick.y);

        this.leftArm.rotation.z = leftAngle;
        this.rightArm.rotation.z = rightAngle;

        this.leftHand.material.color.set(input.L2 ? "#f00" : "#aaa");
        this.rightHand.material.color.set(input.R2 ? "#f00" : "#aaa");
    }

}