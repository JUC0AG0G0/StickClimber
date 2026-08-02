// ui/controlsPanel.js
// Zone "Paramètres" du hub 3D : état DualSense partagé (getDualSense,
// toggles), boutons 3D (connexion, gâchettes, vibration) et visualisation
// TEMPS RÉEL des sticks / gâchettes dessinée sur le panneau 3D — le canvas
// du panneau est redessiné à chaque frame tant que la zone est active.

import { DualSense } from '../input/dualsense.js';
import { getGamepadInput } from '../input/input.js';

let ds = null;
let triggersOn = false;
let vibrationOn = true;
let statusText = 'Non connectée';

let panel = null;
let buttons = null;
let isActive = null;

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
export function initControlsPanel(options) {
    ({ panel, buttons, isActive } = options);

    buttons.connect.onClick = connect;

    buttons.triggers.onClick = () => {
        triggersOn = !triggersOn;
        buttons.triggers.setLabel(`Gâchettes : ${triggersOn ? 'Actif' : 'Inactif'}`);
        syncTriggerEffect();
    };

    buttons.vibration.onClick = () => {
        vibrationOn = !vibrationOn;
        buttons.vibration.setLabel(`Vibration : ${vibrationOn ? 'Actif' : 'Inactif'}`);
    };

    panel.redraw(draw); // état initial (visible de loin depuis l'accueil)
    requestAnimationFrame(liveLoop);
}

async function connect() {
    try {
        statusText = 'Connexion…';
        panel.redraw(draw);
        ds = new DualSense();
        await ds.connect();
        statusText = 'Connectée (USB)';
        syncTriggerEffect(); // applique le toggle tel qu'il était réglé
    } catch (e) {
        ds = null;
        statusText = 'Erreur : ' + e.message;
    }
    panel.redraw(draw);
}

// ===================== Visualisation temps réel =====================
function liveLoop() {
    if (isActive?.()) panel.redraw(draw);
    requestAnimationFrame(liveLoop);
}

function drawStick(ctx, cx, cy, r, x, y, label) {
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#111';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    const mag = Math.hypot(x, y);
    if (mag > 1) { x /= mag; y /= mag; }
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(cx + x * r, cy + y * r, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '400 22px system-ui, sans-serif';
    ctx.fillStyle = '#888';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(label, cx, cy + r + 34);
}

function draw(ctx, w, h) {
    ctx.fillStyle = '#111';
    ctx.font = '700 28px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`DualSense : ${statusText}`, w / 2, 62);

    // On repasse par input.js pour rester cohérent avec ce qui est réellement
    // utilisé en jeu (deadzone, seuil de "grip" des gâchettes).
    const input = getGamepadInput();
    const r = h * 0.2;
    const cy = h * 0.52;
    drawStick(ctx, w * 0.28, cy, r, input?.leftStick.x ?? 0, input?.leftStick.y ?? 0, 'Stick gauche');
    drawStick(ctx, w * 0.72, cy, r, input?.rightStick.x ?? 0, input?.rightStick.y ?? 0, 'Stick droit');

    ctx.font = '700 26px monospace';
    ctx.fillStyle = '#111';
    const l2 = input ? `L2 ${input.L2 ? '■' : '□'} ${Math.round(input.L2value * 100)}%` : 'L2 —';
    const r2 = input ? `R2 ${input.R2 ? '■' : '□'} ${Math.round(input.R2value * 100)}%` : 'R2 —';
    ctx.fillText(l2, w * 0.28, h - 36);
    ctx.fillText(r2, w * 0.72, h - 36);
}
