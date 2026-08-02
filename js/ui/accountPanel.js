// ui/accountPanel.js
// Zone "Compte" du hub : maquette de connexion dessinée sur un panneau 3D.
// Les champs Pseudo / Mot de passe sont visuels (non éditables pour
// l'instant) ; le bouton passe par ui/auth.js -> le jour où auth.login
// parlera à un vrai backend, cette UI marchera telle quelle.

import { auth } from './auth.js';

let panel = null;
let submitBtn = null;

export function initAccountPanel({ panel: p, buttons }) {
    panel = p;
    submitBtn = buttons.submit;

    submitBtn.onClick = async () => {
        if (auth.user) await auth.logout();
        else await auth.login('Invité');
    };

    auth.onChange(render);
    render();
}

function render() {
    submitBtn.setLabel(auth.user ? 'Se déconnecter' : 'Se connecter');
    panel.redraw(draw);
}

function drawField(ctx, label, value, x, y, w) {
    ctx.font = '700 24px system-ui, sans-serif';
    ctx.fillStyle = '#111';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(label, x, y);

    ctx.lineWidth = 5;
    ctx.strokeStyle = '#111';
    ctx.beginPath();
    ctx.roundRect(x, y + 14, w, 52, 12);
    ctx.stroke();

    ctx.font = '400 26px system-ui, sans-serif';
    ctx.fillStyle = value ? '#111' : '#aaa';
    ctx.fillText(value || '…', x + 18, y + 50);
}

function draw(ctx, w, h) {
    const m = 56;
    if (auth.user) {
        ctx.font = '800 34px system-ui, sans-serif';
        ctx.fillStyle = '#111';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Connecté : ${auth.user.pseudo}`, w / 2, h / 2 - 20);
        ctx.font = '400 24px system-ui, sans-serif';
        ctx.fillStyle = '#888';
        ctx.fillText('Tes scores pourront être publiés en ligne.', w / 2, h / 2 + 30);
        return;
    }
    drawField(ctx, 'Pseudo', '', m, 84, w - 2 * m);
    drawField(ctx, 'Mot de passe', '', m, 200, w - 2 * m);
    ctx.font = '400 22px system-ui, sans-serif';
    ctx.fillStyle = '#888';
    ctx.textAlign = 'center';
    ctx.fillText('Maquette — connexion en ligne bientôt disponible', w / 2, h - 52);
}
