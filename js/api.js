/**
 * TIBYAN PRINT SERVICE v2.0
 * api.js - REST API Client with CORS & Redirect Handling
 */

/**
 * Universal Client API Communicator
 * Supports both GitHub Pages (fetch REST) and Apps Script Container (google.script.run)
 */
async function callApi(action, payload = {}) {
  showLoading(true);

  // Check if running inside Google Apps Script iframe container
  if (typeof google !== 'undefined' && google.script && google.script.run) {
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

  // Standalone REST API execution (GitHub Pages Deployment)
  try {
    const apiUrl = APP_CONFIG.API_URL;
    if (!apiUrl) {
      // Fallback demo mock if API_URL is not yet configured by admin
      console.warn('API_URL is not configured in config.js. Utilizing local session mode.');
    }

    const requestBody = {
      action: action,
      payload: payload,
      userEmail: AppState.user ? AppState.user.email : ''
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Prevents preflight request issues with Apps Script
      },
      body: JSON.stringify(requestBody)
    });

    showLoading(false);
    const result = await response.json();

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
    // If API URL is unconfigured, return user friendly notification
    if (!APP_CONFIG.API_URL) {
      showToast('Harap konfigurasikan API_URL di config.js untuk terhubung ke Google Apps Script backend.', 'error');
    } else {
      showToast('Gagal terhubung ke API Server. Periksa koneksi internet Anda.', 'error');
    }
    throw err;
  }
}
