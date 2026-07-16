import { DualSense } from './dualsense.js';

const SCREENS = ['menu', 'leaderboard', 'controls', 'game'];
const LB_KEY = 'stickclimber_scores';

let handlers = {};
let currentScreen = 'menu';
let ds = null;

let triggersOn = false; // correspond au texte HTML "Gâchettes : Inactif"
let vibrationOn = true; // correspond au texte HTML "Vibration : Actif"

export function getDualSense() { return ds; }
export function isVibrationOn() { return vibrationOn; }
export function areTriggersOn() { return triggersOn; }

export function syncTriggerEffect() {
    if (!ds || !ds.connected) return;
    if (triggersOn) {
        ds.setTriggerWeapon('both', 100, 130, 255);
    } else {
        ds.setTriggerOff('both');
    }
}

// ============================ Init ============================
export function initUI(h) {
    handlers = h;

    document.querySelectorAll('[data-action]').forEach((btn) => {
        btn.addEventListener('click', () => handleAction(btn.dataset.action));
    });

    document.getElementById('btn-quit').addEventListener('click', () => handlers.onBack?.());

    setupControlsPanel();
    renderLeaderboard();

    requestAnimationFrame(menuLoop);
    requestAnimationFrame(visualLoop);
}

function handleAction(action) {
    switch (action) {
        case 'play':
            showScreen('game');
            handlers.onPlay?.();
            break;
        case 'leaderboard':
            renderLeaderboard();
            showScreen('leaderboard');
            break;
        case 'controls':
            showScreen('controls');
            break;
        case 'back':
            showScreen('menu');
            break;
    }
}

export function showScreen(name) {
    currentScreen = name;
    SCREENS.forEach((s) => {
        document.getElementById('screen-' + s).classList.toggle('active', s === name);
    });
    focusIndex = 0;
    updateFocus();
}

// ===================== Navigation manette =====================
let focusIndex = 0;
let navCooldown = 0;
let prevConfirm = false;
let prevBack = false;

function focusables() {
    const screen = document.getElementById('screen-' + currentScreen);
    return screen ? Array.from(screen.querySelectorAll('button')) : [];
}

function updateFocus() {
    const items = focusables();
    items.forEach((b, i) => b.classList.toggle('focused', i === focusIndex));
}

function menuLoop() {
    if (currentScreen !== 'game') {
        const pad = [...(navigator.getGamepads?.() || [])].find((p) => p);
        if (pad) {
            const items = focusables();
            const y = pad.axes[1] || 0;
            const up = pad.buttons[12]?.pressed || y < -0.5;
            const down = pad.buttons[13]?.pressed || y > 0.5;
            const confirm = pad.buttons[0]?.pressed;   // croix
            const back = pad.buttons[1]?.pressed;      // rond

            if (navCooldown > 0) navCooldown--;
            if (navCooldown === 0 && items.length) {
                if (up) { focusIndex = (focusIndex - 1 + items.length) % items.length; updateFocus(); navCooldown = 12; }
                else if (down) { focusIndex = (focusIndex + 1) % items.length; updateFocus(); navCooldown = 12; }
            }
            if (confirm && !prevConfirm) items[focusIndex]?.click();
            if (back && !prevBack && currentScreen !== 'menu') showScreen('menu');

            prevConfirm = confirm;
            prevBack = back;
        }
    }
    requestAnimationFrame(menuLoop);
}

// ===================== Panneau Manette + DualSense =====================
function setupControlsPanel() {
    buildGamepadVisual();

    const status = document.getElementById('ds-status');
    const triggersBtn = document.getElementById('toggle-triggers');
    const vibrationBtn = document.getElementById('toggle-vibration');

    // Affichage initial cohérent avec l'état par défaut
    updateToggleButton(triggersBtn, 'Gâchettes', triggersOn);
    updateToggleButton(vibrationBtn, 'Vibration', vibrationOn);

    triggersBtn.addEventListener('click', () => {
        triggersOn = !triggersOn;
        updateToggleButton(triggersBtn, 'Gâchettes', triggersOn);
        syncTriggerEffect();
    });

    vibrationBtn.addEventListener('click', () => {
        vibrationOn = !vibrationOn;
        updateToggleButton(vibrationBtn, 'Vibration', vibrationOn);
    });

    document.getElementById('ds-connect').addEventListener('click', async () => {
        try {
            status.textContent = 'Connexion…';
            ds = new DualSense();
            await ds.connect();
            status.textContent = `Connecté (${ds.connectionType})`;
            syncTriggerEffect(); // applique le toggle "Gâchettes" tel qu'il était réglé
        } catch (e) {
            ds = null;
            status.textContent = 'Erreur : ' + e.message;
        }
    });
}

