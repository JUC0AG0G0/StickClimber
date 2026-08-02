// ui/legalPanel.js
// Contenu de la plaque "Mentions légales" : texte SCROLLABLE (molette,
// dpad/stick manette, barre de défilement dessinée) avec des LIENS
// cliquables directement sur le panneau 3D.
//
// Comment ça marche : menuNav raycast le mesh du panneau ; l'intersection
// fournit les coordonnées UV, converties ici en pixels canvas (en tenant
// compte du scroll) pour retrouver le lien sous le curseur.
//
// Pour éditer le contenu : modifier CONTENT ci-dessous.
//   { h: '...' }                  -> titre de section
//   { t: '...' }                  -> ligne de texte
//   { link: '...', url: '...' }   -> lien cliquable (souligné)

const CONTENT = [
    { h: 'ÉDITEUR' },
    { t: 'StickClimber — jeu développé par Jules Corneille.' },
    { link: 'Me contacter par email', url: 'mailto:julescorneill3@gmail.com' },
    { h: 'HÉBERGEMENT' },
    { t: '[OVH, adresse de l’hébergeur].' },
    { h: 'DONNÉES PERSONNELLES' },
    { t: 'Aucune donnée n’est collectée ni transmise.' },
    { t: 'Les scores du classement sont stockés' },
    { t: 'uniquement dans ce navigateur (localStorage).' },
    { h: 'MANETTE' },
    { t: 'La DualSense est pilotée via WebHID,' },
    { t: 'uniquement après une action explicite.' },
    { h: 'TECHNOLOGIES' },
    { link: 'three.js (licence MIT)', url: 'https://threejs.org' },
    { link: 'Code source du jeu', url: 'https://github.com/JUCOAGOGO/stickclimber' },
];

const PAD_X = 46;      // marge gauche du texte
const PAD_TOP = 42;    // marge haute (sous le cadre)
const PAD_BOTTOM = 34;
const CLIP = 26;       // zone de découpe (juste à l'intérieur du cadre)

let panel = null;
let scrollY = 0;
let maxScroll = 0;
let hoveredLink = -1;
let linkRects = []; // rectangles des liens en coordonnées CONTENU (avant scroll)

export function initLegalPanel({ panel: p }) {
    panel = p;
    panel.mesh.userData.pointerHandler = handlePointer;
    redraw();
    return { scrollBy, redraw };
}

/** Molette / dpad : décale le texte et redessine. */
function scrollBy(delta) {
    const next = Math.max(0, Math.min(scrollY + delta * 0.6, maxScroll));
    if (next !== scrollY) {
        scrollY = next;
        redraw();
    }
}

function redraw() {
    panel.redraw(draw);
}

function draw(ctx, w, h) {
    const innerH = h - PAD_TOP - PAD_BOTTOM;
    linkRects = [];

    ctx.save();
    ctx.beginPath();
    ctx.rect(CLIP, CLIP, w - 2 * CLIP, h - 2 * CLIP);
    ctx.clip();
    ctx.translate(0, PAD_TOP - scrollY);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    let y = 0;
    CONTENT.forEach((block, i) => {
        if (block.h) {
            y += y === 0 ? 30 : 48;
            ctx.font = '800 27px system-ui, sans-serif';
            ctx.fillStyle = '#111';
            ctx.fillText(block.h, PAD_X, y);
            y += 4;
        } else if (block.t) {
            y += 34;
            ctx.font = '400 25px system-ui, sans-serif';
            ctx.fillStyle = '#333';
            ctx.fillText(block.t, PAD_X, y);
        } else if (block.link) {
            y += 40;
            const hovered = hoveredLink === i;
            ctx.font = `${hovered ? 800 : 600} 25px system-ui, sans-serif`;
            ctx.fillStyle = '#111';
            const textWidth = ctx.measureText(block.link).width;
            ctx.fillText(block.link, PAD_X, y);
            ctx.fillRect(PAD_X, y + 6, textWidth, hovered ? 4 : 3); // soulignement
            linkRects.push({ x: PAD_X, y: y - 26, w: textWidth, h: 38, url: block.url, index: i });
        }
    });

    const totalHeight = y + 24;
    maxScroll = Math.max(0, totalHeight - innerH);
    ctx.restore();

    // Barre de défilement (dessinée, dans le style encre)
    if (maxScroll > 0) {
        const trackX = w - 36;
        const trackY = CLIP + 8;
        const trackH = h - 2 * (CLIP + 8);
        ctx.fillStyle = '#ddd';
        ctx.fillRect(trackX, trackY, 8, trackH);
        const thumbH = Math.max(46, trackH * innerH / totalHeight);
        const thumbY = trackY + (trackH - thumbH) * (scrollY / maxScroll);
        ctx.fillStyle = '#111';
        ctx.fillRect(trackX, thumbY, 8, thumbH);
    }
}

/** Appelé par menuNav avec les UV du raycast.
 *  type 'move'  -> renvoie true si un lien est sous le curseur (curseur main)
 *  type 'click' -> ouvre le lien s'il y en a un */
function handlePointer(type, uv) {
    const x = uv.x * panel.canvas.width;
    const screenY = (1 - uv.y) * panel.canvas.height;
    const contentY = screenY - PAD_TOP + scrollY;

    const hit = linkRects.find((r) =>
        x >= r.x && x <= r.x + r.w && contentY >= r.y && contentY <= r.y + r.h
    );

    if (type === 'move') {
        const index = hit ? hit.index : -1;
        if (index !== hoveredLink) {
            hoveredLink = index;
            redraw();
        }
        return !!hit;
    }
    if (type === 'click' && hit) {
        window.open(hit.url, '_blank', 'noopener');
        return true;
    }
    return false;
}
