/**
 * MARKAZ PRINTING v2.0
 * Powered by Buana Studios for Yayasan T.I.B.Y.A.N.
 * api.js - Firebase Firestore & Storage API Dispatcher
 *
 * Replaces the Google Apps Script REST API gateway.
 * All callApi() actions now operate directly against Firestore collections
 * and Firebase Storage. The local demo fallback is preserved for offline use.
 */

// ─── Firestore Collection References ──────────────────────────────────────────

const COLLECTIONS = {
  REQUESTS: 'printRequests',
  USERS: 'users'
};

// ─── ID Generator ─────────────────────────────────────────────────────────────

/**
 * Generates a sequential queue ID in the format PRN-YYYYMMDD-NNNN.
 * Uses Firestore timestamp for the date component.
 */
function generateQueueId(sequenceNumber) {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const seq = ('000' + sequenceNumber).slice(-4);
  return `PRN-${dateStr}-${seq}`;
}

// ─── Universal API Dispatcher ─────────────────────────────────────────────────

/**
 * Central API dispatcher — routes each action to the correct Firebase operation.
 * Maintains the same interface as the previous GAS implementation so all
 * feature modules (dashboard, status, request, users) work without changes.
 *
 * @param {string} action - The action name (e.g., 'createPrintRequest')
 * @param {Object} payload - Action-specific parameters
 * @returns {Promise<any>} Resolved data or throws on error
 */
async function callApi(action, payload = {}) {
  // Guard: Firebase must be initialized before any call
  if (typeof firebase === 'undefined' || !firebase.apps.length) {
    console.warn('[API] Firebase not ready – falling back to local demo mode.');
    return handleLocalDemoMode(action, payload);
  }

  showLoading(true);

  try {
    const result = await dispatchFirebaseAction(action, payload);
    showLoading(false);
    return result;
  } catch (err) {
    showLoading(false);
    console.error(`[Firebase API Error] action="${action}":`, err);
    showToast(err.message || 'Gagal terhubung ke Firebase. Periksa koneksi internet Anda.', 'error');
    throw err;
  }
}

// ─── Firebase Action Router ───────────────────────────────────────────────────

