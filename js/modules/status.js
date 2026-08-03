/**
 * TIBYAN PRINT SERVICE v2.0
 * status.js - Queue History Listing, Filters, Batch Operations & Trouble Reporting Module
 */

const StatusModule = {
  async loadData() {
    AppState.selectedBatchIds = [];
    this.updateBatchToolbar();

    if (AppState.user.role === 'ADMIN' || AppState.user.role === 'VIEWER') {
      const allReqs = await callApi('getAllRequests', { status: 'ALL' });
      AppState.allRequests = allReqs || [];
    } else {
      const myReqs = await callApi('getMyRequests');
      AppState.myRequests = myReqs || [];
    }
    this.renderFilteredList();
  },

  handleFilterChange(statusVal) {
    AppState.activeFilterStatus = statusVal;
    this.renderFilteredList();
  },

  handleSearch(queryVal) {
    AppState.activeSearchQuery = queryVal.toLowerCase().trim();
    this.renderFilteredList();
  },

  renderFilteredList() {
    const isAdminOrViewer = (AppState.user && (AppState.user.role === 'ADMIN' || AppState.user.role === 'VIEWER'));
    const list = isAdminOrViewer ? (AppState.allRequests || []) : ((AppState.myRequests && AppState.myRequests.length > 0) ? AppState.myRequests : (AppState.allRequests || []));

    const filtered = (list || []).filter(item => {
      let matchesStatus = (!AppState.activeFilterStatus || AppState.activeFilterStatus === 'ALL') || (item.status === AppState.activeFilterStatus);
      let matchesSearch = true;
      if (AppState.activeSearchQuery) {
        matchesSearch = (item.request_id && item.request_id.toLowerCase().includes(AppState.activeSearchQuery)) ||
                        (item.user_name && item.user_name.toLowerCase().includes(AppState.activeSearchQuery)) ||
                        (item.file_name && item.file_name.toLowerCase().includes(AppState.activeSearchQuery));
      }
      return matchesStatus && matchesSearch;
    });

    if (isAdminOrViewer) {
      this.renderAdminTable(filtered);
    } else {
      this.renderUserCards(filtered);
    }
  },

  renderAdminTable(items) {
    const container = document.getElementById('requests-list-container');
    if (!container) return;

    if (!items || items.length === 0) {
      container.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-tertiary);">Tidak ada permohonan cetak yang ditemukan.</div>`;
      return;
    }

    let html = `
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 40px;"><input type="checkbox" onchange="StatusModule.toggleSelectAll(this.checked)"></th>
              <th>Antrean</th>
              <th>Pemohon</th>
              <th>Dokumen</th>
              <th>Spesifikasi</th>
              <th>Copy</th>
              <th>Deadline</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
    `;

    items.forEach(req => {
      const badgeClass = 'badge-' + req.status.toLowerCase();
      const isAdmin = (AppState.user.role === 'ADMIN');
      const isChecked = AppState.selectedBatchIds.includes(req.request_id);

      html += `
        <tr>
          <td><input type="checkbox" class="request-batch-checkbox" value="${req.request_id}" ${isChecked ? 'checked' : ''} onchange="StatusModule.toggleSelectOne('${req.request_id}', this.checked)"></td>
          <td><strong>${req.request_id}</strong></td>
          <td>
            <div style="font-weight: 500;">${req.user_name}</div>
            <div style="font-size: 11px; color: var(--text-secondary);">${req.user_email}</div>
          </td>
          <td>
            <a href="${req.file_url}" target="_blank" style="color: var(--primary); text-decoration: none; font-weight: 500;">
              📎 ${req.file_name}
            </a>
          </td>
          <td style="font-size: 11px;">
            ${req.paper_size} | ${req.color_mode} | ${req.orientation} | ${req.duplex}
          </td>
          <td style="text-align: center;"><strong>${req.copies}</strong></td>
          <td style="font-size: 11px;">${req.deadline}</td>
          <td><span class="badge-status ${badgeClass}">${req.status}</span></td>
          <td>
            ${isAdmin ? `
              <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                <button class="btn btn-primary btn-sm" onclick="StatusModule.quickChangeStatus('${req.request_id}', 'PRINTING', 'Sedang dalam proses cetak')">⚡ Cetak</button>
                <button class="btn btn-sm" style="background: var(--success); color: white;" onclick="StatusModule.quickChangeStatus('${req.request_id}', 'READY', 'Siap diambil')">📦 Siap</button>
                <button class="btn btn-danger btn-sm" onclick="StatusModule.openTroubleModal('${req.request_id}')">⚠️ Trouble</button>
              </div>
            ` : '-'}
          </td>
        </tr>
      `;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;
  },

  renderUserCards(items) {
    const container = document.getElementById('requests-list-container');
    if (!container) return;

    if (!items || items.length === 0) {
      container.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-tertiary);">Anda belum memiliki riwayat permohonan cetak.</div>`;
      return;
    }

    let html = `<div style="display: flex; flex-direction: column; gap: 12px;">`;

    items.forEach(req => {
      const badgeClass = 'badge-' + req.status.toLowerCase();
      html += `
        <div style="border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 16px; background: white; display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-family: var(--font-heading); font-weight: 700; font-size: 15px; color: var(--primary);">${req.request_id}</span>
            <span class="badge-status ${badgeClass}">${req.status}</span>
          </div>

          <div style="display: flex; align-items: center; gap: 8px; font-weight: 500;">
            <span>📄</span>
            <a href="${req.file_url}" target="_blank" style="color: var(--text-primary); text-decoration: none;">${req.file_name}</a>
          </div>

          <div style="font-size: 12px; color: var(--text-secondary); display: flex; flex-wrap: wrap; gap: 12px; margin-top: 4px;">
            <span>📐 Kertas: <strong>${req.paper_size}</strong></span>
            <span>🎨 Warna: <strong>${req.color_mode}</strong></span>
            <span>📄 Copies: <strong>${req.copies} rangkap</strong></span>
            <span>⏰ Deadline: <strong>${req.deadline}</strong></span>
          </div>

          ${req.admin_notes && req.admin_notes !== '-' ? `
            <div style="font-size: 12px; background: var(--surface-variant); padding: 8px 12px; border-radius: var(--radius-sm); margin-top: 4px;">
              💬 <strong>Catatan Sekretariat / Kendala:</strong> ${req.admin_notes}
            </div>
          ` : ''}
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;
  },

  toggleSelectAll(checked) {
    const checkboxes = document.querySelectorAll('.request-batch-checkbox');
    AppState.selectedBatchIds = [];
    checkboxes.forEach(cb => {
      cb.checked = checked;
      if (checked) AppState.selectedBatchIds.push(cb.value);
    });
    this.updateBatchToolbar();
  },

  toggleSelectOne(reqId, checked) {
    if (checked) {
      if (!AppState.selectedBatchIds.includes(reqId)) AppState.selectedBatchIds.push(reqId);
    } else {
      AppState.selectedBatchIds = AppState.selectedBatchIds.filter(id => id !== reqId);
    }
    this.updateBatchToolbar();
  },

  updateBatchToolbar() {
    const toolbar = document.getElementById('batch-action-toolbar');
    const countLabel = document.getElementById('batch-selected-count');
    if (!toolbar) return;

    if (AppState.selectedBatchIds.length > 0) {
      toolbar.style.display = 'flex';
      countLabel.innerText = `${AppState.selectedBatchIds.length} Antrean Dipilih`;
    } else {
      toolbar.style.display = 'none';
    }
  },

  async executeBatchUpdate(newStatus) {
    if (AppState.selectedBatchIds.length === 0) return;

    try {
      const res = await callApi('batchUpdateRequestStatus', {
        request_ids: AppState.selectedBatchIds,
        status: newStatus,
        admin_notes: `Batch update status ke ${newStatus}`
      });
      UIModule.showToast(`${res.updatedCount} antrean diubah ke status ${newStatus}.`, 'success');
      await this.loadData();
    } catch (e) {
      console.error(e);
    }
  },

  async quickChangeStatus(reqId, status, notes) {
    try {
      await callApi('updateRequestStatus', {
        request_id: reqId,
        status: status,
        admin_notes: notes || 'Update alur kerja'
      });
      UIModule.showToast(`Status permohonan ${reqId} diubah ke ${status}.`, 'success');
      if (AppState.activeView === 'dashboard') {
        await DashboardModule.loadData();
      } else {
        await this.loadData();
      }
    } catch (e) {
      console.error(e);
    }
  },

  openTroubleModal(reqId) {
    document.getElementById('trouble-req-id').value = reqId;
    document.getElementById('trouble-req-display').value = reqId;
    document.getElementById('trouble-preset-select').selectedIndex = 0;
    document.getElementById('trouble-custom-notes').value = 'Tinta / Toner Printer Habis';
    UIModule.openModal('modal-report-trouble');
  },

  handleTroublePresetChange(val) {
    const textarea = document.getElementById('trouble-custom-notes');
    textarea.value = (val === 'CUSTOM' ? '' : val);
    if (val === 'CUSTOM') textarea.focus();
  },

  async submitTroubleReport() {
    const reqId = document.getElementById('trouble-req-id').value;
    const notes = document.getElementById('trouble-custom-notes').value;

    if (!notes || notes.trim() === '') {
      UIModule.showToast('Alasan kendala / trouble wajib diisi.', 'error');
      return;
    }

    try {
      await callApi('updateRequestStatus', {
        request_id: reqId,
        status: 'REJECTED',
        admin_notes: 'KENDALA: ' + notes
      });
      UIModule.closeModal('modal-report-trouble');
      UIModule.showToast(`Kendala pada ${reqId} dilaporkan (Status: REJECTED).`, 'success');
      await this.loadData();
    } catch (e) {
      console.error(e);
    }
  },

  exportSummaryReport() {
    const list = AppState.allRequests || AppState.myRequests || [];
    if (list.length === 0) {
      UIModule.showToast('Tidak ada data permohonan untuk diekspor.', 'error');
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "No Antrean,Pemohon,Email,Nama File,Spesifikasi,Copies,Deadline,Status\n";

    list.forEach(item => {
      const specs = `${item.paper_size} | ${item.color_mode} | ${item.orientation}`;
      const rowStr = `"${item.request_id}","${item.user_name}","${item.user_email}","${item.file_name}","${specs}","${item.copies}","${item.deadline}","${item.status}"`;
      csvContent += rowStr + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Tibyan_Print_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    UIModule.showToast('Laporan ringkasan cetak berhasil diunduh (CSV).', 'success');
  }
};
