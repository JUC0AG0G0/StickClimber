import * as THREE from 'https://unpkg.com/three@0.155.0/build/three.module.js';
import { getGamepadInput } from './input.js';
import { Player } from './player.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color("#87CEEB"); // 🌤️ Fond bleu ciel

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

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

const player = new Player(scene);

function gameLoop() {
    const input = getGamepadInput();
    player.update(input);
    renderer.render(scene, camera);
    requestAnimationFrame(gameLoop);
}

gameLoop();