function updateToggleButton(btn, label, isOn) {
    btn.textContent = `${label} : ${isOn ? 'Actif' : 'Inactif'}`;
    btn.classList.toggle('on', isOn);
}

function applyEffect(effect) {
    if (!ds || !ds.connected) return;
    switch (effect) {
        case 'off': ds.off('both'); break;
        case 'resistance': ds.feedback('both', 0, 6); break;
        case 'weapon': ds.weapon('right', 2, 7, 8); break;
        case 'vibration': ds.vibration('left', 0, 6, 20); break;
    }
}

// ===================== Visualisation manette =====================
function buildGamepadVisual() {
    const host = document.getElementById('gamepad-visual-host');
    host.innerHTML = '';
    host.appendChild(stickBox('viz-left', 'Stick gauche'));
    host.appendChild(stickBox('viz-right', 'Stick droit'));

    const trig = document.createElement('div');
    trig.className = 'stick-box trig-box';
    trig.innerHTML = '<div id="viz-l2">L2 ❌</div><div id="viz-r2">R2 ❌</div>';
    host.appendChild(trig);
}

function stickBox(id, label) {
    const box = document.createElement('div');
    box.className = 'stick-box';
    const title = document.createElement('div');
    title.textContent = label;
    const canvas = document.createElement('canvas');
    canvas.id = id;
    canvas.width = 110;
    canvas.height = 110;
    box.append(title, canvas);
    return box;
}

function deadzone(v) { return Math.abs(v) < 0.1 ? 0 : v; }

function drawStick(canvasId, x, y) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const c = canvas.width / 2;
    const radius = 40;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.arc(c, c, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#3a4a5e';
    ctx.lineWidth = 2;
    ctx.stroke();

    const mag = Math.hypot(x, y);
    if (mag > 1) { x /= mag; y /= mag; }

    ctx.beginPath();
    ctx.arc(c + x * radius, c + y * radius, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#4dd0a0';
    ctx.fill();
}

function visualLoop() {
    if (currentScreen === 'controls') {
        const pad = [...(navigator.getGamepads?.() || [])].find((p) => p);
        if (pad) {
            drawStick('viz-left', deadzone(pad.axes[0] || 0), deadzone(pad.axes[1] || 0));
            drawStick('viz-right', deadzone(pad.axes[2] || 0), deadzone(pad.axes[3] || 0));
            const l2 = pad.buttons[6]?.pressed;
            const r2 = pad.buttons[7]?.pressed;
            const le = document.getElementById('viz-l2');
            const re = document.getElementById('viz-r2');
            if (le) le.textContent = `L2 ${l2 ? '✅' : '❌'}`;
            if (re) re.textContent = `R2 ${r2 ? '✅' : '❌'}`;
        }
    }
    requestAnimationFrame(visualLoop);
}

// ===================== Classement (localStorage) =====================
function loadScores() {
    try { return JSON.parse(localStorage.getItem(LB_KEY)) || []; }
    catch { return []; }
}

export function saveScore(score) {
    if (!score || score <= 0) return;
    const scores = loadScores();
    scores.push({ score, date: Date.now() });
    scores.sort((a, b) => b.score - a.score);
    localStorage.setItem(LB_KEY, JSON.stringify(scores.slice(0, 10)));
}

function renderLeaderboard() {
    const list = document.getElementById('leaderboard-list');
    const scores = loadScores();
    if (!scores.length) {
        list.innerHTML = '<li class="empty">Aucun score pour l\'instant</li>';
        return;
    }
    list.innerHTML = scores
        .map((s, i) => `<li><span class="rank">#${i + 1}</span><span class="pts">${s.score}</span></li>`)
        .join('');
}