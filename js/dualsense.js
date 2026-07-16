// dualsense.js
// Pilotage des gâchettes adaptatives (et vibration/LED) d'une manette PS5 via WebHID.
// L'entrée du jeu continue de passer par l'API Gamepad ; ce module ne fait que
// ENVOYER des ordres à la manette (output report). Les deux cohabitent sans souci.
//
// Prérequis : Chrome / Edge, contexte sécurisé (https ou localhost).
// Le mode USB est le plus fiable. Le Bluetooth (report 0x31 + CRC32) est fourni
// mais marqué "expérimental" — branche en USB si tu veux être tranquille.
//
// Générateurs d'effets portés depuis le TriggerEffectGenerator de Nielk1
// (référence communautaire) — à vérifier sur ta manette.

const SONY_VID = 0x054c;
const DUALSENSE_PIDS = [0x0ce6, 0x0df2]; // DualSense, DualSense Edge

// --- CRC32 (nécessaire uniquement pour le Bluetooth) ---
const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
        t[n] = c >>> 0;
    }
    return t;
})();
function crc32(bytes) {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
}

export class DualSense {
    constructor() {
        this.device = null;
        this.connected = false;
        this.connectionType = 'usb';
        // Chaque effet = 1 octet de mode + 10 octets de paramètres.
        this.left = new Uint8Array(11);
        this.right = new Uint8Array(11);
        this.lightbar = [0, 90, 255]; // bleu par défaut
        this.rumble = [0, 0];         // [gros moteur (gauche), petit moteur (droite)]
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

        // Détection USB / Bluetooth via les output reports disponibles.
        const outIds = new Set();
        for (const col of device.collections) {
            for (const r of (col.outputReports || [])) outIds.add(r.reportId);
        }
        this.connectionType = outIds.has(0x02) ? 'usb' : (outIds.has(0x31) ? 'bluetooth' : 'usb');

        this.connected = true;
        await this.flush();
        return this;
    }

    async disconnect() {
        if (this.device && this.device.opened) await this.device.close();
        this.connected = false;
    }

    // --- Effets prêts à l'emploi (side = 'left' | 'right' | 'both') ---
    off(side = 'both') { return this._apply(side, DualSense.off()); }
    // Résistance continue à partir de `position` (0-9), intensité `strength` (1-8).
    feedback(side, position, strength) { return this._apply(side, DualSense.feedback(position, strength)); }
    // Détente d'arme : dure de `start` à `end` puis "clic". start 2-7, end 3-8, strength 1-8.
    weapon(side, start, end, strength) { return this._apply(side, DualSense.weapon(start, end, strength)); }
    // Vibration type mitraillette. position 0-9, amplitude 1-8, frequency en Hz.
    vibration(side, position, amplitude, frequency) { return this._apply(side, DualSense.vibration(position, amplitude, frequency)); }

    setLightbar(r, g, b) { this.lightbar = [r, g, b]; return this.flush(); }
    setRumble(big, small) { this.rumble = [big, small]; return this.flush(); }

    _apply(side, block) {
        if (side === 'left' || side === 'both') this.left.set(block);
        if (side === 'right' || side === 'both') this.right.set(block);
        return this.flush();
    }

    async flush() {
        if (!this.connected || !this.device) return;
        try {
            if (this.connectionType === 'bluetooth') await this._flushBluetooth();
            else await this._flushUsb();
        } catch (e) {
            console.warn('DualSense flush échoué :', e);
        }
    }

    _fillCommon(data, off) {
        // off = décalage : 0 en USB, +1 en Bluetooth (à cause de l'octet de séquence).
        data[off + 0] = 0xff; // flag0 : rumble + haptique + gâchettes
        data[off + 1] = 0xf7; // flag1 : LED + micro, etc.
        data[off + 2] = this.rumble[1];
        data[off + 3] = this.rumble[0];
        // Gâchette droite @ +10, gâchette gauche @ +21 (mode + 10 octets chacune).
        data.set(this.right, off + 10);
        data.set(this.left, off + 21);
        // Lightbar
        data[off + 44] = this.lightbar[0];
        data[off + 45] = this.lightbar[1];
        data[off + 46] = this.lightbar[2];
    }

    async _flushUsb() {
        const data = new Uint8Array(47);
        this._fillCommon(data, 0);
        await this.device.sendReport(0x02, data);
    }

    async _flushBluetooth() {
        // Report 0x31 : un octet de séquence en tête, données décalées de +1, CRC32 en fin.
        const data = new Uint8Array(77);
        data[0] = 0x02; // tag
        this._fillCommon(data, 1);
        // CRC32 sur [0xA2, 0x31, données sauf les 4 octets de CRC]
        const crcInput = new Uint8Array(2 + 73);
        crcInput[0] = 0xa2;
        crcInput[1] = 0x31;
        crcInput.set(data.subarray(0, 73), 2);
        const crc = crc32(crcInput);
        data[73] = crc & 0xff;
        data[74] = (crc >>> 8) & 0xff;
        data[75] = (crc >>> 16) & 0xff;
        data[76] = (crc >>> 24) & 0xff;
        await this.device.sendReport(0x31, data);
    }

    // ================== Générateurs d'effets (statiques) ==================
    // Chacun renvoie un bloc de 11 octets : [mode, p0..p9].

    static off() {
        return new Uint8Array(11); // mode 0x00, tout à zéro
    }

    static feedback(position, strength) {
        const out = new Uint8Array(11);
        if (position > 9 || strength <= 0 || strength > 8) return out;
        const force = (strength - 1) & 0x07;
        let forceZones = 0, activeZones = 0;
        for (let i = position; i < 10; i++) {
            forceZones |= force << (3 * i);
            activeZones |= 1 << i;
        }
        out[0] = 0x21;
        out[1] = activeZones & 0xff;
        out[2] = (activeZones >> 8) & 0xff;
        out[3] = forceZones & 0xff;
        out[4] = (forceZones >>> 8) & 0xff;
        out[5] = (forceZones >>> 16) & 0xff;
        out[6] = (forceZones >>> 24) & 0xff;
        return out;
    }

    static weapon(start, end, strength) {
        const out = new Uint8Array(11);
        if (start < 2 || start > 7 || end <= start || end > 8 || strength <= 0 || strength > 8) return out;
        const zones = (1 << start) | (1 << end);
        out[0] = 0x25;
        out[1] = zones & 0xff;
        out[2] = (zones >> 8) & 0xff;
        out[3] = (strength - 1) & 0x07;
        return out;
    }

    static vibration(position, amplitude, frequency) {
        const out = new Uint8Array(11);
        if (position > 9 || amplitude <= 0 || amplitude > 8 || frequency <= 0) return out;
        const amp = (amplitude - 1) & 0x07;
        let ampZones = 0, activeZones = 0;
        for (let i = position; i < 10; i++) {
            ampZones |= amp << (3 * i);
            activeZones |= 1 << i;
        }
        out[0] = 0x26;
        out[1] = activeZones & 0xff;
        out[2] = (activeZones >> 8) & 0xff;
        out[3] = ampZones & 0xff;
        out[4] = (ampZones >>> 8) & 0xff;
        out[5] = (ampZones >>> 16) & 0xff;
        out[6] = (ampZones >>> 24) & 0xff;
        out[9] = frequency & 0xff;
        return out;
    }
}