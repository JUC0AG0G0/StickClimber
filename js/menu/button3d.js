// menu/button3d.js
// Bouton VIVANT DANS LA SCÈNE 3D : un plan portant une pancarte dessinée au
// canvas (blanc cerclé d'encre), qui s'inverse (fond noir, texte blanc) au
// survol souris ou au focus manette. Cliquable via raycasting (menuNav.js).
//
// Formes : 'pill' (pancarte arrondie), 'arrowLeft' / 'arrowRight' (panneau
// fléché, pour le poteau indicateur de l'accueil).
//
// Chaque bouton porte SOIT une `action` (string interprétée par menuNav :
// 'play', 'back', nom de zone...), SOIT un `onClick` custom (toggles des
// Paramètres, connexion du Compte...).

import * as THREE from 'https://unpkg.com/three@0.155.0/build/three.module.js';

const INK = '#111111';
const PAPER = '#ffffff';

function drawSign(canvas, { label, shape, invert }) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const s = Math.max(6, Math.round(h * 0.08));   // épaisseur du trait
    const m = s;                                    // marge
    const tip = Math.round(h * 0.5);                // longueur de la pointe

    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = s;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = INK;
    ctx.fillStyle = invert ? INK : PAPER;

    ctx.beginPath();
    if (shape === 'arrowRight') {
        ctx.moveTo(m, m);
        ctx.lineTo(w - m - tip, m);
        ctx.lineTo(w - m, h / 2);
        ctx.lineTo(w - m - tip, h - m);
        ctx.lineTo(m, h - m);
        ctx.closePath();
    } else if (shape === 'arrowLeft') {
        ctx.moveTo(w - m, m);
        ctx.lineTo(m + tip, m);
        ctx.lineTo(m, h / 2);
        ctx.lineTo(m + tip, h - m);
        ctx.lineTo(w - m, h - m);
        ctx.closePath();
    } else {
        ctx.roundRect(m, m, w - 2 * m, h - 2 * m, (h - 2 * m) / 2);
    }
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = invert ? PAPER : INK;
    ctx.font = `700 ${Math.round(h * 0.4)}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const dx = shape === 'arrowRight' ? -tip / 2 : shape === 'arrowLeft' ? tip / 2 : 0;
    ctx.fillText(label, w / 2 + dx, h / 2 + 2);
}

export class Button3D {
    constructor(label, { width = 1.4, height = 0.34, shape = 'pill', action = null, onClick = null } = {}) {
        this.label = label;
        this.shape = shape;
        this.action = action;
        this.onClick = onClick;
        this.hovered = false;

        const canvasW = 512;
        const canvasH = Math.max(64, Math.round(512 * height / width));
        this._normalCanvas = document.createElement('canvas');
        this._normalCanvas.width = canvasW;
        this._normalCanvas.height = canvasH;
        this._hoverCanvas = document.createElement('canvas');
        this._hoverCanvas.width = canvasW;
        this._hoverCanvas.height = canvasH;

        this._normalTex = new THREE.CanvasTexture(this._normalCanvas);
        this._hoverTex = new THREE.CanvasTexture(this._hoverCanvas);
        this._normalTex.anisotropy = 8;
        this._hoverTex.anisotropy = 8;

        this._render();

        this.mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(width, height),
            new THREE.MeshBasicMaterial({ map: this._normalTex, transparent: true })
        );
        this.mesh.userData.button = this; // retrouvé par le raycast de menuNav
    }

    _render() {
        drawSign(this._normalCanvas, { label: this.label, shape: this.shape, invert: false });
        drawSign(this._hoverCanvas, { label: this.label, shape: this.shape, invert: true });
        this._normalTex.needsUpdate = true;
        this._hoverTex.needsUpdate = true;
    }

    /** Survol souris OU focus manette : la pancarte s'inverse. */
    setHover(on) {
        if (on === this.hovered) return;
        this.hovered = on;
        this.mesh.material.map = on ? this._hoverTex : this._normalTex;
        this.mesh.material.needsUpdate = true;
    }

    /** Change le texte (ex : "Gâchettes : Actif") sans recréer le bouton. */
    setLabel(label) {
        this.label = label;
        this._render();
    }
}