async function dispatchFirebaseAction(action, payload) {
  const currentUser = AppState.user || {
    email: 'guru@tibyan.org',
    name: 'Guru At-Tibyan',
    role: 'USER',
    department: 'Pengajar / Staff',
    status: 'ACTIVE'
  };

  switch (action) {

    // ── Identity ──────────────────────────────────────────────────────────────
    case 'getCurrentUser': {
      // With no Firebase Auth yet, we resolve from AppState (localStorage identity)
      return Promise.resolve(currentUser);
    }

    // ── User Dashboard ────────────────────────────────────────────────────────
    case 'getUserDashboard': {
      const snap = await db.collection(COLLECTIONS.REQUESTS).get();
      const allReqs = snap.docs
        .map(d => ({ id: d.id, ...d.data(), created_at: d.data().created_at?.toDate?.()?.toISOString() || new Date().toISOString() }))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      const emailLower = (currentUser.email || '').toLowerCase();
      let requests = allReqs.filter(r => (r.user_email || '').toLowerCase() === emailLower);
      if (requests.length === 0 && allReqs.length > 0) {
        requests = allReqs; // Fallback to ensure records are never hidden
      }

      AppState.myRequests = requests;
      AppState.allRequests = allReqs;

      const stats = {
        total: requests.length,
        waiting: requests.filter(r => r.status === 'WAITING').length,
        printing: requests.filter(r => r.status === 'PRINTING').length,
        ready: requests.filter(r => r.status === 'READY').length,
        completed: requests.filter(r => r.status === 'COMPLETED').length,
        rejected: requests.filter(r => r.status === 'REJECTED').length
      };

      return { user: currentUser, stats, recentRequests: requests.slice(0, 5) };
    }

    // ── Admin Dashboard ───────────────────────────────────────────────────────
    case 'getAdminDashboard': {
      const snap = await db.collection(COLLECTIONS.REQUESTS).get();

      const allReqs = snap.docs
        .map(d => ({ id: d.id, ...d.data(), created_at: d.data().created_at?.toDate?.()?.toISOString() || new Date().toISOString() }))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      AppState.allRequests = allReqs;

      // Aggregate counters
      const today = new Date().toISOString().slice(0, 10);
      const counters = {
        total: allReqs.length,
        waiting: allReqs.filter(r => r.status === 'WAITING').length,
        printing: allReqs.filter(r => r.status === 'PRINTING').length,
        ready: allReqs.filter(r => r.status === 'READY').length,
        completed: allReqs.filter(r => r.status === 'COMPLETED').length,
        rejected: allReqs.filter(r => r.status === 'REJECTED').length,
        totalCopiesPrinted: allReqs.filter(r => r.status === 'COMPLETED').reduce((s, r) => s + (parseInt(r.copies) || 0), 0),
        todayCopiesPrinted: allReqs
          .filter(r => r.status === 'COMPLETED' && r.created_at && r.created_at.startsWith(today))
          .reduce((s, r) => s + (parseInt(r.copies) || 0), 0)
      };

      // Analytics
      const analytics = {
        paperStats: {
          A4: allReqs.filter(r => r.paper_size === 'A4').reduce((s, r) => s + (parseInt(r.copies) || 0), 0),
          F4: allReqs.filter(r => r.paper_size === 'F4').reduce((s, r) => s + (parseInt(r.copies) || 0), 0),
          A5: allReqs.filter(r => r.paper_size === 'A5').reduce((s, r) => s + (parseInt(r.copies) || 0), 0)
        },
        colorStats: {
          'Black White': allReqs.filter(r => r.color_mode === 'Black White').reduce((s, r) => s + (parseInt(r.copies) || 0), 0),
          'Color': allReqs.filter(r => r.color_mode === 'Color').reduce((s, r) => s + (parseInt(r.copies) || 0), 0)
        }
      };

      // Queued by status
      const queues = {
        waiting: allReqs.filter(r => r.status === 'WAITING'),
        printing: allReqs.filter(r => r.status === 'PRINTING'),
        ready: allReqs.filter(r => r.status === 'READY'),
        completed: allReqs.filter(r => r.status === 'COMPLETED')
      };

      // User stats
      const usersSnap = await db.collection(COLLECTIONS.USERS).get();
      const usersList = usersSnap.docs.map(d => d.data());
      const userStats = {
        totalUsers: usersList.length,
        totalAdmins: usersList.filter(u => u.role === 'ADMIN').length,
        totalTeachers: usersList.filter(u => u.role === 'USER').length
      };

      return { user: currentUser, counters, analytics, queues, userStats, recentLogs: [] };
    }

    // ── My Requests ───────────────────────────────────────────────────────────
    case 'getMyRequests': {
      const snap = await db.collection(COLLECTIONS.REQUESTS).get();
      const allReqs = snap.docs
        .map(d => ({ id: d.id, ...d.data(), created_at: d.data().created_at?.toDate?.()?.toISOString() || new Date().toISOString() }))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      const emailLower = (currentUser.email || '').toLowerCase();
      let requests = allReqs.filter(r => (r.user_email || '').toLowerCase() === emailLower);
      if (requests.length === 0 && allReqs.length > 0) {
        requests = allReqs;
      }

      AppState.myRequests = requests;
      AppState.allRequests = allReqs;
      return requests;
    }

    // ── All Requests (Admin) ──────────────────────────────────────────────────
    case 'getAllRequests': {
      // Fetch all then filter client-side to avoid composite index requirements
      const snap = await db.collection(COLLECTIONS.REQUESTS).get();
      let requests = snap.docs
        .map(d => ({ id: d.id, ...d.data(), created_at: d.data().created_at?.toDate?.()?.toISOString() || new Date().toISOString() }))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      if (payload.status && payload.status !== 'ALL') {
        requests = requests.filter(r => r.status === payload.status);
      }

      AppState.allRequests = requests;
      return requests;
    }

    // ── Create Print Request ──────────────────────────────────────────────────
    case 'createPrintRequest': {
      // Count existing requests for sequential ID safely
      const countSnap = await db.collection(COLLECTIONS.REQUESTS).get();
      const queueId = generateQueueId(countSnap.size + 1);

      const docData = {
        request_id: queueId,
        user_email: currentUser.email,
        user_name: currentUser.name,
        file_name: payload.file_name || 'Dokumen_Cetak.pdf',
        file_url: payload.file_url || '#',  // Storage download URL, set by request.js before calling this
        file_storage_path: payload.file_storage_path || '',
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
        created_at: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection(COLLECTIONS.REQUESTS).add(docData);
      console.log('[Firestore] Created print request:', queueId, '| Doc ID:', docRef.id);

      // Log analytics event
      if (typeof analytics !== 'undefined') {
        analytics.logEvent('print_request_created', {
          paper_size: payload.paper_size,
          color_mode: payload.color_mode,
          copies: payload.copies
        });
      }

      return { queueId, fileUrl: payload.file_url || '#', docId: docRef.id };
    }

    // ── Update Single Request Status ──────────────────────────────────────────
    case 'updateRequestStatus': {
      // Find the document with matching request_id field
      const snap = await db.collection(COLLECTIONS.REQUESTS)
        .where('request_id', '==', payload.request_id)
        .limit(1)
        .get();

      if (snap.empty) {
        throw new Error(`Permohonan ${payload.request_id} tidak ditemukan di database.`);
      }

      await snap.docs[0].ref.update({
        status: payload.status,
        admin_notes: payload.admin_notes || '-',
        updated_at: firebase.firestore.FieldValue.serverTimestamp()
      });

      console.log('[Firestore] Updated status:', payload.request_id, '→', payload.status);
      return { request_id: payload.request_id, status: payload.status };
    }

    // ── Batch Update Status ───────────────────────────────────────────────────
    case 'batchUpdateRequestStatus': {
      if (!payload.request_ids || !Array.isArray(payload.request_ids) || payload.request_ids.length === 0) {
        return { updatedCount: 0, status: payload.status };
      }

      const batch = db.batch();
      let updatedCount = 0;

      // Firestore 'in' queries are limited to 30 items — chunk if needed
      const chunkSize = 30;
      for (let i = 0; i < payload.request_ids.length; i += chunkSize) {
        const chunk = payload.request_ids.slice(i, i + chunkSize);
        const snap = await db.collection(COLLECTIONS.REQUESTS)
          .where('request_id', 'in', chunk)
          .get();

        snap.docs.forEach(doc => {
          batch.update(doc.ref, {
            status: payload.status,
            admin_notes: payload.admin_notes || `Batch update ke ${payload.status}`,
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
          });
          updatedCount++;
        });
      }

      await batch.commit();
      console.log('[Firestore] Batch updated', updatedCount, 'documents →', payload.status);
      return { updatedCount, status: payload.status };
    }

    // ── Get All Users ─────────────────────────────────────────────────────────
    case 'getAllUsers': {
      const snap = await db.collection(COLLECTIONS.USERS).get();
      const users = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => (a.name || '').localeCompare(b.name || ''));
      AppState.usersList = users;
      return users;
    }

    // ── Update User Status ────────────────────────────────────────────────────
    case 'updateUserStatus': {
      await db.collection(COLLECTIONS.USERS).doc(payload.email).update({
        status: payload.status,
        updated_at: firebase.firestore.FieldValue.serverTimestamp()
      });
      return { success: true };
    }

    // ── Save / Upsert User ────────────────────────────────────────────────────
    case 'saveUser': {
      await db.collection(COLLECTIONS.USERS).doc(payload.email).set({
        email: payload.email,
        name: payload.name,
        role: payload.role,
        department: payload.department || '',
        status: 'ACTIVE',
        updated_at: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      return { success: true };
    }

    default:
      console.warn('[Firebase API] Unknown action:', action);
      return null;
  }
}

// ─── Local Demo / Offline Fallback ────────────────────────────────────────────

/**
 * Local Demonstration Mode Simulator.
 * Activates automatically when Firebase is unreachable or not yet configured.
 * Mirrors the full API surface so UI modules work without changes.
 */
function handleLocalDemoMode(action, payload) {
  console.log(`[Local Demo Mode] action: ${action}`, payload);

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
        file_name: 'Soal_Ujian_IPA_Kelas_8.pdf',
        file_url: '#',
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
        file_name: 'Modul_Pembelajaran_Tahfizh.docx',
        file_url: '#',
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

    case 'createPrintRequest': {
      const newSeq = ('000' + (AppState.allRequests.length + 1)).slice(-4);
      const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const newQueueId = `PRN-${todayStr}-${newSeq}`;

      const newReq = {
        request_id: newQueueId,
        user_email: currentUser.email,
        user_name: currentUser.name,
        file_name: payload.file_name || 'Dokumen_Cetak.pdf',
        file_url: payload.file_url || '#',
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
    }

    case 'updateRequestStatus': {
      const targetReq = AppState.allRequests.find(r => r.request_id === payload.request_id);
      if (targetReq) {
        targetReq.status = payload.status;
        targetReq.admin_notes = payload.admin_notes || '-';
      }
      return Promise.resolve({ request_id: payload.request_id, status: payload.status });
    }

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
