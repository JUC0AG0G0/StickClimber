// menu/menuNav.js
// Navigation du menu 3D natif : plus aucun bouton HTML.
//  - Souris : raycast sur les Button3D de la zone courante (survol = pancarte
//    inversée, clic = action) ET sur les panneaux interactifs (`hotMeshes`,
//    ex : liens des mentions légales, repérés via les UV de l'intersection).
//  - Molette : si la zone expose `scroll(dy)` (mentions légales), on scrolle.
//  - Manette : haut/bas déplace le focus (ou scrolle dans une zone
//    scrollable), croix valide, rond revient à l'accueil.
// Chaque action de navigation déclenche une ORBITE de caméra (cameraRig).

import * as THREE from 'https://unpkg.com/three@0.155.0/build/three.module.js';

let rig = null;
let hub = null;
let camera = null;
let canvasEl = null;
let onPlay = null;
let onQuitRequest = null;

let currentSection = 'home';
let inGame = false;

let hovered = null;      // Button3D survolé / focus
let focusIndex = -1;     // index manette dans les boutons de la zone
let navCooldown = 0;
let prevConfirm = false;
let prevBack = false;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

export function initMenuNav(options) {
    ({ rig, hub, camera, canvas: canvasEl, onPlay, onQuitRequest } = options);

    canvasEl.addEventListener('pointermove', onPointerMove);
    canvasEl.addEventListener('click', onPointerClick);
    canvasEl.addEventListener('wheel', onWheel, { passive: false });
    document.getElementById('btn-quit').addEventListener('click', () => onQuitRequest?.());

    requestAnimationFrame(menuLoop);
}

export function getCurrentSection() {
    return inGame ? 'game' : currentSection;
}

// ---------------- Zone courante ----------------
function currentZone() {
    return inGame ? null : hub.zones[currentSection];
}

function zoneButtons() {
    return currentZone()?.buttons ?? [];
}

function setHovered(btn) {
    if (btn === hovered) return;
    hovered?.setHover(false);
    hovered = btn;
    hovered?.setHover(true);
}

// ---------------- Souris (raycast) ----------------
function pick(event) {
    if (inGame) return null;
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const zone = currentZone();
    const meshes = [
        ...zoneButtons().map((b) => b.mesh),
        ...(zone?.hotMeshes ?? []),
    ];
    const hit = raycaster.intersectObjects(meshes, false)[0];
    if (!hit) return null;

    const button = hit.object.userData.button;
    if (button) return { button };

    const handler = hit.object.userData.pointerHandler;
    if (handler) return { handler, uv: hit.uv };
    return null;
}

function onPointerMove(event) {
    const hit = pick(event);
    if (hit?.button) {
        setHovered(hit.button);
        focusIndex = zoneButtons().indexOf(hit.button);
        canvasEl.style.cursor = 'pointer';
        return;
    }
    setHovered(null);
    focusIndex = -1;
    const onLink = hit?.handler ? hit.handler('move', hit.uv) : false;
    canvasEl.style.cursor = onLink ? 'pointer' : 'default';
}

function onPointerClick(event) {
    const hit = pick(event);
    if (hit?.button) activate(hit.button);
    else if (hit?.handler) hit.handler('click', hit.uv);
}

function onWheel(event) {
    const zone = currentZone();
    if (zone?.scroll) {
        event.preventDefault();
        zone.scroll(event.deltaY);
    }
}

// ---------------- Actions ----------------
function activate(btn) {
    if (btn.onClick) { btn.onClick(); return; }
    switch (btn.action) {
        case 'play': enterGame(); break;
        case 'back': goToSection('home'); break;
        default: goToSection(btn.action);
    }
}

function goToSection(name) {
    if (inGame || name === currentSection || !hub.poses[name]) return;
    setHovered(null);
    focusIndex = -1;
    canvasEl.style.cursor = 'default';
    currentSection = name;
    hub.zones[name].onEnter?.(); // ex : redessiner le classement
    rig.goTo(hub.poses[name], 1.15);
}

function enterGame() {
    setHovered(null);
    focusIndex = -1;
    canvasEl.style.cursor = 'default';
    inGame = true;
    toggleHud(true);
    onPlay?.(); // la caméra plonge en mode "follow" (game.start)
}

/** Appelé par main.js quand la partie se termine. */
export function returnToMenu() {
    inGame = false;
    toggleHud(false);
    currentSection = 'home';
    rig.goTo(hub.poses.home, 1.25);
}

function toggleHud(gameVisible) {
    document.getElementById('game-ui').classList.toggle('hidden', !gameVisible);
    document.getElementById('menu-hint').classList.toggle('hidden', gameVisible);
}

// ---------------- Manette ----------------
// navigator.getGamepads() direct (boutons bruts), indépendamment de la
// logique de "grip" des gâchettes de input.js.
function menuLoop() {
    if (!inGame) {
        const pad = [...(navigator.getGamepads?.() || [])].find((p) => p);
        if (pad) {
            const zone = currentZone();
            const items = zoneButtons();
            const y = pad.axes[1] || 0;
            const up = pad.buttons[12]?.pressed || y < -0.5;
            const down = pad.buttons[13]?.pressed || y > 0.5;
            const confirm = pad.buttons[0]?.pressed;   // croix
            const back = pad.buttons[1]?.pressed;      // rond

            if (navCooldown > 0) navCooldown--;
            if (navCooldown === 0 && (up || down)) {
                if (zone?.scroll) {
                    // Zone scrollable (mentions légales) : haut/bas fait défiler.
                    zone.scroll(down ? 55 : -55);
                    navCooldown = 4;
                } else if (items.length) {
                    focusIndex = down
                        ? (focusIndex + 1) % items.length
                        : (focusIndex - 1 + items.length) % items.length;
                    setHovered(items[focusIndex]);
                    navCooldown = 12;
                }
            }
            if (confirm && !prevConfirm) {
                // Dans une zone scrollable sans focus, croix = RETOUR direct.
                const target = hovered ?? (zone?.scroll ? items[0] : null);
                if (target) activate(target);
            }
            if (back && !prevBack && currentSection !== 'home') goToSection('home');

            prevConfirm = confirm;
            prevBack = back;
        }
    }
    requestAnimationFrame(menuLoop);
}
