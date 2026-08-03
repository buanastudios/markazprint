/**
 * MARKAZ PRINTING v2.0
 * Powered by Buana Studios for Yayasan T.I.B.Y.A.N.
 * router.js - SPA Navigation & AdminLTE Sidebar Router Lifecycle Module
 */

const Router = {
  async switchView(viewName) {
    AppState.activeView = viewName;

    // Sync Active States on AdminLTE Sidebar & Desktop Header
    document.querySelectorAll('.nav-link').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    // On Mobile, close sidebar after clicking a nav item
    const sidebar = document.getElementById('app-sidebar');
    if (sidebar && window.innerWidth <= 768) {
      sidebar.classList.remove('sidebar-open');
    }

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

  toggleSidebar() {
    const sidebar = document.getElementById('app-sidebar');
    if (sidebar) {
      sidebar.classList.toggle('sidebar-open');
    }
  },

  setupRoleNavigation() {
    if (!AppState.user) return;
    const isViewer = (AppState.user.role === 'VIEWER');

    document.querySelectorAll('.nav-btn-request').forEach(btn => {
      btn.style.display = isViewer ? 'none' : 'inline-flex';
    });
  }
};
