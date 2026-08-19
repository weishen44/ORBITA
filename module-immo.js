/* ==========================================================================
   Orbita — module "Gestion locative immobilière"
   ========================================================================== */
const ImmoModule = (() => {
  const key = 'immo';
  const label = 'Gestion locative immobilière';
  const shortLabel = 'Immobilier';
  const icon = Icons.building;
  const description = 'Pilotez vos biens, locataires, loyers et taux d\'occupation depuis un tableau unique.';

  const navItems = [
    { key: 'dashboard', label: 'Tableau de bord', icon: Icons.grid },
    { key: 'biens', label: 'Biens', icon: Icons.building },
    { key: 'locataires', label: 'Locataires', icon: Icons.users },
  ];

  function stats() {
    const biens = Store.get(Store.KEYS.immo_biens, []);
    const locataires = Store.get(Store.KEYS.immo_locataires, []);
    const loues = biens.filter(b => b.statut === 'Loué');
    const libres = biens.filter(b => b.statut === 'Libre');
    const revenuMensuel = loues.reduce((s, b) => s + b.loyer, 0);
    const tauxOccupation = biens.length ? Math.round((loues.length / biens.length) * 100) : 0;
    const impayes = locataires.filter(l => l.statutPaiement === 'En retard');
    return { biens, locataires, loues, libres, revenuMensuel, tauxOccupation, impayes };
  }

  function homeStat() {
    const { biens, tauxOccupation } = stats();
    return `${biens.length} biens · ${tauxOccupation}% occupés`;
  }

  function bienLabel(biens, id) {
    const b = biens.find(x => x.id === id);
    return b ? b.adresse : '—';
  }

  function renderDashboard(container) {
    const { biens, locataires, loues, libres, revenuMensuel, tauxOccupation, impayes } = stats();
    const parType = [...new Set(biens.map(b => b.type))].map(t => {
      const items = biens.filter(b => b.type === t);
      return { t, count: items.length, loyer: items.reduce((s, b) => s + b.loyer, 0) };
    }).sort((a, b) => b.loyer - a.loyer);
    const maxLoyer = Math.max(1, ...parType.map(x => x.loyer));

    container.innerHTML = `
      <div class="stats-row">
        <div class="stat-card">
          <div class="s-top"><span class="s-label">Biens gérés</span><div class="s-icon">${Icons.building}</div></div>
          <div class="s-value">${biens.length}</div>
          <div class="s-delta flat">${loues.length} loués · ${libres.length} libres</div>
        </div>
        <div class="stat-card">
          <div class="s-top"><span class="s-label">Revenus locatifs / mois</span><div class="s-icon">${Icons.cash}</div></div>
          <div class="s-value">${UI.fmtMoney(revenuMensuel)}</div>
          <div class="s-delta up">Sur biens loués</div>
        </div>
        <div class="stat-card">
          <div class="s-top"><span class="s-label">Taux d'occupation</span><div class="s-icon">${Icons.grid}</div></div>
          <div class="s-value">${tauxOccupation}%</div>
          <div class="s-delta ${tauxOccupation >= 70 ? 'up' : 'down'}">${libres.length} bien(s) vacant(s)</div>
        </div>
        <div class="stat-card">
          <div class="s-top"><span class="s-label">Loyers en retard</span><div class="s-icon">${Icons.alert}</div></div>
          <div class="s-value">${impayes.length}</div>
          <div class="s-delta ${impayes.length ? 'down' : 'flat'}">${impayes.length ? 'À relancer' : 'Tout est à jour'}</div>
        </div>
      </div>

      <div class="two-col">
        <div class="panel">
          <div class="panel-head"><h3>Loyers cumulés par type de bien</h3></div>
          <div class="bar-list">
            ${parType.map(x => `
              <div class="bar-row">
                <div class="bar-label">${UI.escapeHtml(x.t)}</div>
                <div class="bar-track"><div class="bar-fill" style="width:${(x.loyer / maxLoyer) * 100}%"></div></div>
                <div class="bar-value">${UI.fmtMoney(x.loyer)}</div>
              </div>`).join('') || '<p style="color:var(--gray-400);font-size:13px;">Aucune donnée.</p>'}
          </div>
        </div>
        <div class="panel">
          <div class="panel-head"><h3>Locataires à surveiller</h3><span class="see-all" data-goto="locataires">Voir tout ${Icons.chevronRight}</span></div>
          <div class="mini-list">
            ${locataires.length ? locataires.slice(0, 6).map(l => `
              <div class="mini-row">
                <div class="m-icon">${Icons.users}</div>
                <div class="m-body"><div class="m-title">${UI.escapeHtml(l.nom)}</div><div class="m-sub">${UI.escapeHtml(bienLabel(biens, l.bienId))}</div></div>
                <div class="m-end">${l.statutPaiement === 'En retard' ? '<span class="badge badge-red">En retard</span>' : '<span class="badge badge-green">À jour</span>'}</div>
              </div>`).join('') : `<p style="color:var(--gray-400);font-size:13px;">Aucun locataire enregistré.</p>`}
          </div>
        </div>
      </div>
    `;
    const seeAll = container.querySelector('[data-goto="locataires"]');
    if (seeAll) seeAll.addEventListener('click', () => App.navigate('immo', 'locataires'));
  }

  function renderBiens(container) {
    createCrudView({
      root: container,
      storageKey: Store.KEYS.immo_biens,
      entityLabel: 'bien',
      entityLabelPlural: 'biens',
      searchKeys: ['adresse', 'type'],
      emptyIcon: Icons.building,
      defaultsForNew: { type: 'Appartement', statut: 'Libre', surface: 0, loyer: 0 },
      columns: [
        { key: 'adresse', label: 'Adresse', strong: true },
        { key: 'type', label: 'Type', type: 'select', options: ['Appartement', 'Studio', 'Maison', 'Local commercial'] },
        { key: 'surface', label: 'Surface (m²)', type: 'number' },
        { key: 'loyer', label: 'Loyer / mois', type: 'number', render: r => UI.fmtMoney(r.loyer) },
        { key: 'statut', label: 'Statut', type: 'select', options: ['Loué', 'Libre'], render: r => `<span class="badge ${r.statut === 'Loué' ? 'badge-blue' : 'badge-gray'}">${r.statut}</span>` },
      ],
    });
  }

  function renderLocataires(container) {
    const biens = Store.get(Store.KEYS.immo_biens, []);
    createCrudView({
      root: container,
      storageKey: Store.KEYS.immo_locataires,
      entityLabel: 'locataire',
      entityLabelPlural: 'locataires',
      searchKeys: ['nom', 'telephone'],
      emptyIcon: Icons.users,
      defaultsForNew: { bienId: biens[0] ? biens[0].id : '', statutPaiement: 'À jour', debut: new Date().toISOString().slice(0, 10) },
      columns: [
        { key: 'nom', label: 'Locataire', strong: true },
        { key: 'bienId', label: 'Bien loué', type: 'select', options: biens.map(b => b.id), render: r => UI.escapeHtml(bienLabel(biens, r.bienId)) },
        { key: 'telephone', label: 'Téléphone' },
        { key: 'debut', label: 'Entrée', type: 'date', render: r => UI.fmtDate(r.debut) },
        { key: 'statutPaiement', label: 'Paiement', type: 'select', options: ['À jour', 'En retard'], render: r => `<span class="badge ${r.statutPaiement === 'À jour' ? 'badge-green' : 'badge-red'}">${r.statutPaiement}</span>` },
      ],
      beforeSave: record => { record.bienId = Number(record.bienId); },
    });
    // Remplace le select "bien loué" pour afficher les adresses plutôt que les identifiants
    container.addEventListener('click', e => {
      if (e.target.closest('#crud-add-btn') || e.target.closest('[data-edit]')) {
        setTimeout(() => {
          const select = document.querySelector('[data-field="bienId"] select');
          if (select) {
            [...select.options].forEach(opt => {
              const bien = biens.find(b => b.id == opt.value);
              if (bien) opt.textContent = bien.adresse;
            });
          }
        }, 0);
      }
    });
  }

  function renderPage(page, container) {
    if (page === 'biens') renderBiens(container);
    else if (page === 'locataires') renderLocataires(container);
    else renderDashboard(container);
  }

  return { key, label, shortLabel, icon, description, navItems, renderPage, homeStat };
})();
