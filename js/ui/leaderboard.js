// ui/leaderboard.js
// Classement local (localStorage) : sauvegarde des 10 meilleurs scores +
// dessin de la liste sur le panneau 3D (menu/panel3d.js).

const LB_KEY = 'stickclimber_scores';

function loadScores() {
    try { return JSON.parse(localStorage.getItem(LB_KEY)) || []; }
    catch { return []; }
}

export function saveScore(score) {
    if (!score || score <= 0) return;
    const scores = loadScores();
    scores.push({ score, date: Date.now() });
    scores.sort((a, b) => b.score - a.score);
    localStorage.setItem(LB_KEY, JSON.stringify(scores.slice(0, 10)));
}

/** Contenu du panneau Classement (appelé via panel.redraw). */
export function drawLeaderboard(ctx, w, h) {
    const scores = loadScores().slice(0, 8);
    ctx.fillStyle = '#111';

    if (!scores.length) {
        ctx.font = '400 30px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#888';
        ctx.fillText("Aucun score pour l'instant", w / 2, h / 2);
        return;
    }

    const top = 78;
    const step = (h - top - 40) / 8;
    ctx.textBaseline = 'middle';
    scores.forEach((s, i) => {
        const y = top + i * step;
        ctx.font = '400 30px system-ui, sans-serif';
        ctx.fillStyle = '#888';
        ctx.textAlign = 'left';
        ctx.fillText(`#${i + 1}`, 64, y);
        ctx.font = '800 34px system-ui, sans-serif';
        ctx.fillStyle = '#111';
        ctx.textAlign = 'right';
        ctx.fillText(String(s.score), w - 64, y);
        // Trait pointillé entre le rang et le score.
        ctx.save();
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 3;
        ctx.setLineDash([2, 10]);
        ctx.beginPath();
        ctx.moveTo(130, y);
        ctx.lineTo(w - 130 - ctx.measureText(String(s.score)).width, y);
        ctx.stroke();
        ctx.restore();
    });
}
