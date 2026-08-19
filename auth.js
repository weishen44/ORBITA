/* ==========================================================================
   Orbita — authentification
   Dans une version de production, ces identifiants seraient émis par un
   administrateur côté serveur. Ici, pour la démo, un compte client est
   pré-provisionné avec accès aux trois domaines métier.
   ========================================================================== */
const Auth = (() => {
  const ACCOUNTS = [
    { username: 'demo', password: 'demo2026', displayName: 'Client Démo', initials: 'CD', domains: ['stock', 'immo', 'auto'] },
    { username: 'sophie.martin', password: 'orbita123', displayName: 'Sophie Martin', initials: 'SM', domains: ['stock', 'immo', 'auto'] },
  ];

  function login(username, password) {
    const account = ACCOUNTS.find(
      a => a.username.toLowerCase() === username.trim().toLowerCase() && a.password === password
    );
    if (!account) return { ok: false, error: "Identifiant ou mot de passe incorrect." };
    const session = { username: account.username, displayName: account.displayName, initials: account.initials, domains: account.domains, loginAt: Date.now() };
    Store.set(Store.KEYS.session, session);
    return { ok: true, session };
  }

  function logout() {
    localStorage.removeItem(Store.KEYS.session);
  }

  function currentSession() {
    return Store.get(Store.KEYS.session, null);
  }

  return { login, logout, currentSession };
})();
