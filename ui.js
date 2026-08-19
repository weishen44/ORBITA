/* ==========================================================================
   Orbita — utilitaires d'interface partagés (toasts, modales, formatage)
   ========================================================================== */
const UI = (() => {
  function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function fmtMoney(n) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0);
  }

  function fmtDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function toast(message, type = 'info') {
    const host = document.getElementById('toast-host');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    const icon = type === 'success' ? Icons.check : type === 'error' ? Icons.x : Icons.bell;
    el.innerHTML = `${icon}<span>${escapeHtml(message)}</span>`;
    host.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(6px)'; el.style.transition = 'all .2s'; }, 2400);
    setTimeout(() => el.remove(), 2700);
  }

  let modalStack = [];
  function openModal({ title, bodyHtml, footHtml, onMount, width }) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="${width ? `max-width:${width}px` : ''}">
        <div class="modal-head">
          <h3>${escapeHtml(title)}</h3>
          <button class="btn btn-ghost btn-icon" data-close-modal>${Icons.x}</button>
        </div>
        <div class="modal-body">${bodyHtml}</div>
        ${footHtml ? `<div class="modal-foot">${footHtml}</div>` : ''}
      </div>`;
    document.body.appendChild(overlay);
    modalStack.push(overlay);
    overlay.addEventListener('click', e => {
      if (e.target === overlay || e.target.closest('[data-close-modal]')) closeModal(overlay);
    });
    document.addEventListener('keydown', escHandler);
    function escHandler(e) { if (e.key === 'Escape') { closeModal(overlay); document.removeEventListener('keydown', escHandler); } }
    if (onMount) onMount(overlay);
    return overlay;
  }
  function closeModal(overlay) {
    const el = overlay || modalStack[modalStack.length - 1];
    if (!el) return;
    el.remove();
    modalStack = modalStack.filter(m => m !== el);
  }

  function confirmDialog({ title, message, confirmLabel = 'Supprimer', onConfirm }) {
    const overlay = openModal({
      title,
      bodyHtml: `<div class="confirm-box"><div class="c-icon">${Icons.alert}</div><p>${message}</p></div>`,
      footHtml: `
        <button class="btn btn-secondary" data-close-modal>Annuler</button>
        <button class="btn btn-danger" id="confirm-ok-btn">${confirmLabel}</button>`,
    });
    overlay.querySelector('#confirm-ok-btn').addEventListener('click', () => {
      onConfirm();
      closeModal(overlay);
    });
  }

  return { escapeHtml, fmtMoney, fmtDate, toast, openModal, closeModal, confirmDialog };
})();
