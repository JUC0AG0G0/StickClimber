export function triggerGamepadFeedback() {
    const gamepad = navigator.getGamepads()[0];
    if (!gamepad) return;

    if (gamepad.vibrationActuator && gamepad.vibrationActuator.playEffect) {
        gamepad.vibrationActuator.playEffect("dual-rumble", {
            startDelay: 0,
            duration: 100,
            weakMagnitude: 1.0,
            strongMagnitude: 1.0,
        });
    }
}
