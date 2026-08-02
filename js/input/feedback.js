// input/feedback.js
// Retour haptique : DualSense via WebHID si connectée, sinon repli sur
// l'API Gamepad standard.
// Nouveau : respecte le toggle "Vibration" des Paramètres (avant, le toggle
// existait dans l'UI mais n'était jamais consulté ici).

import { getDualSense, isVibrationOn } from '../ui/controlsPanel.js';

let rumbleTimeout = null;

export function triggerGamepadFeedback({ big = 255, small = 255, duration = 100 } = {}) {
    if (!isVibrationOn()) return;

    const ds = getDualSense();

    if (ds && ds.connected) {
        if (rumbleTimeout) clearTimeout(rumbleTimeout);

        ds.setRumble(big, small);

        rumbleTimeout = setTimeout(() => {
            ds.setRumble(0, 0);
            rumbleTimeout = null;
        }, duration);
        return;
    }

    // --- Repli : API Gamepad standard ---
    const gamepad = navigator.getGamepads()[0];
    if (gamepad?.vibrationActuator?.playEffect) {
        gamepad.vibrationActuator.playEffect('dual-rumble', {
            startDelay: 0,
            duration,
            weakMagnitude: small / 255,
            strongMagnitude: big / 255,
        });
    }
}
