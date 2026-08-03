/**
 * TIBYAN PRINT SERVICE v2.0
 * app.js - Main Application Bootstrap & Core State Engine
 */

const AppState = {
  user: null,
  activeView: 'dashboard',
  activeUploadTab: 'file', // 'file' or 'link'
  myRequests: [],
  allRequests: [],
  usersList: [],
  selectedBatchIds: [],
  selectedFile: null,
  selectedFileBase64: null,
  activeFilterStatus: 'ALL',
  activeSearchQuery: ''
};

/**
 * Application Core Bootstrapper
 */
window.addEventListener('DOMContentLoaded', async () => {
  try {
    // 1. Initialize Layout Component Templates via TemplateEngine
    await TemplateEngine.initLayoutComponents();

    // 2. Setup Drag & Drop Listeners
    RequestModule.setupDragAndDrop();

    // 3. Fetch Current User Role Context
    AppState.user = await callApi('getCurrentUser');
    renderUserHeader();
    Router.setupRoleNavigation();

    // 4. Boot Default View (Dashboard)
    await Router.switchView('dashboard');
  } catch (e) {
    console.error('Initialization Error:', e);
    const main = document.getElementById('main-container');
    if (main) {
      main.innerHTML = `
        <div class="card" style="text-align: center; padding: 40px;">
          <h3 style="color: var(--danger);">Gagal Inisialisasi Aplikasi</h3>
          <p style="margin-top: 10px; color: var(--text-secondary);">${e.message}</p>
          <button class="btn btn-primary" onclick="location.reload()" style="margin-top: 20px;">Coba Lagi</button>
        </div>
      `;
    }
  }
});

/**
 * Render Header User Badge
 */
function renderUserHeader() {
  if (!AppState.user) return;
  const nameEl = document.getElementById('hdr-user-name');
  const roleEl = document.getElementById('hdr-user-role');
  if (nameEl) nameEl.innerText = AppState.user.name;
  if (roleEl) {
    roleEl.innerText = AppState.user.role;
    roleEl.className = 'user-role-chip role-' + AppState.user.role.toLowerCase();
  }
}
