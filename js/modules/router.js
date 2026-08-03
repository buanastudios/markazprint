/**
 * TIBYAN PRINT SERVICE v2.0
 * router.js - SPA Navigation & View Routing Lifecycle Module
 */

const Router = {
  async switchView(viewName) {
    AppState.activeView = viewName;

    // Sync Active States on Desktop Header & Mobile Bottom Nav
    document.querySelectorAll('.nav-btn, .nav-btn-mobile').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    // Hide all view containers
    document.querySelectorAll('.app-view').forEach(v => v.style.display = 'none');

    // Display target view
    const targetView = document.getElementById(`view-${viewName}`);
    if (targetView) targetView.style.display = 'block';

    // Route lifecycle hooks
    if (viewName === 'dashboard') {
      await DashboardModule.loadData();
    } else if (viewName === 'request') {
      RequestModule.resetForm();
    } else if (viewName === 'status') {
      await StatusModule.loadData();
    }
  },

  setupRoleNavigation() {
    if (!AppState.user) return;
    const isViewer = (AppState.user.role === 'VIEWER');
    const isGuest = (AppState.user.role === 'GUEST');

    if (isViewer || isGuest) {
      document.querySelectorAll('.nav-btn-request').forEach(btn => btn.style.display = 'none');
    }
  }
};
