/* ==========================================================================
   Orbita — moteur de listes CRUD générique
   Construit une barre d'outils (recherche + ajout), un tableau et une
   modale de formulaire à partir d'un schéma de colonnes déclaratif.
   Utilisé par les trois modules métier pour éviter toute duplication.
   ========================================================================== */
function createCrudView(config) {
  const {
    root,                 // élément conteneur
    storageKey,            // clé localStorage
    entityLabel,           // ex: "produit"
    entityLabelPlural,      // ex: "produits"
    columns,                // [{key,label,type,options,required,editable,render(row)}]
    searchKeys,             // clés utilisées pour le filtre texte
    emptyIcon,
    onChange,               // callback(data) appelé après chaque mutation
    rowActionsExtra,         // fn(row) -> html supplémentaire (optionnel)
    defaultsForNew,          // objet de valeurs par défaut pour un nouvel enregistrement
  } = config;

  let query = '';

  function getData() { return Store.get(storageKey, []); }
  function setData(d) { Store.set(storageKey, d); if (onChange) onChange(d); }

  function filtered() {
    const data = getData();
    if (!query.trim()) return data;
    const q = query.toLowerCase();
    return data.filter(row => searchKeys.some(k => String(row[k] ?? '').toLowerCase().includes(q)));
  }

  function render() {
    const rows = filtered();
    root.innerHTML = `
      <div class="toolbar">
        <div class="search-wrap">
          ${Icons.search}
          <input type="text" id="crud-search" placeholder="Rechercher un ${UI.escapeHtml(entityLabel)}…" value="${UI.escapeHtml(query)}" />
        </div>
        <button class="btn btn-primary" id="crud-add-btn">${Icons.plus} Ajouter</button>
      </div>
      <div class="table-wrap">
        ${rows.length ? `
        <table>
          <thead><tr>
            ${columns.map(c => `<th>${UI.escapeHtml(c.label)}</th>`).join('')}
            <th></th>
          </tr></thead>
          <tbody>
            ${rows.map(row => `
              <tr data-id="${row.id}">
                ${columns.map(c => `<td class="${c.strong ? 'cell-strong' : ''}">${c.render ? c.render(row) : UI.escapeHtml(row[c.key])}</td>`).join('')}
                <td>
                  <div class="row-actions">
                    ${rowActionsExtra ? rowActionsExtra(row) : ''}
                    <button class="btn btn-secondary btn-icon" data-edit="${row.id}" title="Modifier">${Icons.edit}</button>
                    <button class="btn btn-danger btn-icon" data-del="${row.id}" title="Supprimer">${Icons.trash}</button>
                  </div>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>` : `
        <div class="empty-state">
          ${emptyIcon || Icons.inbox}
          <p>${query ? 'Aucun résultat pour cette recherche.' : `Aucun ${UI.escapeHtml(entityLabelPlural)} pour le moment.`}</p>
        </div>`}
      </div>
    `;

    root.querySelector('#crud-search').addEventListener('input', e => { query = e.target.value; render(); });
    root.querySelector('#crud-add-btn').addEventListener('click', () => openForm(null));
    root.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => {
      const row = getData().find(r => r.id == btn.dataset.edit);
      openForm(row);
    }));
    root.querySelectorAll('[data-del]').forEach(btn => btn.addEventListener('click', () => {
      const row = getData().find(r => r.id == btn.dataset.del);
      UI.confirmDialog({
        title: `Supprimer ce ${entityLabel} ?`,
        message: `Cette action est irréversible. Confirmez-vous la suppression ${row.nom ? `de <b>${UI.escapeHtml(row.nom)}</b>` : `de cet enregistrement`} ?`,
        onConfirm: () => {
          setData(getData().filter(r => r.id !== row.id));
          render();
          UI.toast('Suppression effectuée', 'success');
        },
      });
    }));
  }

  function fieldHtml(col, value) {
    const val = value ?? '';
    if (col.type === 'select') {
      return `
        <div class="field ${col.full ? 'full' : ''}" data-field="${col.key}">
          <label>${UI.escapeHtml(col.label)}</label>
          <select name="${col.key}">
            ${col.options.map(o => `<option value="${UI.escapeHtml(o)}" ${o === val ? 'selected' : ''}>${UI.escapeHtml(o)}</option>`).join('')}
          </select>
        </div>`;
    }
    return `
      <div class="field ${col.full ? 'full' : ''}" data-field="${col.key}">
        <label>${UI.escapeHtml(col.label)}</label>
        <input type="${col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}"
               name="${col.key}" value="${UI.escapeHtml(val)}"
               ${col.type === 'number' ? 'step="any"' : ''} />
      </div>`;
  }

  function openForm(existing) {
    const editableCols = columns.filter(c => c.editable !== false);
    const source = existing || { ...(defaultsForNew || {}) };
    const overlay = UI.openModal({
      title: existing ? `Modifier ${entityLabel}` : `Ajouter un ${entityLabel}`,
      bodyHtml: `<div class="form-grid">${editableCols.map(c => fieldHtml(c, source[c.key])).join('')}</div>`,
      footHtml: `
        <button class="btn btn-secondary" data-close-modal>Annuler</button>
        <button class="btn btn-primary" id="crud-save-btn">${existing ? 'Enregistrer' : 'Ajouter'}</button>`,
    });

    overlay.querySelector('#crud-save-btn').addEventListener('click', () => {
      const data = getData();
      const record = existing ? { ...existing } : { id: Store.nextId(data) };
      let valid = true;
      editableCols.forEach(c => {
        const fieldEl = overlay.querySelector(`[data-field="${c.key}"]`);
        const input = fieldEl.querySelector('input,select');
        let v = input.value;
        if (c.required !== false && !String(v).trim()) {
          fieldEl.classList.add('err');
          valid = false;
          return;
        }
        fieldEl.classList.remove('err');
        if (c.type === 'number') v = v === '' ? 0 : Number(v);
        record[c.key] = v;
      });
      if (!valid) { UI.toast('Merci de renseigner les champs requis', 'error'); return; }
      if (config.beforeSave) config.beforeSave(record);

      const next = existing ? data.map(r => (r.id === existing.id ? record : r)) : [...data, record];
      setData(next);
      UI.closeModal(overlay);
      render();
      UI.toast(existing ? 'Modifications enregistrées' : 'Ajout effectué avec succès', 'success');
    });
  }

  render();
  return { render, getData };
}
