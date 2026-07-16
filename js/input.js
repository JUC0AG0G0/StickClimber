// input.js
// Entrée de JEU (sticks + gâchettes L2/R2).
// Les gâchettes sont lues en ANALOGIQUE : on "accroche" en franchissant le mur dur
// (seuil GRAB) et on "décroche" en repassant sous RELEASE. L'écart entre les deux
// est la petite zone morte demandée (hystérésis), qui évite les accroche/décroche
// qui clignotent quand on reste pile sur le point dur.

export const TRIGGER_GRAB = 0.70;    // franchir le mur -> accroche
export const TRIGGER_RELEASE = 0.45; // repasser dessous -> décroche

// État accroché/décroché avec hystérésis (fonction pure, réutilisée par le menu).
export function gripFromValue(value, previous) {
    if (!previous && value > TRIGGER_GRAB) return true;
    if (previous && value < TRIGGER_RELEASE) return false;
    return previous;
}

let connectedGamepad = null;
let l2On = false;
let r2On = false;

window.addEventListener('gamepadconnected', (e) => {
    connectedGamepad = e.gamepad;
    hideGamepadPopup();
});

window.addEventListener('gamepaddisconnected', (e) => {
    if (connectedGamepad && connectedGamepad.index === e.gamepad.index) {
        connectedGamepad = null;
        showGamepadPopup('🕹️ Manette déconnectée !');
    }
});

function round(v) {
    if (Math.abs(v) < 0.1) return 0;
    return Number(v.toFixed(2));
}

export function getGamepadInput() {
    const pads = navigator.getGamepads?.() || [];
    const gp = connectedGamepad ? pads[connectedGamepad.index] : [...pads].find((p) => p);

    if (!gp) {
        showGamepadPopup('🕹️ Veuillez connecter une manette !');
        return null;
    }
    hideGamepadPopup();

    const l2v = gp.buttons[6]?.value || 0;
    const r2v = gp.buttons[7]?.value || 0;
    l2On = gripFromValue(l2v, l2On);
    r2On = gripFromValue(r2v, r2On);

    return {
        leftStick: { x: round(gp.axes[0] || 0), y: round(gp.axes[1] || 0) },
        rightStick: { x: round(gp.axes[2] || 0), y: round(gp.axes[3] || 0) },
        L2: l2On,
        R2: r2On,
        L2value: l2v,
        R2value: r2v,
    };
}

// --- Popup "connecter une manette" ---
function showGamepadPopup(message) {
    let popup = document.getElementById('gamepad-popup');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'gamepad-popup';
        popup.className = 'gamepad-popup';
        document.body.appendChild(popup);
    }
    popup.textContent = message;
    popup.style.display = 'block';
}

function hideGamepadPopup() {
    const popup = document.getElementById('gamepad-popup');
    if (popup) popup.style.display = 'none';
}