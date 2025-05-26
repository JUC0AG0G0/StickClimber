import * as THREE from 'https://unpkg.com/three@0.155.0/build/three.module.js';
import { getGamepadInput } from './input.js';
import { Player } from './player.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color("#87CEEB");

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 5);
camera.rotation.x = -0.3;

const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: document.getElementById("game-canvas") });
renderer.setSize(window.innerWidth, window.innerHeight);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 10, 10);
scene.add(light);

const floorGeometry = new THREE.PlaneGeometry(20, 20);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = 0;
floor.receiveShadow = true;
scene.add(floor);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

light.castShadow = true;
light.shadow.camera.left = -10;
light.shadow.camera.right = 10;
light.shadow.camera.top = 10;
light.shadow.camera.bottom = -10;
light.shadow.camera.near = 1;
light.shadow.camera.far = 20;

floor.receiveShadow = true;

const player = new Player(scene);

function gameLoop() {
    const input = getGamepadInput();
    player.update(input);

    camera.position.x = player.group.position.x;
    camera.position.y = player.group.position.y + 2.7;
    camera.lookAt(player.group.position);

    renderer.render(scene, camera);
    requestAnimationFrame(gameLoop);
}


gameLoop();