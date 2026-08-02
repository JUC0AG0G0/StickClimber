// menu/panel3d.js
// Panneau d'affichage VIVANT DANS LA SCÈNE : un plan blanc encadré d'encre
// dont le contenu est dessiné au canvas (texture mise à jour à la demande).
// Sert au classement, aux paramètres (visualisation manette en temps réel),
// au compte et aux mentions légales -> plus aucun HTML dans le menu.

import * as THREE from 'https://unpkg.com/three@0.155.0/build/three.module.js';

const PX_PER_UNIT = 300; // résolution : pixels canvas par unité monde

export class Panel3D {
    constructor({ width = 2.6, height = 2.0 } = {}) {
        this.width = width;
        this.height = height;

        this.canvas = document.createElement('canvas');
        this.canvas.width = Math.round(width * PX_PER_UNIT);
        this.canvas.height = Math.round(height * PX_PER_UNIT);
        this.ctx = this.canvas.getContext('2d');

        this.texture = new THREE.CanvasTexture(this.canvas);
        this.texture.anisotropy = 8;

        this.mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(width, height),
            new THREE.MeshBasicMaterial({ map: this.texture })
        );

        this.redraw(() => {}); // fond blanc + cadre par défaut
    }

    _frame() {
        const { ctx, canvas } = this;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 14;
        ctx.strokeStyle = '#111111';
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
    }

    /** Redessine le panneau : fond + cadre, puis `fn(ctx, w, h)` pour le contenu. */
    redraw(fn) {
        this._frame();
        fn(this.ctx, this.canvas.width, this.canvas.height);
        this.texture.needsUpdate = true;
    }
}
