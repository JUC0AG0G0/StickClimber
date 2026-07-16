import * as THREE from 'https://unpkg.com/three@0.155.0/build/three.module.js';
import { getGamepadInput } from './input.js';
import { Player } from './player.js';
import { triggerGamepadFeedback } from './feedback.js';
import { initUI, showScreen, isVibrationOn, syncTriggerEffect, saveScore } from './ui.js';

const GROUND_Y = -0.28;

// ============================ Scène ============================
const scene = new THREE.Scene();
scene.background = new THREE.Color('#87CEEB');

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 5);
camera.rotation.x = -0.3;

const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: document.getElementById('game-canvas') });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 10, 10);
light.castShadow = true;
light.shadow.camera.left = -10;
light.shadow.camera.right = 10;
light.shadow.camera.top = 10;
light.shadow.camera.bottom = -10;
light.shadow.camera.near = 1;
light.shadow.camera.far = 20;
scene.add(light);

const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ color: 0x228b22 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const player = new Player(scene);

// ============================ État de jeu ============================
let running = false;
let score = 0;
let maxHeight = 0;
let lastL2 = false;
let lastR2 = false;

function resetGame() {
    player.group.position.set(0, GROUND_Y, 0);
    player.leftArm.rotation.z = 0;
    player.rightArm.rotation.z = 0;
    player.leftAnchored = false;
    player.rightAnchored = false;
    score = 0;
    maxHeight = 0;
    lastL2 = false;
    lastR2 = false;
}

function updateScore() {
    const h = player.group.position.y;
    if (h > maxHeight) {
        maxHeight = h;
        score = Math.floor(maxHeight * 3);
    }
    const el = document.getElementById('score-display');
    if (el) el.textContent = `Score : ${score}`;
}

function grabFeedback(input) {
    if (!input) return;
    const grabbedL2 = input.L2 && !lastL2;
    const grabbedR2 = input.R2 && !lastR2;
    lastL2 = input.L2;
    lastR2 = input.R2;
}

function loop() {
    if (!running) return;

    const input = getGamepadInput();
    player.update(input);
    grabFeedback(input);
    updateScore();

    // Quitter vers le menu avec Options (bouton 9).
    const pad = [...(navigator.getGamepads?.() || [])].find((p) => p);
    if (pad && pad.buttons[9]?.pressed) {
        quitToMenu();
        return;
    }

    camera.position.x = player.group.position.x;
    camera.position.y = player.group.position.y + 2.7;
    camera.lookAt(player.group.position);

    renderer.render(scene, camera);
    requestAnimationFrame(loop);
}

function startGame() {
    resetGame();
    renderer.setSize(window.innerWidth, window.innerHeight);

    syncTriggerEffect();

    running = true;
    loop();
}

function quitToMenu() {
    running = false;
    saveScore(score);
    showScreen('menu');
}

// ============================ Démarrage ============================
initUI({ onPlay: startGame, onBack: quitToMenu });
showScreen('menu');