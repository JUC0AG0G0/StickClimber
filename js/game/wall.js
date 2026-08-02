// game/wall.js
// Génération procédurale infinie du mur d'escalade.
//
// Principe : la paroi est découpée en "sections" (chunks) de hauteur fixe.
// Chaque section pioche un pattern parmi un jeu fixe de dispositions de prises
// via un tirage "en sac" (bag randomizer, façon Tetris) : ordre aléatoire sans
// jamais répéter le même pattern trop de fois d'affilée.
//
// Les sections sont générées au-dessus du joueur au fur et à mesure qu'il
// grimpe, et nettoyées en dessous -> escalade infinie sans fuite mémoire.
//
// Thème "encre" : mur blanc dessiné par deux traits verticaux noirs, prises
// blanches cerclées d'un contour d'encre. Une prise tenue se REMPLIT d'encre
// (comme la main qui la tient).

import * as THREE from 'https://unpkg.com/three@0.155.0/build/three.module.js';
import { INK, PAPER } from '../core/ink.js';

// ------------------------- Réglages -------------------------
export const CHUNK_HEIGHT = 2.2;
export const GRAB_RADIUS = 0.32;

// Hauteur (monde) du bas de la toute première section, calée sur la portée
// du joueur debout (voir commentaires historiques dans le README).
export const WALL_START_Y = 1.0;

const HOLD_RADIUS = 0.09;
const CHUNKS_AHEAD = 4;
const CHUNKS_BEHIND = 2;

const WALL_COLOR = 0xffffff;
const BACKDROP_HEIGHT = 20000;

// ------------------------- Patterns -------------------------
// Prises { x, y } en coordonnées LOCALES à la section (y de 0 à CHUNK_HEIGHT).
const PATTERNS = [
    // Échelle droite
    [
        { x: -0.35, y: 0.3 },
        { x: 0.35, y: 0.85 },
        { x: -0.35, y: 1.4 },
        { x: 0.35, y: 1.95 },
    ],
    // Zigzag large
    [
        { x: -0.9, y: 0.25 },
        { x: 0.9, y: 0.75 },
        { x: -0.9, y: 1.3 },
        { x: 0.9, y: 1.85 },
    ],
    // Traversée vers la gauche
    [
        { x: 0.8, y: 0.25 },
        { x: 0.35, y: 0.75 },
        { x: -0.15, y: 1.25 },
        { x: -0.65, y: 1.75 },
    ],
    // Traversée vers la droite
    [
        { x: -0.8, y: 0.25 },
        { x: -0.35, y: 0.75 },
        { x: 0.15, y: 1.25 },
        { x: 0.65, y: 1.75 },
    ],
    // Resserré
    [
        { x: -0.18, y: 0.3 },
        { x: 0.18, y: 0.7 },
        { x: -0.18, y: 1.1 },
        { x: 0.18, y: 1.5 },
        { x: -0.18, y: 1.9 },
    ],
    // Grand écart
    [
        { x: -0.5, y: 0.2 },
        { x: 0.5, y: 1.1 },
        { x: -0.5, y: 2.0 },
    ],
];

