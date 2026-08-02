// ui/auth.js
// Service d'authentification FACTICE : toute l'UI du menu Compte passe par
// cette interface, il n'y aura donc que ce fichier à modifier pour brancher
// un vrai backend plus tard (fetch vers ton API, tokens, etc.).

let currentUser = null;
const listeners = new Set();

function emit() {
    for (const cb of listeners) cb(currentUser);
}

export const auth = {
    get user() { return currentUser; },

    /** TODO backend : POST /login { pseudo, password } -> token + profil. */
    async login(pseudo = 'Invité', _password = '') {
        currentUser = { pseudo };
        emit();
        return currentUser;
    },

    /** TODO backend : invalider le token côté serveur. */
    async logout() {
        currentUser = null;
        emit();
    },

    /** S'abonner aux changements d'état ; renvoie une fonction de désabonnement. */
    onChange(cb) {
        listeners.add(cb);
        return () => listeners.delete(cb);
    },
};
