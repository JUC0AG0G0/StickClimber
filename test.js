const VENDOR_SONY = 0x054C;
const PRODUCT_DUALSENSE = 0x0CE6;
const PRODUCT_DUALSENSE_EDGE = 0x0DF2;

// Mode "Weapon" (0x02) : résistance puis point dur
const TRIGGER_MODE_WEAPON = 0x02;

let device = null;

async function connectDualSense() {
  const devices = await navigator.hid.requestDevice({
    filters: [
      { vendorId: VENDOR_SONY, productId: PRODUCT_DUALSENSE },
      { vendorId: VENDOR_SONY, productId: PRODUCT_DUALSENSE_EDGE },
    ],
  });

  if (!devices.length) return null;

  device = devices[0];
  if (!device.opened) {
    await device.open();
  }

  console.log("DualSense connectée avec succès !");
  
  // On applique l'effet avec un léger délai pour laisser la connexion s'établir
  setTimeout(() => {
    applyTriggerEffect();
  }, 500);

  return device;
}

async function applyTriggerEffect(startPos = 100, endPos = 150, force = 255) {
  if (!device) return;

  // En USB, le report ID 0x02 attend 47 octets de données derrière lui
  const report = new Uint8Array(47);

  // --- FLAGS DE VALIDATION ---
  // report[0] permet d'activer les moteurs, LEDs, gâchettes, etc.
  // 0x04 (bit 2) = Activer retour d'effort R2
  // 0x08 (bit 3) = Activer retour d'effort L2
  report[0] = 0x04 | 0x08; 

  report[1] = 0x00;

  report[10] = TRIGGER_MODE_WEAPON; // Mode d'effet
  report[11] = startPos;            // Position de début de force (0-255)
  report[12] = endPos;              // Position de fin (0-255)
  report[13] = force;               // Force exercée

  report[21] = TRIGGER_MODE_WEAPON;
  report[22] = startPos;
  report[23] = endPos;
  report[24] = force;

  try {
    // 0x02 est le Report ID pour l'USB
    await device.sendReport(0x02, report);
    console.log("Effet envoyé aux gâchettes !");
  } catch (error) {
    console.error("Erreur lors de l'envoi du rapport HID :", error);
  }
}

async function disableTriggerEffect() {
  if (!device) return;
  
  const report = new Uint8Array(47);
  report[0] = 0x04 | 0x08; // On cible toujours les deux gâchettes
  report[10] = 0x00; // Mode 0x00
  report[21] = 0x00; // Mode 0x00

  try {
    await device.sendReport(0x02, report);
    console.log("Effet des gâchettes désactivé.");
  } catch (error) {
    console.error(error);
  }
}

// Événements boutons
document.getElementById('connect-btn')?.addEventListener('click', () => {
  connectDualSense().catch(console.error);
});

document.getElementById('disconnect-btn')?.addEventListener('click', () => {
  disableTriggerEffect().catch(console.error);
});