// ------------------------- Tirage "en sac" -------------------------
function shuffledIndices(length) {
    const arr = Array.from({ length }, (_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

class PatternBag {
    constructor(count) {
        this.count = count;
        this.bag = [];
        this.lastPattern = -1;
    }

    next() {
        if (this.bag.length === 0) {
            this.bag = shuffledIndices(this.count);
            if (this.count > 1 && this.bag[0] === this.lastPattern) {
                [this.bag[0], this.bag[1]] = [this.bag[1], this.bag[0]];
            }
        }
        const index = this.bag.shift();
        this.lastPattern = index;
        return index;
    }

    reset() {
        this.bag = [];
        this.lastPattern = -1;
    }
}

// ------------------------- Mur -------------------------
export class ClimbingWall {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        scene.add(this.group);

        this.bag = new PatternBag(PATTERNS.length);
        this.chunks = new Map();

        this.holdGeometry = new THREE.SphereGeometry(HOLD_RADIUS, 12, 10);
        this.holdMaterial = new THREE.MeshBasicMaterial({ color: PAPER });
        this.holdMaterialGrabbed = new THREE.MeshBasicMaterial({ color: INK });
        // Contour de silhouette partagé (coque inversée, cf. core/ink.js).
        this.hullMaterial = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });

        // Paroi visuelle en fond (un seul mesh très haut, jamais régénéré).
        const backdrop = new THREE.Mesh(
            new THREE.PlaneGeometry(3, BACKDROP_HEIGHT),
            new THREE.MeshBasicMaterial({ color: WALL_COLOR })
        );
        backdrop.position.set(0, BACKDROP_HEIGHT / 2 - 100, -0.1);
        this.group.add(backdrop);

        // Le mur n'existe visuellement QUE par ses arêtes : deux traits
        // d'encre verticaux + un trait horizontal à sa base.
        const edgeMaterial = new THREE.MeshBasicMaterial({ color: INK });
        const edgeGeometry = new THREE.PlaneGeometry(0.045, BACKDROP_HEIGHT);
        for (const x of [-1.5, 1.5]) {
            const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
            edge.position.set(x, BACKDROP_HEIGHT / 2 - 100, -0.08);
            this.group.add(edge);
        }
        const baseline = new THREE.Mesh(new THREE.PlaneGeometry(3.045, 0.045), edgeMaterial);
        baseline.position.set(0, 0.025, -0.08);
        this.group.add(baseline);

        this.topChunkIndex = -1;
    }

    // À appeler à chaque frame avec la hauteur actuelle du joueur.
    update(playerHeight) {
        const rawIndex = Math.floor((playerHeight - WALL_START_Y) / CHUNK_HEIGHT);
        const currentChunkIndex = Math.max(0, rawIndex);

        while (this.topChunkIndex < currentChunkIndex + CHUNKS_AHEAD) {
            this.topChunkIndex++;
            this._spawnChunk(this.topChunkIndex);
        }

        const minKeepIndex = currentChunkIndex - CHUNKS_BEHIND;
        for (const [index, chunk] of this.chunks) {
            if (index < minKeepIndex) {
                this.group.remove(chunk.mesh);
                this.chunks.delete(index);
            }
        }
    }

    // Vide entièrement le mur généré et repart de zéro.
    reset() {
        for (const chunk of this.chunks.values()) {
            this.group.remove(chunk.mesh);
        }
        this.chunks.clear();
        this.topChunkIndex = -1;
        this.bag.reset();
    }

    _spawnChunk(chunkIndex) {
        const pattern = PATTERNS[this.bag.next()];
        const baseY = WALL_START_Y + chunkIndex * CHUNK_HEIGHT;

        const mesh = new THREE.Group();
        const holds = pattern.map((p) => {
            const holdMesh = new THREE.Mesh(this.holdGeometry, this.holdMaterial);
            const worldY = baseY + p.y;
            holdMesh.position.set(p.x, worldY, 0);
            holdMesh.castShadow = true;
            // Contour d'encre (silhouette) autour de la prise blanche.
            const hull = new THREE.Mesh(this.holdGeometry, this.hullMaterial);
            hull.scale.setScalar(1.3);
            holdMesh.add(hull);
            mesh.add(holdMesh);
            return { x: p.x, y: worldY, z: 0, mesh: holdMesh, grabbedBy: null };
        });

        this.group.add(mesh);
        this.chunks.set(chunkIndex, { holds, mesh });
    }

    _allHolds() {
        const all = [];
        for (const chunk of this.chunks.values()) all.push(...chunk.holds);
        return all;
    }

    findGrabbableHold(handPosition, excludeHold = null) {
        let best = null;
        let bestDist = GRAB_RADIUS;
        for (const hold of this._allHolds()) {
            if (hold.grabbedBy || hold === excludeHold) continue;
            const dx = hold.x - handPosition.x;
            const dy = hold.y - handPosition.y;
            const dz = hold.z - (handPosition.z || 0);
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (dist < bestDist) {
                best = hold;
                bestDist = dist;
            }
        }
        return best;
    }

    grab(hold, side) {
        if (!hold) return;
        hold.grabbedBy = side;
        hold.mesh.material = this.holdMaterialGrabbed;
    }

    release(hold) {
        if (!hold) return;
        hold.grabbedBy = null;
        hold.mesh.material = this.holdMaterial;
    }
}
