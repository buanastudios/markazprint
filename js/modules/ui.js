/**
 * TIBYAN PRINT SERVICE v2.0
 * ui.js - Global UI Notifications, Modals & Overlay Manager
 */

const UIModule = {
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => toast.remove(), 4000);
  },

  openModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) m.classList.add('active');
  },

  closeModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) m.classList.remove('active');
  },

  showLoading(show) {
    const loader = document.getElementById('global-loader');
    if (loader) loader.style.display = show ? 'flex' : 'none';
  }
};

// Aliases for global compatibility
function showToast(message, type) { UIModule.showToast(message, type); }
function showLoading(show) { UIModule.showLoading(show); }
function openModal(id) { UIModule.openModal(id); }
function closeModal(id) { UIModule.closeModal(id); }
