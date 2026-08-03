/**
 * TIBYAN PRINT SERVICE v2.0
 * dashboard.js - Dashboard Controller & Analytics Renderer Module
 */

const DashboardModule = {
  async loadData() {
    if (!AppState.user) return;

    if (AppState.user.role === 'ADMIN' || AppState.user.role === 'VIEWER') {
      const adminData = await callApi('getAdminDashboard');
      this.renderAdminDashboard(adminData);
    } else {
      const userData = await callApi('getUserDashboard');
      this.renderUserDashboard(userData);
    }
  },

  renderUserDashboard(data) {
    document.getElementById('dash-welcome-name').innerText = `Assalamu'alaikum, ${data.user.name}`;
    document.getElementById('dash-welcome-sub').innerText = `Unit: ${data.user.department} (${data.user.role})`;

    document.getElementById('metric-waiting-val').innerText = data.stats.waiting;
    document.getElementById('metric-printing-val').innerText = data.stats.printing;
    document.getElementById('metric-ready-val').innerText = data.stats.ready;
    document.getElementById('metric-completed-val').innerText = data.stats.completed;

    const sections = document.getElementById('dash-main-sections');
    if (!sections) return;

    if (!data.recentRequests || data.recentRequests.length === 0) {
      sections.innerHTML = `
        <div class="card" style="text-align: center; padding: 40px;">
          <div style="font-size: 40px; margin-bottom: 10px;">📄</div>
          <h3>Belum Ada Permohonan Cetak</h3>
          <p style="color: var(--text-secondary); margin-top: 6px;">Klik tombol di atas untuk mengajukan permohonan cetak dokumen baru.</p>
        </div>
      `;
      return;
    }

    let html = `
      <div class="card">
        <div class="card-header">
          <div class="card-title">📌 Permohonan Aktif Terbaru Anda</div>
          <button class="btn btn-secondary btn-sm" onclick="Router.switchView('status')">Lihat Semua History</button>
        </div>
        <div style="display: flex; flex-direction: column; gap: 10px;">
    `;

    data.recentRequests.forEach(req => {
      const badgeClass = 'badge-' + req.status.toLowerCase();
      html += `
        <div style="border: 1px solid var(--border-light); padding: 12px; border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <div>
            <div style="font-weight: 700; color: var(--primary);">${req.request_id}</div>
            <div style="font-size: 13px; font-weight: 500; margin-top: 2px;">📎 ${req.file_name}</div>
            <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">Deadline: ${req.deadline}</div>
          </div>
          <span class="badge-status ${badgeClass}">${req.status}</span>
        </div>
      `;
    });

    html += `</div></div>`;
    sections.innerHTML = html;
  },

  renderAdminDashboard(data) {
    document.getElementById('dash-welcome-name').innerText = `Dashboard Sekretariat`;
    document.getElementById('dash-welcome-sub').innerText = `Total Cetak Hari Ini: ${data.counters.todayCopiesPrinted} rangkap | Total Keseluruhan: ${data.counters.totalCopiesPrinted} rangkap`;

    document.getElementById('metric-waiting-val').innerText = data.counters.waiting;
    document.getElementById('metric-printing-val').innerText = data.counters.printing;
    document.getElementById('metric-ready-val').innerText = data.counters.ready;
    document.getElementById('metric-completed-val').innerText = data.counters.completed;

    const sections = document.getElementById('dash-main-sections');
    if (!sections) return;

    let html = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
        <h3 style="font-family: var(--font-heading); font-size: 18px;">Alur Kerja Pencetakan Sekretariat</h3>
        ${AppState.user.role === 'ADMIN' ? `
          <button class="btn btn-secondary btn-sm" onclick="UserModule.openManagementModal()">👥 Manajemen User</button>
        ` : ''}
      </div>
    `;

    if (data.analytics) {
      html += `
        <div class="card" style="background: var(--surface-variant); padding: 14px;">
          <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">📊 Analisis Penggunaan Kertas:</div>
          <div style="display: flex; flex-wrap: wrap; gap: 16px; font-size: 13px;">
            <span>📄 A4: <strong>${data.analytics.paperStats.A4 || 0} rangkap</strong></span>
            <span>📄 F4: <strong>${data.analytics.paperStats.F4 || 0} rangkap</strong></span>
            <span>📄 A5: <strong>${data.analytics.paperStats.A5 || 0} rangkap</strong></span>
            <span>🎨 Color: <strong>${data.analytics.colorStats.Color || 0} rangkap</strong></span>
          </div>
        </div>
      `;
    }

    html += `
      <div class="card">
        <div class="card-header">
          <div class="card-title">⏳ Waiting Queue (Menunggu Cetak)</div>
        </div>
    `;

    if (!data.queues.waiting || data.queues.waiting.length === 0) {
      html += `<div style="padding: 16px; text-align: center; color: var(--text-tertiary);">Tidak ada antrean menanti.</div>`;
    } else {
      html += `
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Antrean</th>
                <th>Pemohon</th>
                <th>Dokumen</th>
                <th>Spesifikasi</th>
                <th>Aksi Alur Kerja</th>
              </tr>
            </thead>
            <tbody>
      `;

      data.queues.waiting.forEach(q => {
        html += `
          <tr>
            <td><strong>${q.request_id}</strong></td>
            <td>${q.user_name}</td>
            <td><a href="${q.file_url}" target="_blank" style="color: var(--primary);">📎 ${q.file_name}</a></td>
            <td style="font-size: 11px;">${q.paper_size} | ${q.copies} copy | ${q.color_mode}</td>
            <td>
              ${AppState.user.role === 'ADMIN' ? `
                <div style="display: flex; gap: 4px;">
                  <button class="btn btn-primary btn-sm" onclick="StatusModule.quickChangeStatus('${q.request_id}', 'PRINTING', 'Sedang dalam proses cetak')">⚡ Mulai Cetak</button>
                  <button class="btn btn-danger btn-sm" onclick="StatusModule.openTroubleModal('${q.request_id}')">⚠️ Trouble</button>
                </div>
              ` : '-'}
            </td>
          </tr>
        `;
      });
      html += `</tbody></table></div>`;
    }
    html += `</div>`;

    sections.innerHTML = html;
  }
};
