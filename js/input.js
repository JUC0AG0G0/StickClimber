let connectedGamepad = null;

function showGamepadPopup(message) {
  let popup = document.getElementById("gamepad-popup");
  if (!popup) {
    popup = document.createElement("div");
    popup.id = "gamepad-popup";
    popup.style.position = "fixed";
    popup.style.top = "50%";
    popup.style.left = "50%";
    popup.style.transform = "translate(-50%, -50%)";
    popup.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    popup.style.color = "white";
    popup.style.padding = "20px 30px";
    popup.style.fontSize = "18px";
    popup.style.borderRadius = "12px";
    popup.style.zIndex = 1000;
    popup.style.textAlign = "center";
    popup.innerText = message;
    document.body.appendChild(popup);
  } else {
    popup.innerText = message;
    popup.style.display = "block";
  }
}

function hideGamepadPopup() {
  const popup = document.getElementById("gamepad-popup");
  if (popup) popup.style.display = "none";
}

window.addEventListener("gamepadconnected", (event) => {
  connectedGamepad = event.gamepad;
  hideGamepadPopup();
});

window.addEventListener("gamepaddisconnected", (event) => {
  if (connectedGamepad && connectedGamepad.index === event.gamepad.index) {
    connectedGamepad = null;
    showGamepadPopup("🕹️ Manette déconnectée !");
  }
});

export function getGamepadInput() {
  if (!connectedGamepad) {
    showGamepadPopup("🕹️ Veuillez connecter une manette !");
    return null;
  }

  const gamepads = navigator.getGamepads();
  const gp = gamepads[connectedGamepad.index];
  if (!gp) return null;

  hideGamepadPopup();

  return {
    leftStick: {
      x: gp.axes[0] || 0,
      y: gp.axes[1] || 0
    },
    rightStick: {
      x: gp.axes[2] || 0,
      y: gp.axes[3] || 0
    },
    L2: gp.buttons[6]?.pressed || false,
    R2: gp.buttons[7]?.pressed || false
  };
}
