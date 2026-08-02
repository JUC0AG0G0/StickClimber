// core/ink.js
// Le style graphique du jeu : tout est d'un BLANC PUR, seuls les arêtes /
// contours / détails sont à l'ENCRE noire.
//
// IMPORTANT : on utilise des MeshBasicMaterial (insensibles à la lumière).
// Un matériau "standard" éclairé rend toujours des faces grisées ; en basic,
// le blanc reste #ffffff quel que soit l'éclairage. Le volume est donné
// uniquement par les traits noirs et par les ombres portées au sol
// (ShadowMaterial, voir core/scene.js).
//
//  - edgedMesh    : mesh blanc + arêtes noires (EdgesGeometry) -> boîtes, poteaux
//  - outlinedMesh : mesh blanc + silhouette noire (coque inversée) -> sphères
//
// Pour "remplir" un objet en noir (main ancrée, prise tenue), il suffit de
// passer la couleur du matériau principal à INK.

import * as THREE from 'https://unpkg.com/three@0.155.0/build/three.module.js';

export const INK = 0x111111;
export const PAPER = 0xffffff;

export function paperMaterial() {
    return new THREE.MeshBasicMaterial({ color: PAPER });
}

export function inkLineMaterial() {
    return new THREE.LineBasicMaterial({ color: INK });
}

/** Mesh blanc pur dont les arêtes vives sont soulignées à l'encre. */
export function edgedMesh(geometry, { material } = {}) {
    const mesh = new THREE.Mesh(geometry, material ?? paperMaterial());
    mesh.castShadow = true;
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), inkLineMaterial());
    mesh.add(edges); // enfant : suit toutes les transformations du mesh
    return mesh;
}

/** Mesh blanc pur avec un contour de silhouette (coque inversée). */
export function outlinedMesh(geometry, { outline = 1.12, material } = {}) {
    const mesh = new THREE.Mesh(geometry, material ?? paperMaterial());
    mesh.castShadow = true;
    const hull = new THREE.Mesh(
        geometry,
        new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide })
    );
    hull.scale.setScalar(outline);
    mesh.add(hull);
    return mesh;
}
