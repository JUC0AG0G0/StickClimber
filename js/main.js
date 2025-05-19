import { getGamepadInput } from "./input.js";

function gameLoop() {
  const input = getGamepadInput();

  if (input) {
    console.log("🎮 Input reçu :", input);

    if (input.L2) console.log("Bras gauche agrippé");
    if (input.R2) console.log("Bras droit agrippé");
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();
