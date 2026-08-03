/**
 * MARKAZ PRINTING v2.0
 * Powered by Buana Studios for Yayasan T.I.B.Y.A.N.
 * api.js - Robust REST API Client with Offline Local Mode & HTML Error Catching
 */

/**
 * Universal Client API Communicator
 */
async function callApi(action, payload = {}) {
  // 1. Container execution fallback (Inside Apps Script Editor Iframe)
  if (typeof google !== 'undefined' && google.script && google.script.run) {
    showLoading(true);
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler((response) => {
          showLoading(false);
          if (response && response.success) {
            resolve(response.data);
          } else {
            const errorMsg = response ? response.message : 'Terjadi kesalahan sistem.';
            showToast(errorMsg, 'error');
            reject(new Error(errorMsg));
          }
        })
        .withFailureHandler((err) => {
          showLoading(false);
          const errorMsg = err ? err.message : 'Gagal terhubung ke server Google Apps Script.';
          showToast(errorMsg, 'error');
          reject(err);
        })
        .apiDispatcher(action, payload);
    });
  }

  const apiUrl = (APP_CONFIG && APP_CONFIG.API_URL) ? APP_CONFIG.API_URL.trim() : '';

  // 2. Offline / Local Demo Mode (GitHub Pages before API_URL is configured)
  if (!apiUrl) {
    return handleLocalDemoMode(action, payload);
  }

  // 3. Live Server Mode (Fetch POST to Google Apps Script Web App)
  showLoading(true);
  try {
    const requestBody = {
      action: action,
      payload: payload,
      userEmail: AppState.user ? AppState.user.email : ''
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8' // Avoids preflight OPTIONS issues with Apps Script
      },
      body: JSON.stringify(requestBody)
    });

    showLoading(false);
    const responseText = await response.text();

    // Check if response is HTML error page (e.g. 404, 405, Google Login Redirect)
    if (responseText.trim().startsWith('<') || responseText.includes('<!DOCTYPE html>')) {
      console.warn('API returned HTML error page instead of JSON:', responseText.slice(0, 200));
      throw new Error('Endpoint API mengembalikan respon HTML (Bukan JSON). Pastikan Web App diset "Who has access: Anyone".');
    }

    const result = JSON.parse(responseText);

    if (result && result.success) {
      return result.data;
    } else {
      const msg = result ? result.message : 'Gagal memproses data di server.';
      showToast(msg, 'error');
      throw new Error(msg);
    }
  } catch (err) {
    showLoading(false);
    console.error(`API Error on [${action}]:`, err);
    showToast(err.message || 'Gagal terhubung ke API Server. Periksa API_URL di config.js.', 'error');
    throw err;
  }
}

/**
 * Local Demonstration Mode Simulator
 * Allows GitHub Pages static web app to function 100% out-of-the-box
 */
