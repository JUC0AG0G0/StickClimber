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
  createGamepadVisual();
  requestAnimationFrame(pollGamepad);
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

function createJoystickCanvas(id, label) {
  const container = document.createElement("div");
  container.style.display = "inline-block";
  container.style.margin = "10px";
  container.style.textAlign = "center";
  container.style.color = "#fff";

  const title = document.createElement("div");
  title.innerText = label;
  title.style.marginBottom = "5px";

  const canvas = document.createElement("canvas");
  canvas.id = id;
  canvas.width = 120;
  canvas.height = 120;
  canvas.style.border = "1px solid #555";
  canvas.style.background = "#222";
  canvas.style.borderRadius = "10px";

  container.appendChild(title);
  container.appendChild(canvas);

  return container;
}

function createGamepadVisual() {
  if (document.getElementById("gamepad-visual")) return;

  const container = document.createElement("div");
  container.id = "gamepad-visual";
  container.style.position = "fixed";
  container.style.bottom = "20px";
  container.style.left = "50%";
  container.style.transform = "translateX(-50%)";
  container.style.backgroundColor = "rgba(0,0,0,0.7)";
  container.style.padding = "20px";
  container.style.borderRadius = "15px";
  container.style.zIndex = 999;
  container.style.display = "flex";
  container.style.gap = "20px";
  container.style.justifyContent = "center";

  container.appendChild(createJoystickCanvas("left-stick-canvas", "Stick Gauche"));
  container.appendChild(createJoystickCanvas("right-stick-canvas", "Stick Droit"));

  const lrContainer = document.createElement("div");
  lrContainer.style.display = "flex";
  lrContainer.style.flexDirection = "column";
  lrContainer.style.justifyContent = "center";
  lrContainer.style.color = "#fff";
  lrContainer.style.fontFamily = "monospace";
  lrContainer.style.marginLeft = "20px";

  const l2Status = document.createElement("div");
  l2Status.id = "l2-status";
  l2Status.innerText = "L2 : False";

  const r2Status = document.createElement("div");
  r2Status.id = "r2-status";
  r2Status.innerText = "R2 : False";

  lrContainer.appendChild(l2Status);
  lrContainer.appendChild(r2Status);
  container.appendChild(lrContainer);

  document.body.appendChild(container);
}

function drawStick(canvasId, x, y) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;

  const centerX = w / 2;
  const centerY = h / 2;
  const radius = 40;

  ctx.clearRect(0, 0, w, h);

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.strokeStyle = "#999";
  ctx.lineWidth = 2;
  ctx.stroke();

  const magnitude = Math.sqrt(x * x + y * y);
  if (magnitude > 1) {
    x /= magnitude;
    y /= magnitude;
  }

  const dotX = centerX + x * radius;
  const dotY = centerY + y * radius;

  ctx.beginPath();
  ctx.arc(dotX, dotY, 6, 0, Math.PI * 2);
  ctx.fillStyle = "#00ff88";
  ctx.fill();
}

function updateGamepadVisual(input) {
  drawStick("left-stick-canvas", input.leftStick.x, input.leftStick.y);
  drawStick("right-stick-canvas", input.rightStick.x, input.rightStick.y);

  const l2 = document.getElementById("l2-status");
  const r2 = document.getElementById("r2-status");
  if (l2) l2.innerText = `L2 : ${input.L2 ? "✅" : "❌"}`;
  if (r2) r2.innerText = `R2 : ${input.R2 ? "✅" : "❌"}`;
}

function pollGamepad() {
  if (!connectedGamepad) return;

  const input = getGamepadInput();
  if (input) {
    updateGamepadVisual(input);
  }

  requestAnimationFrame(pollGamepad);
}
