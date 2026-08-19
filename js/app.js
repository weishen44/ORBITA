/* ==========================================================================
   Orbita — orchestration générale (routage, vues, session)
   ========================================================================== */
const App = (() => {
  const MODULES = { stock: StockModule, immo: ImmoModule, auto: AutoModule };

  const views = {};
  let sidebarOpen = false;

  function $(sel, root = document) { return root.querySelector(sel); }

  function showView(name) {
    ['login', 'domains', 'app'].forEach(v => {
      views[v].classList.toggle('hidden', v !== name);
    });
  }

  /* ---------------- Routing ---------------- */
  function parseHash() {
    const hash = location.hash.replace(/^#\/?/, '');
    const parts = hash.split('/').filter(Boolean);
    return parts;
  }

  function route() {
    const session = Auth.currentSession();
    const parts = parseHash();

    if (!session) {
      showView('login');
      return;
    }

    if (parts[0] === 'app' && parts[1] && MODULES[parts[1]] && session.domains.includes(parts[1])) {
      const domainKey = parts[1];
      const pageKey = parts[2] || 'dashboard';
      renderAppShell(domainKey, pageKey);
      showView('app');
      return;
    }

    renderDomains(session);
    showView('domains');
  }

  function navigate(domainKey, pageKey) {
    location.hash = `#/app/${domainKey}/${pageKey || 'dashboard'}`;
  }

  /* ---------------- Login ---------------- */
  function initLogin() {
    const form = $('#login-form');
    const errorBox = $('#login-error');
    const toggleBtn = $('#toggle-password');
    const passInput = $('#login-password');

    toggleBtn.addEventListener('click', () => {
      passInput.type = passInput.type === 'password' ? 'text' : 'password';
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      errorBox.classList.add('hidden');
      const username = $('#login-username').value;
      const password = passInput.value;
      const result = Auth.login(username, password);
      if (!result.ok) {
        errorBox.textContent = result.error;
        errorBox.classList.remove('hidden');
        return;
      }
      form.reset();
      location.hash = '#/domains';
      route();
    });
  }

  /* ---------------- Domain selection ---------------- */
  function renderDomains(session) {
    const container = views.domains;
    const initials = session.initials || session.displayName.slice(0, 2).toUpperCase();
    const cards = session.domains.map(key => {
      const mod = MODULES[key];
      return `
        <div class="domain-card" data-domain="${key}">
          <div class="d-icon">${mod.icon}</div>
          <div>
            <h3>${UI.escapeHtml(mod.label)}</h3>
            <p>${UI.escapeHtml(mod.description)}</p>
          </div>
          <div class="d-stat">${UI.escapeHtml(mod.homeStat())}</div>
          <div class="d-cta"><span>Accéder au module</span>${Icons.chevronRight}</div>
        </div>`;
    }).join('');

    container.innerHTML = `
      <div class="topbar">
        <div class="topbar-brand">${Icons.orbit}<span>Orbita</span></div>
        <div class="topbar-user">
          <div class="user-pill">
            <div class="avatar">${initials}</div>
            <span class="uname">${UI.escapeHtml(session.displayName)}</span>
          </div>
          <button class="btn btn-ghost btn-icon" id="domains-logout" title="Déconnexion">${Icons.logout}</button>
        </div>
      </div>
      <div class="domains-hero">
        <h1>Quel domaine souhaitez-vous gérer aujourd'hui&nbsp;?</h1>
        <p>Un seul compte, plusieurs métiers. Sélectionnez un espace pour continuer.</p>
      </div>
      <div class="domains-grid">${cards}</div>
    `;

    container.querySelectorAll('.domain-card').forEach(card => {
      card.addEventListener('click', () => navigate(card.dataset.domain, 'dashboard'));
    });
    $('#domains-logout', container).addEventListener('click', doLogout);
  }

  /* ---------------- App shell ---------------- */
  function renderAppShell(domainKey, pageKey) {
    const session = Auth.currentSession();
    const mod = MODULES[domainKey];
    const container = views.app;
    const validPage = mod.navItems.some(n => n.key === pageKey) ? pageKey : 'dashboard';
    const currentNav = mod.navItems.find(n => n.key === validPage);

    container.innerHTML = `
      <div class="sidebar" id="app-sidebar">
        <div class="sidebar-brand">${Icons.orbit}<span>Orbita</span></div>
        <div class="sidebar-domain">${mod.icon}<span>${UI.escapeHtml(mod.shortLabel)}</span></div>
        <div class="nav-section-label">Navigation</div>
        <div id="sidebar-nav"></div>
        <div class="sidebar-footer">
          <div class="nav-item" id="btn-switch-domain">${Icons.switch}<span>Changer de domaine</span></div>
          <div class="nav-item" id="btn-reset-data">${Icons.refresh}<span>Réinitialiser les données</span></div>
          <div class="nav-item" id="btn-logout">${Icons.logout}<span>Déconnexion</span></div>
        </div>
      </div>
      <div class="main-col">
        <div class="main-topbar">
          <div style="display:flex;align-items:center;gap:12px;">
            <button class="btn btn-ghost btn-icon menu-toggle" id="menu-toggle">${Icons.menu}</button>
            <div>
              <h1>${UI.escapeHtml(currentNav.label)}</h1>
              <div class="subtitle">${UI.escapeHtml(mod.label)}</div>
            </div>
          </div>
          <div class="user-pill">
            <div class="avatar">${UI.escapeHtml(session.initials)}</div>
            <span class="uname">${UI.escapeHtml(session.displayName)}</span>
          </div>
        </div>
        <div class="main-content" id="main-content"></div>
      </div>
    `;

    const navHost = $('#sidebar-nav', container);
    navHost.innerHTML = mod.navItems.map(item => `
      <div class="nav-item ${item.key === validPage ? 'active' : ''}" data-nav="${item.key}">
        ${item.icon}<span>${UI.escapeHtml(item.label)}</span>
      </div>`).join('');
    navHost.querySelectorAll('[data-nav]').forEach(el => {
      el.addEventListener('click', () => {
        navigate(domainKey, el.dataset.nav);
        closeSidebarMobile();
      });
    });

    $('#btn-switch-domain', container).addEventListener('click', () => { location.hash = '#/domains'; });
    $('#btn-reset-data', container).addEventListener('click', () => {
      UI.confirmDialog({
        title: 'Réinitialiser les données de démo ?',
        message: "Toutes les modifications apportées aux produits, biens, locataires et véhicules seront perdues et remplacées par le jeu de données d'origine.",
        confirmLabel: 'Réinitialiser',
        onConfirm: () => {
          Store.resetDemoData();
          renderAppShell(domainKey, validPage);
          UI.toast('Données de démonstration réinitialisées', 'success');
        },
      });
    });
    $('#btn-logout', container).addEventListener('click', doLogout);
    $('#menu-toggle', container).addEventListener('click', () => {
      $('#app-sidebar', container).classList.toggle('open');
    });

    mod.renderPage(validPage, $('#main-content', container));
  }

  function closeSidebarMobile() {
    const sb = document.getElementById('app-sidebar');
    if (sb) sb.classList.remove('open');
  }

  function doLogout() {
    Auth.logout();
    location.hash = '#/login';
    route();
    UI.toast('Vous avez été déconnecté', 'info');
  }

  /* ---------------- Init ---------------- */
  function init() {
    Store.seedIfEmpty();
    views.login = document.getElementById('view-login');
    views.domains = document.getElementById('view-domains');
    views.app = document.getElementById('view-app');

    initLogin();
    window.addEventListener('hashchange', route);
    route();
  }

  return { init, navigate, MODULES };
})();

document.addEventListener('DOMContentLoaded', App.init);
