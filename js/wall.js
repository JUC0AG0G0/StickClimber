// wall.js
// Génération procédurale infinie du mur d'escalade.
//
// Principe : la paroi est découpée en "sections" (chunks) de hauteur fixe.
// Chaque section pioche un pattern parmi un jeu fixe de dispositions de prises
// (comme les obstacles toujours identiques de Subway Surfers), au moyen d'un
// tirage "en sac" (bag randomizer, façon Tetris) : on mélange tous les indices
// de patterns, on les distribue un par un, et on ne remélange un nouveau sac
// que lorsque l'ancien est épuisé. Ça donne un ordre aléatoire sans jamais
// répéter le même pattern trop de fois d'affilée.
//
// Les sections sont générées au-dessus du joueur au fur et à mesure qu'il
// grimpe, et nettoyées en dessous -> escalade infinie sans fuite mémoire.
//
// Ce module est autonome : il ne connaît rien de Player, il expose juste une
// API pour (1) le faire avancer à chaque frame selon la hauteur du joueur et
// (2) chercher/agripper/relâcher une prise à partir d'une position de main.

import * as THREE from 'https://unpkg.com/three@0.155.0/build/three.module.js';

// ------------------------- Réglages -------------------------
export const CHUNK_HEIGHT = 2.2;   // hauteur en unités monde d'une section
export const GRAB_RADIUS = 0.32;   // distance main <-> prise tolérée pour agripper

// Hauteur (monde) du bas de la toute première section. Calé sur la portée
// réelle du joueur debout : épaules à ~1.92, bras de 0.9 -> portée verticale
// utile entre ~1.0 et ~2.8. Sans ce décalage, les premières prises (posées à
// partir de y=0) seraient hors de portée dès le lancement de la partie.
export const WALL_START_Y = 1.0;

const HOLD_RADIUS = 0.09;          // rayon visuel d'une prise
const CHUNKS_AHEAD = 4;            // nb de sections toujours prêtes au-dessus du joueur
const CHUNKS_BEHIND = 2;           // nb de sections gardées sous le joueur avant nettoyage

const HOLD_COLOR = 0xff5a36;
const HOLD_GRABBED_COLOR = 0x4dd0a0;
const WALL_COLOR = 0x4b5563;
const BACKDROP_HEIGHT = 20000;      // très haut : pas besoin de le régénérer par section

// ------------------------- Patterns -------------------------
// Chaque pattern est une liste de prises { x, y } en coordonnées LOCALES à la
// section : x = décalage horizontal, y = hauteur depuis le bas de la section
// (0 à CHUNK_HEIGHT). N'importe quelle main peut agripper n'importe quelle
// prise ; il n'y a pas de contrainte gauche/droite figée.
const PATTERNS = [
    // Échelle droite : alternance régulière gauche/droite
    [
        { x: -0.35, y: 0.3 },
        { x: 0.35, y: 0.85 },
        { x: -0.35, y: 1.4 },
        { x: 0.35, y: 1.95 },
    ],
    // Zigzag large : grands écarts latéraux
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
    // Resserré : prises proches du centre, alternance plus courte
    [
        { x: -0.18, y: 0.3 },
        { x: 0.18, y: 0.7 },
        { x: -0.18, y: 1.1 },
        { x: 0.18, y: 1.5 },
        { x: -0.18, y: 1.9 },
    ],
    // Grand écart : peu de prises, grands intervalles verticaux
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
            // Évite que le dernier pattern d'un sac soit le même que le premier du suivant.
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
        this.chunks = new Map(); // index de section -> { holds: [...], mesh: Group }

        this.holdGeometry = new THREE.SphereGeometry(HOLD_RADIUS, 12, 10);
        this.holdMaterial = new THREE.MeshStandardMaterial({ color: HOLD_COLOR });
        this.holdMaterialGrabbed = new THREE.MeshStandardMaterial({ color: HOLD_GRABBED_COLOR });

        // Paroi visuelle en fond (un seul mesh très haut, jamais régénéré :
        // il est uniforme donc pas besoin de le découper par section). Le bord
        // bas est volontairement descendu sous le sol pour ne jamais laisser
        // de trou visible au démarrage.
        const backdrop = new THREE.Mesh(
            new THREE.PlaneGeometry(3, BACKDROP_HEIGHT),
            new THREE.MeshStandardMaterial({ color: WALL_COLOR })
        );
        backdrop.position.set(0, BACKDROP_HEIGHT / 2 - 100, -0.1);
        backdrop.receiveShadow = true;
        this.group.add(backdrop);

        this.topChunkIndex = -1;
    }

    // À appeler à chaque frame avec la hauteur actuelle du joueur (player.group.position.y).
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

    // Vide entièrement le mur généré et repart de zéro (à appeler quand la
    // partie redémarre, pour ne pas garder les prises de la tentative précédente).
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

    // Cherche la prise agrippable la plus proche d'une position de main
    // (objet {x, y, z}), dans le rayon GRAB_RADIUS, en ignorant les prises
    // déjà tenues par une main.
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