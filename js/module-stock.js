/* ==========================================================================
   Orbita — module "Gestion de stock"
   ========================================================================== */
const StockModule = (() => {
  const key = 'stock';
  const label = 'Gestion de stock';
  const shortLabel = 'Stock';
  const icon = Icons.box;
  const description = "Suivez vos produits, quantités, valorisation et seuils d'alerte en temps réel.";

  const navItems = [
    { key: 'dashboard', label: 'Tableau de bord', icon: Icons.grid },
    { key: 'produits', label: 'Produits', icon: Icons.box },
  ];

  function stats() {
    const data = Store.get(Store.KEYS.stock_produits, []);
    const totalProduits = data.length;
    const valeurStock = data.reduce((s, p) => s + p.quantite * p.prix, 0);
    const enAlerte = data.filter(p => p.quantite <= p.seuil);
    const categories = [...new Set(data.map(p => p.categorie))];
    return { data, totalProduits, valeurStock, enAlerte, categories };
  }

  function homeStat() {
    const { totalProduits, enAlerte } = stats();
    return `${totalProduits} produits · ${enAlerte.length} en alerte`;
  }

  function renderDashboard(container) {
    const { data, totalProduits, valeurStock, enAlerte, categories } = stats();

    const parCategorie = categories.map(cat => {
      const items = data.filter(p => p.categorie === cat);
      const valeur = items.reduce((s, p) => s + p.quantite * p.prix, 0);
      return { cat, valeur, qty: items.reduce((s, p) => s + p.quantite, 0) };
    }).sort((a, b) => b.valeur - a.valeur);
    const maxValeur = Math.max(1, ...parCategorie.map(c => c.valeur));

    container.innerHTML = `
      <div class="stats-row">
        <div class="stat-card">
          <div class="s-top"><span class="s-label">Produits référencés</span><div class="s-icon">${Icons.box}</div></div>
          <div class="s-value">${totalProduits}</div>
          <div class="s-delta flat">${categories.length} catégories</div>
        </div>
        <div class="stat-card">
          <div class="s-top"><span class="s-label">Valeur du stock</span><div class="s-icon">${Icons.cash}</div></div>
          <div class="s-value">${UI.fmtMoney(valeurStock)}</div>
          <div class="s-delta up">Valorisation au prix d'achat</div>
        </div>
        <div class="stat-card">
          <div class="s-top"><span class="s-label">Produits en alerte</span><div class="s-icon">${Icons.alert}</div></div>
          <div class="s-value">${enAlerte.length}</div>
          <div class="s-delta ${enAlerte.length ? 'down' : 'flat'}">${enAlerte.length ? 'Sous le seuil de réassort' : 'Aucune alerte'}</div>
        </div>
        <div class="stat-card">
          <div class="s-top"><span class="s-label">Unités en stock</span><div class="s-icon">${Icons.grid}</div></div>
          <div class="s-value">${data.reduce((s, p) => s + p.quantite, 0)}</div>
          <div class="s-delta flat">Toutes catégories</div>
        </div>
      </div>

      <div class="two-col">
        <div class="panel">
          <div class="panel-head"><h3>Valeur du stock par catégorie</h3></div>
          <div class="bar-list">
            ${parCategorie.map(c => `
              <div class="bar-row">
                <div class="bar-label">${UI.escapeHtml(c.cat)}</div>
                <div class="bar-track"><div class="bar-fill" style="width:${(c.valeur / maxValeur) * 100}%"></div></div>
                <div class="bar-value">${UI.fmtMoney(c.valeur)}</div>
              </div>`).join('') || '<p style="color:var(--gray-400);font-size:13px;">Aucune donnée.</p>'}
          </div>
        </div>
        <div class="panel">
          <div class="panel-head"><h3>Alertes de réassort</h3><span class="see-all" data-goto="produits">Voir tout ${Icons.chevronRight}</span></div>
          <div class="mini-list">
            ${enAlerte.length ? enAlerte.slice(0, 6).map(p => `
              <div class="mini-row">
                <div class="m-icon">${Icons.alert}</div>
                <div class="m-body"><div class="m-title">${UI.escapeHtml(p.nom)}</div><div class="m-sub">Seuil : ${p.seuil} · Restant : ${p.quantite}</div></div>
                <div class="m-end"><span class="badge badge-amber">Réassort</span></div>
              </div>`).join('') : `<p style="color:var(--gray-400);font-size:13px;">Aucun produit sous le seuil d'alerte. 👍</p>`}
          </div>
        </div>
      </div>
    `;
    const seeAll = container.querySelector('[data-goto="produits"]');
    if (seeAll) seeAll.addEventListener('click', () => App.navigate('stock', 'produits'));
  }

  function renderProduits(container) {
    createCrudView({
      root: container,
      storageKey: Store.KEYS.stock_produits,
      entityLabel: 'produit',
      entityLabelPlural: 'produits',
      searchKeys: ['nom', 'categorie'],
      emptyIcon: Icons.box,
      defaultsForNew: { categorie: 'Informatique', quantite: 0, prix: 0, seuil: 5 },
      columns: [
        { key: 'nom', label: 'Produit', strong: true },
        { key: 'categorie', label: 'Catégorie', type: 'select', options: ['Informatique', 'Mobilier', 'Accessoires'] },
        { key: 'quantite', label: 'Quantité', type: 'number', render: r => `${r.quantite <= r.seuil ? `<span class="badge badge-amber">${r.quantite}</span>` : r.quantite}` },
        { key: 'seuil', label: 'Seuil alerte', type: 'number' },
        { key: 'prix', label: 'Prix unitaire', type: 'number', render: r => UI.fmtMoney(r.prix) },
      ],
    });
  }

  function renderPage(page, container) {
    if (page === 'produits') renderProduits(container);
    else renderDashboard(container);
  }

  return { key, label, shortLabel, icon, description, navItems, renderPage, homeStat };
})();
