// dualsense.js
// Pilotage minimal des gâchettes adaptatives (+ vibration, + LED) d'une
// manette PS5 via WebHID.
//
// Encodage confirmé fonctionnel : mode "Weapon" (0x02), avec startPos /
// endPos / force écrits directement (0-255) dans le report USB — c'est
// exactement l'encodage de ton fichier de test qui marche.
//
// USB uniquement (le Bluetooth demande un report 0x31 + CRC32 différent ;
// dis-moi si tu en as besoin, je l'ajouterai à part).

const SONY_VID = 0x054c;
const DUALSENSE_PIDS = [0x0ce6, 0x0df2]; // DualSense, DualSense Edge

export const TRIGGER_MODE_OFF = 0x00;
export const TRIGGER_MODE_WEAPON = 0x02; // normal -> résistance -> point dur -> zone molle

export class DualSense {
    constructor() {
        this.device = null;
        this.connected = false;

        // Effet courant de chaque gâchette : { mode, startPos, endPos, force }
        this.leftTrigger = { mode: TRIGGER_MODE_OFF, startPos: 0, endPos: 0, force: 0 };
        this.rightTrigger = { mode: TRIGGER_MODE_OFF, startPos: 0, endPos: 0, force: 0 };

        this.rumble = { big: 0, small: 0 }; // gros moteur (gauche), petit moteur (droite)
        this.lightbar = { r: 0, g: 90, b: 255 };
    }

    async connect() {
        if (!navigator.hid) throw new Error('WebHID indisponible (Chrome/Edge en https requis)');

        const devices = await navigator.hid.requestDevice({
            filters: DUALSENSE_PIDS.map((productId) => ({ vendorId: SONY_VID, productId })),
        });
        const device = devices[0];
        if (!device) throw new Error('Aucune manette sélectionnée');

        if (!device.opened) await device.open();

        this.device = device;
        this.connected = true;

        await this.flush();
        return this;
    }

    async disconnect() {
        if (this.device && this.device.opened) await this.device.close();
        this.connected = false;
        this.device = null;
    }

    // ----------------------- Gâchettes -----------------------
    // side: 'left' | 'right' | 'both'

    setTriggerOff(side = 'both') {
        this._setTrigger(side, { mode: TRIGGER_MODE_OFF, startPos: 0, endPos: 0, force: 0 });
        return this.flush();
    }

    // startPos / endPos / force en 0-255, sur la course complète de la gâchette.
    // Ex : startPos=200, endPos=220, force=255
    //   -> course normale jusqu'à 200, point dur entre 200 et 220,
    //      puis petite zone molle de 220 à 255.
    setTriggerWeapon(side = 'both', startPos = 100, endPos = 150, force = 255) {
        this._setTrigger(side, { mode: TRIGGER_MODE_WEAPON, startPos, endPos, force });
        return this.flush();
    }

    _setTrigger(side, effect) {
        if (side === 'left' || side === 'both') this.leftTrigger = effect;
        if (side === 'right' || side === 'both') this.rightTrigger = effect;
    }

    // ----------------------- Vibration / LED -----------------------
    setRumble(big, small) {
        this.rumble = { big, small };
        return this.flush();
    }

    setLightbar(r, g, b) {
        this.lightbar = { r, g, b };
        return this.flush();
    }

    // ----------------------- Envoi du report (USB) -----------------------
    async flush() {
        if (!this.connected || !this.device) return;

        const report = new Uint8Array(47);

        // validFlag0 : bit0+1 = moteurs de vibration, bit2 = R2, bit3 = L2
        report[0] = 0x01 | 0x02 | 0x04 | 0x08;
        report[1] = 0x00; // validFlag1 : LED/mic non touchés ici

        report[2] = this.rumble.small; // moteur droit (petit)
        report[3] = this.rumble.big;   // moteur gauche (gros)

        // Gâchette droite (R2) @ offset 10
        report[10] = this.rightTrigger.mode;
        report[11] = this.rightTrigger.startPos;
        report[12] = this.rightTrigger.endPos;
        report[13] = this.rightTrigger.force;

        // Gâchette gauche (L2) @ offset 21
        report[21] = this.leftTrigger.mode;
        report[22] = this.leftTrigger.startPos;
        report[23] = this.leftTrigger.endPos;
        report[24] = this.leftTrigger.force;

        report[44] = this.lightbar.r;
        report[45] = this.lightbar.g;
        report[46] = this.lightbar.b;

        try {
            await this.device.sendReport(0x02, report);
        } catch (e) {
            console.warn('DualSense flush échoué :', e);
        }
    }
}