export const TRIGGER_THRESHOLD = 0.71;

export const gripFromValue = (value) => value >= TRIGGER_THRESHOLD;

let connectedGamepad = null;

// --- Événements Manette ---
window.addEventListener('gamepadconnected', (e) => {
  connectedGamepad = e.gamepad;
  toggleGamepadPopup(false);
});

window.addEventListener('gamepaddisconnected', (e) => {
  if (connectedGamepad?.index === e.gamepad.index) {
    connectedGamepad = null;
    toggleGamepadPopup(true, '🕹️ Manette déconnectée !');
  }
});

const round = (v) => Math.abs(v) < 0.1 ? 0 : Number(v.toFixed(2));

// --- Récupération des entrées ---
export function getGamepadInput() {
  const pads = navigator.getGamepads?.() || [];
  const gp = connectedGamepad ? pads[connectedGamepad.index] : [...pads].find(Boolean);

  if (!gp) {
    toggleGamepadPopup(true, '🕹️ Veuillez connecter une manette !');
    return null;
  }

  toggleGamepadPopup(false);

  const l2v = gp.buttons[6]?.value || 0;
  const r2v = gp.buttons[7]?.value || 0;

  return {
    leftStick:  { x: round(gp.axes[0] || 0), y: round(gp.axes[1] || 0) },
    rightStick: { x: round(gp.axes[2] || 0), y: round(gp.axes[3] || 0) },
    L2: gripFromValue(l2v),
    R2: gripFromValue(r2v),
    L2value: l2v,
    R2value: r2v,
  };
}

// --- Gestion de la Popup ---
function toggleGamepadPopup(show, message = '') {
  let popup = document.getElementById('gamepad-popup');
  
  if (show) {
    if (!popup) {
      popup = document.createElement('div');
      popup.id = 'gamepad-popup';
      popup.className = 'gamepad-popup';
      document.body.appendChild(popup);
    }
    popup.textContent = message;
    popup.style.display = 'block';
  } else if (popup) {
    popup.style.display = 'none';
  }
}