function handleLocalDemoMode(action, payload) {
  console.log(`[Local Demo Mode] Dispatching action: ${action}`, payload);

  const currentUser = AppState.user || {
    email: 'guru@tibyan.org',
    name: 'Guru At-Tibyan',
    role: 'USER',
    department: 'Pengajar / Staff',
    status: 'ACTIVE'
  };

  // Seed sample requests if empty
  if (!AppState.myRequests || AppState.myRequests.length === 0) {
    AppState.myRequests = [
      {
        request_id: 'PRN-20260803-0001',
        user_email: 'guru@tibyan.org',
        user_name: 'Guru At-Tibyan',
        file_id: 'sample_file_1',
        file_name: 'Soal_Ujian_IPA_Kelas_8.pdf',
        file_url: '#',
        file_mime: 'application/pdf',
        paper_size: 'A4',
        orientation: 'Portrait',
        color_mode: 'Black White',
        duplex: 'Single',
        copies: 30,
        stapler: 'Yes',
        deadline: '2026-08-04 10:00',
        notes: 'Mohon di-stapler pojok kiri atas',
        status: 'WAITING',
        admin_notes: '-',
        created_at: new Date().toISOString()
      },
      {
        request_id: 'PRN-20260803-0002',
        user_email: 'guru@tibyan.org',
        user_name: 'Guru At-Tibyan',
        file_id: 'sample_file_2',
        file_name: 'Modul_Pembelajaran_Tahfizh.docx',
        file_url: '#',
        file_mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        paper_size: 'F4',
        orientation: 'Portrait',
        color_mode: 'Color',
        duplex: 'Double',
        copies: 15,
        stapler: 'No',
        deadline: '2026-08-05 14:00',
        notes: '-',
        status: 'PRINTING',
        admin_notes: 'Sedang proses pencetakan di mesin 1',
        created_at: new Date().toISOString()
      }
    ];
    AppState.allRequests = [...AppState.myRequests];
  }

  switch (action) {
    case 'getCurrentUser':
      return Promise.resolve(currentUser);

    case 'getUserDashboard':
      return Promise.resolve({
        user: currentUser,
        stats: { total: AppState.myRequests.length, waiting: 1, printing: 1, ready: 0, completed: 0, rejected: 0 },
        recentRequests: AppState.myRequests
      });

    case 'getAdminDashboard':
      return Promise.resolve({
        user: currentUser,
        counters: { total: AppState.allRequests.length, waiting: 1, printing: 1, ready: 0, completed: 0, rejected: 0, totalCopiesPrinted: 45, todayCopiesPrinted: 45 },
        analytics: { paperStats: { A4: 30, F4: 15, A5: 0 }, colorStats: { 'Black White': 30, 'Color': 15 } },
        queues: {
          waiting: AppState.allRequests.filter(r => r.status === 'WAITING'),
          printing: AppState.allRequests.filter(r => r.status === 'PRINTING'),
          ready: AppState.allRequests.filter(r => r.status === 'READY'),
          completed: AppState.allRequests.filter(r => r.status === 'COMPLETED')
        },
        userStats: { totalUsers: 3, totalAdmins: 1, totalTeachers: 2 },
        recentLogs: []
      });

    case 'getMyRequests':
      return Promise.resolve(AppState.myRequests);

    case 'getAllRequests':
      return Promise.resolve(AppState.allRequests);

    case 'createPrintRequest':
      const newSeq = ('000' + (AppState.allRequests.length + 1)).slice(-4);
      const todayStr = new Date().toISOString().slice(0,10).replace(/-/g,'');
      const newQueueId = `PRN-${todayStr}-${newSeq}`;

      const newReq = {
        request_id: newQueueId,
        user_email: currentUser.email,
        user_name: currentUser.name,
        file_id: 'demo_file_' + Date.now(),
        file_name: payload.file_name || 'Dokumen_Cetak.pdf',
        file_url: payload.drive_url || '#',
        file_mime: payload.file_mime || 'application/pdf',
        paper_size: payload.paper_size || 'A4',
        orientation: payload.orientation || 'Portrait',
        color_mode: payload.color_mode || 'Black White',
        duplex: payload.duplex || 'Single',
        copies: parseInt(payload.copies || 1, 10),
        stapler: payload.stapler || 'No',
        deadline: payload.deadline || '-',
        notes: payload.notes || '-',
        status: 'WAITING',
        admin_notes: '-',
        created_at: new Date().toISOString()
      };

      AppState.myRequests.unshift(newReq);
      AppState.allRequests.unshift(newReq);

      return Promise.resolve({ queueId: newQueueId, fileUrl: newReq.file_url });

    case 'updateRequestStatus':
      const targetReq = AppState.allRequests.find(r => r.request_id === payload.request_id);
      if (targetReq) {
        targetReq.status = payload.status;
        targetReq.admin_notes = payload.admin_notes || '-';
      }
      return Promise.resolve({ request_id: payload.request_id, status: payload.status });

    case 'batchUpdateRequestStatus':
      if (payload.request_ids && Array.isArray(payload.request_ids)) {
        payload.request_ids.forEach(id => {
          const req = AppState.allRequests.find(r => r.request_id === id);
          if (req) {
            req.status = payload.status;
            req.admin_notes = payload.admin_notes || '-';
          }
        });
      }
      return Promise.resolve({ updatedCount: payload.request_ids.length, status: payload.status });

    case 'getAllUsers':
      return Promise.resolve([
        { email: 'admin@tibyan.org', name: 'Super Admin Sekretariat', role: 'ADMIN', department: 'Sekretariat Utama', status: 'ACTIVE' },
        { email: 'guru@tibyan.org', name: 'Guru At-Tibyan', role: 'USER', department: 'Pengajar SD/SMP', status: 'ACTIVE' },
        { email: 'kepala@tibyan.org', name: 'Kepala Sekolah', role: 'VIEWER', department: 'Manajemen Sekolah', status: 'ACTIVE' }
      ]);

    case 'updateUserStatus':
      return Promise.resolve({ success: true });

    case 'saveUser':
      return Promise.resolve({ success: true });

    default:
      return Promise.resolve(null);
  }
}
