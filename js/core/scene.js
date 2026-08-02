// core/scene.js
// Scène "feuille de papier" : fond, sol et objets d'un BLANC PUR (matériaux
// basic, cf. core/ink.js). La lumière ne sert plus qu'à UNE chose : projeter
// des ombres douces sur un "tapis d'ombres" transparent (ShadowMaterial)
// posé sur le sol blanc. Résultat : du #ffffff partout, des traits d'encre,
// et de fines ombres pour ancrer les objets.

import * as THREE from 'https://unpkg.com/three@0.155.0/build/three.module.js';

// Hauteur du "sol" pour le joueur (les pieds touchent le plan y=0).
export const GROUND_Y = -0.28;

export function createScene(canvas) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#ffffff');
    // Le brouillard blanc fond les traits lointains dans la page.
    scene.fog = new THREE.Fog('#ffffff', 13, 32);

    const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Cette lumière n'éclaire "visuellement" rien (matériaux basic) :
    // elle n'existe que pour la carte d'ombres.
    const sun = new THREE.DirectionalLight(0xffffff, 1);
    sun.position.set(5, 10, 7);
    sun.castShadow = true;
    sun.shadow.camera.left = -12;
    sun.shadow.camera.right = 12;
    sun.shadow.camera.top = 14;
    sun.shadow.camera.bottom = -6;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 40;
    scene.add(sun);

    // Sol : plan blanc PUR…
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(80, 80),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // …surmonté d'un tapis d'ombres transparent : seules les ombres
    // s'impriment dessus, le blanc du sol reste intact partout ailleurs.
    const shadowCatcher = new THREE.Mesh(
        new THREE.PlaneGeometry(80, 80),
        new THREE.ShadowMaterial({ opacity: 0.1 })
    );
    shadowCatcher.rotation.x = -Math.PI / 2;
    shadowCatcher.position.y = 0.001;
    shadowCatcher.receiveShadow = true;
    scene.add(shadowCatcher);

    return { scene, camera, renderer };
}
