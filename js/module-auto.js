/* ==========================================================================
   Orbita — module "Achat / vente de voitures"
   ========================================================================== */
const AutoModule = (() => {
  const key = 'auto';
  const label = 'Achat / vente de voitures';
  const shortLabel = 'Véhicules';
  const icon = Icons.car;
  const description = "Gérez votre parc de véhicules, leur statut commercial et l'historique des ventes.";

  const navItems = [
    { key: 'dashboard', label: 'Tableau de bord', icon: Icons.grid },
    { key: 'vehicules', label: 'Véhicules', icon: Icons.car },
    { key: 'ventes', label: 'Ventes', icon: Icons.cash },
  ];

  function stats() {
    const vehicules = Store.get(Store.KEYS.auto_vehicules, []);
    const ventes = Store.get(Store.KEYS.auto_ventes, []);
    const disponibles = vehicules.filter(v => v.statut === 'Disponible');
    const vendus = vehicules.filter(v => v.statut === 'Vendu');
    const valeurParc = disponibles.reduce((s, v) => s + v.prix, 0);
    const chiffreAffaires = ventes.reduce((s, v) => s + v.prix, 0);
    return { vehicules, ventes, disponibles, vendus, valeurParc, chiffreAffaires };
  }

  function homeStat() {
    const { vehicules, disponibles } = stats();
    return `${vehicules.length} véhicules · ${disponibles.length} disponibles`;
  }

  function renderDashboard(container) {
    const { vehicules, ventes, disponibles, vendus, valeurParc, chiffreAffaires } = stats();
    const parMarque = [...new Set(vehicules.map(v => v.marque))].map(m => {
      const items = vehicules.filter(v => v.marque === m);
      return { m, count: items.length, valeur: items.reduce((s, v) => s + v.prix, 0) };
    }).sort((a, b) => b.valeur - a.valeur);
    const maxValeur = Math.max(1, ...parMarque.map(x => x.valeur));

    container.innerHTML = `
      <div class="stats-row">
        <div class="stat-card">
          <div class="s-top"><span class="s-label">Véhicules au catalogue</span><div class="s-icon">${Icons.car}</div></div>
          <div class="s-value">${vehicules.length}</div>
          <div class="s-delta flat">${disponibles.length} disponibles</div>
        </div>
        <div class="stat-card">
          <div class="s-top"><span class="s-label">Valeur du parc</span><div class="s-icon">${Icons.cash}</div></div>
          <div class="s-value">${UI.fmtMoney(valeurParc)}</div>
          <div class="s-delta up">Véhicules disponibles</div>
        </div>
        <div class="stat-card">
          <div class="s-top"><span class="s-label">Chiffre d'affaires ventes</span><div class="s-icon">${Icons.cash}</div></div>
          <div class="s-value">${UI.fmtMoney(chiffreAffaires)}</div>
          <div class="s-delta up">${ventes.length} transaction(s)</div>
        </div>
        <div class="stat-card">
          <div class="s-top"><span class="s-label">Véhicules vendus</span><div class="s-icon">${Icons.check}</div></div>
          <div class="s-value">${vendus.length}</div>
          <div class="s-delta flat">Sur ${vehicules.length} au total</div>
        </div>
      </div>

      <div class="two-col">
        <div class="panel">
          <div class="panel-head"><h3>Valeur du catalogue par marque</h3></div>
          <div class="bar-list">
            ${parMarque.map(x => `
              <div class="bar-row">
                <div class="bar-label">${UI.escapeHtml(x.m)}</div>
                <div class="bar-track"><div class="bar-fill" style="width:${(x.valeur / maxValeur) * 100}%"></div></div>
                <div class="bar-value">${UI.fmtMoney(x.valeur)}</div>
              </div>`).join('') || '<p style="color:var(--gray-400);font-size:13px;">Aucune donnée.</p>'}
          </div>
        </div>
        <div class="panel">
          <div class="panel-head"><h3>Ventes récentes</h3><span class="see-all" data-goto="ventes">Voir tout ${Icons.chevronRight}</span></div>
          <div class="mini-list">
            ${ventes.length ? [...ventes].reverse().slice(0, 6).map(v => `
              <div class="mini-row">
                <div class="m-icon">${Icons.cash}</div>
                <div class="m-body"><div class="m-title">${UI.escapeHtml(v.vehiculeLabel)}</div><div class="m-sub">${UI.escapeHtml(v.client)} · ${UI.fmtDate(v.date)}</div></div>
                <div class="m-end">${UI.fmtMoney(v.prix)}</div>
              </div>`).join('') : `<p style="color:var(--gray-400);font-size:13px;">Aucune vente enregistrée.</p>`}
          </div>
        </div>
      </div>
    `;
    const seeAll = container.querySelector('[data-goto="ventes"]');
    if (seeAll) seeAll.addEventListener('click', () => App.navigate('auto', 'ventes'));
  }

  function renderVehicules(container) {
    createCrudView({
      root: container,
      storageKey: Store.KEYS.auto_vehicules,
      entityLabel: 'véhicule',
      entityLabelPlural: 'véhicules',
      searchKeys: ['marque', 'modele'],
      emptyIcon: Icons.car,
      defaultsForNew: { statut: 'Disponible', annee: new Date().getFullYear(), km: 0, prix: 0 },
      columns: [
        { key: 'marque', label: 'Marque', strong: true },
        { key: 'modele', label: 'Modèle' },
        { key: 'annee', label: 'Année', type: 'number' },
        { key: 'km', label: 'Kilométrage', type: 'number', render: r => `${new Intl.NumberFormat('fr-FR').format(r.km)} km` },
        { key: 'prix', label: 'Prix', type: 'number', render: r => UI.fmtMoney(r.prix) },
        { key: 'statut', label: 'Statut', type: 'select', options: ['Disponible', 'Réservé', 'Vendu'], render: r => `<span class="badge ${r.statut === 'Disponible' ? 'badge-green' : r.statut === 'Réservé' ? 'badge-amber' : 'badge-gray'}">${r.statut}</span>` },
      ],
    });
  }

  function renderVentes(container) {
    const vehicules = Store.get(Store.KEYS.auto_vehicules, []);
    createCrudView({
      root: container,
      storageKey: Store.KEYS.auto_ventes,
      entityLabel: 'vente',
      entityLabelPlural: 'ventes',
      searchKeys: ['client', 'vehiculeLabel'],
      emptyIcon: Icons.cash,
      defaultsForNew: { date: new Date().toISOString().slice(0, 10), prix: 0, vehiculeLabel: '' },
      columns: [
        { key: 'vehiculeLabel', label: 'Véhicule', strong: true },
        { key: 'client', label: 'Client' },
        { key: 'date', label: 'Date de vente', type: 'date', render: r => UI.fmtDate(r.date) },
        { key: 'prix', label: 'Prix de vente', type: 'number', render: r => UI.fmtMoney(r.prix) },
      ],
    });
  }

  function renderPage(page, container) {
    if (page === 'vehicules') renderVehicules(container);
    else if (page === 'ventes') renderVentes(container);
    else renderDashboard(container);
  }

  return { key, label, shortLabel, icon, description, navItems, renderPage, homeStat };
})();
