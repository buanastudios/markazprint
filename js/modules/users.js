/**
 * TIBYAN PRINT SERVICE v2.0
 * users.js - User Account Management & Identity Switcher Feature Module
 */

const UserModule = {
  /**
   * Saves active testing/demo identity locally and re-renders application state
   */
  async saveActiveIdentity() {
    const email = document.getElementById('id-switch-email').value || 'guru@tibyan.org';
    const name = document.getElementById('id-switch-name').value || 'Guru At-Tibyan';
    const role = document.getElementById('id-switch-role').value || 'USER';

    const identity = {
      email: email.trim(),
      name: name.trim(),
      role: role,
      department: role === 'ADMIN' ? 'Sekretariat Utama' : (role === 'VIEWER' ? 'Kepala Sekolah' : 'Pengajar / Staff'),
      status: 'ACTIVE'
    };

    AppState.user = identity;
    localStorage.setItem('tibyan_user_identity', JSON.stringify(identity));

    // Sync header badge and route navigation
    if (typeof renderUserHeader === 'function') renderUserHeader();
    if (Router && Router.setupRoleNavigation) Router.setupRoleNavigation();

    UIModule.closeModal('modal-switch-identity');
    UIModule.showToast(`Profil berhasil diubah menjadi ${name} (${role}).`, 'success');

    // Reload active view data
    if (AppState.activeView === 'dashboard') {
      await DashboardModule.loadData();
    } else if (AppState.activeView === 'status') {
      await StatusModule.loadData();
    }
  },

  /**
   * Restores stored identity from localStorage or default fallback
   */
  loadSavedIdentity() {
    try {
      const saved = localStorage.getItem('tibyan_user_identity');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not load stored identity:', e);
    }
    return null;
  },

  async openManagementModal() {
    UIModule.openModal('modal-manage-users');
    const users = await callApi('getAllUsers');
    AppState.usersList = users;
    this.renderUsersTable(users);
  },

  renderUsersTable(users) {
    const container = document.getElementById('users-table-container');
    if (!container) return;

    if (!users || users.length === 0) {
      container.innerHTML = `<div style="text-align: center; padding: 20px;">Tidak ada pengguna.</div>`;
      return;
    }

    let html = `
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Nama</th>
              <th>Role</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
    `;

    users.forEach(u => {
      const isActive = (u.status === 'ACTIVE');
      html += `
        <tr>
          <td>${u.email}</td>
          <td>${u.name}</td>
          <td><span class="user-role-chip role-${u.role.toLowerCase()}">${u.role}</span></td>
          <td><strong>${u.status}</strong></td>
          <td>
            <button class="btn btn-sm ${isActive ? 'btn-danger' : 'btn-secondary'}" onclick="UserModule.toggleStatus('${u.email}', '${isActive ? 'INACTIVE' : 'ACTIVE'}')">
              ${isActive ? 'Nonaktifkan' : 'Aktifkan'}
            </button>
          </td>
        </tr>
      `;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;
  },

  async toggleStatus(email, newStatus) {
    try {
      await callApi('updateUserStatus', { email: email, status: newStatus });
      UIModule.showToast(`Status ${email} diubah ke ${newStatus}.`, 'success');
      await this.openManagementModal();
    } catch (e) {
      console.error(e);
    }
  },

  async handleUserSaveSubmit(event) {
    event.preventDefault();
    const payload = {
      email: document.getElementById('u-form-email').value,
      name: document.getElementById('u-form-name').value,
      role: document.getElementById('u-form-role').value,
      department: document.getElementById('u-form-dept').value
    };

    try {
      await callApi('saveUser', payload);
      UIModule.showToast(`Pengguna ${payload.email} berhasil disimpan.`, 'success');
      document.getElementById('form-user-save').reset();
      await this.openManagementModal();
    } catch (e) {
      console.error(e);
    }
  }
};
