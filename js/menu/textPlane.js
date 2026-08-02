// menu/textPlane.js
// Petit utilitaire : un plan 3D portant du texte "peint" (canvas -> texture).
// Utilisé pour le titre sur le mur et les intitulés des panneaux du hub.

import * as THREE from 'https://unpkg.com/three@0.155.0/build/three.module.js';

export function makeTextPlane(text, { width = 3, color = '#151515', weight = 900 } = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.font = `${weight} 130px system-ui, -apple-system, "Segoe UI", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 8);

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 8;

    return new THREE.Mesh(
        new THREE.PlaneGeometry(width, width / 4),
        new THREE.MeshBasicMaterial({ map: texture, transparent: true })
    );
}
