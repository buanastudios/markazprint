/**
 * MARKAZ PRINTING v3.0
 * Powered by Buana Studios for Yayasan T.I.B.Y.A.N.
 * request.js - Print Request Form, Drag-and-Drop & Google Drive File Upload Module
 *
 * File storage: Google Drive (via GAS endpoint)
 * Request metadata: Firebase Firestore
 */

const RequestModule = {
  setupDragAndDrop() {
    const dropZone = document.getElementById('uploader-drop-box');
    if (!dropZone) return;

    if (dropZone.dataset.listenersBound === 'true') return;
    dropZone.dataset.listenersBound = 'true';

    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('dragover');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('dragover');
      }, false);
    });

    dropZone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files && files.length > 0) {
        this.processSelectedFile(files[0]);
      }
    }, false);
  },

  switchUploadTab(tabType) {
    AppState.activeUploadTab = tabType;
    const tabFile = document.getElementById('tab-btn-file');
    const tabLink = document.getElementById('tab-btn-link');
    const modeFile = document.getElementById('upload-mode-file');
    const modeLink = document.getElementById('upload-mode-link');

    if (tabFile) tabFile.classList.toggle('active', tabType === 'file');
    if (tabLink) tabLink.classList.toggle('active', tabType === 'link');
    if (modeFile) modeFile.style.display = (tabType === 'file' ? 'block' : 'none');
    if (modeLink) modeLink.style.display = (tabType === 'link' ? 'block' : 'none');
  },

  handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) this.processSelectedFile(file);
  },

  processSelectedFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!APP_CONFIG.ALLOWED_EXTENSIONS.includes(ext)) {
      UIModule.showToast(`Format .${ext} tidak didukung. Unggah PDF, DOCX, XLSX, TXT.`, 'error');
      return;
    }

    const maxMb = APP_CONFIG.MAX_FILE_SIZE_MB;
    if (file.size > maxMb * 1024 * 1024) {
      UIModule.showToast(`Ukuran file (${(file.size / (1024 * 1024)).toFixed(1)} MB) melebihi batas ${maxMb} MB.`, 'error');
      return;
    }

    AppState.selectedFile = file;

    // Read as Base64 for GAS Drive upload
    const reader = new FileReader();
    reader.onload = (e) => {
      AppState.selectedFileBase64 = e.target.result;
      const cardName = document.getElementById('file-card-name');
      const cardSize = document.getElementById('file-card-size');
      const fileInfo = document.getElementById('selected-file-info');
      const dropBox = document.getElementById('uploader-drop-box');

      if (cardName) cardName.innerText = file.name;
      if (cardSize) cardSize.innerText = (file.size / 1024).toFixed(1) + ' KB';
      if (fileInfo) fileInfo.style.display = 'flex';
      if (dropBox) dropBox.style.display = 'none';
    };
    reader.readAsDataURL(file);
  },

  removeSelectedFile() {
    AppState.selectedFile = null;
    AppState.selectedFileBase64 = null;
    const inputField = document.getElementById('file-input-field');
    const fileInfo = document.getElementById('selected-file-info');
    const dropBox = document.getElementById('uploader-drop-box');

    if (inputField) inputField.value = '';
    if (fileInfo) fileInfo.style.display = 'none';
    if (dropBox) dropBox.style.display = 'block';
  },

  resetForm() {
    this.removeSelectedFile();
    this.switchUploadTab('file');
    const form = document.getElementById('form-new-request');
    if (form) form.reset();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const deadlineInput = document.getElementById('req-deadline');
    if (deadlineInput) {
      deadlineInput.value = tomorrow.toISOString().slice(0, 16);
    }

    this.setupDragAndDrop();
  },

  /**
   * Uploads a file to Google Drive via the Google Apps Script endpoint.
   * The GAS function saves the file to a designated Drive folder and returns
   * the public Drive view URL.
   *
   * @param {File} file - The file object
   * @param {string} base64Data - The base64-encoded file content (data URL)
   * @returns {Promise<{url: string, fileId: string}>}
   */
  async uploadFileToDrive(file, base64Data) {
    const gasUrl = APP_CONFIG.GAS_UPLOAD_URL;
    if (!gasUrl) {
      // No GAS endpoint — return placeholder (offline/demo mode)
      console.warn('[Drive Upload] GAS_UPLOAD_URL not set. Skipping upload.');
      return { url: '#', fileId: 'demo_' + Date.now() };
    }

    const submitBtn = document.getElementById('btn-submit-request');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = 'Mengunggah ke Drive...';
    }

    try {
      const body = JSON.stringify({
        action: 'uploadFileToDrive',
        payload: {
          file_name: file.name,
          file_mime: file.type,
          file_data: base64Data  // base64 data URL
        }
      });

      const response = await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body
      });

      const text = await response.text();
      if (text.trim().startsWith('<')) {
        throw new Error('GAS endpoint mengembalikan HTML. Pastikan Web App diset ke "Anyone".');
      }

      const result = JSON.parse(text);
      if (!result.success) throw new Error(result.message || 'Upload ke Drive gagal.');

      return { url: result.data.file_url, fileId: result.data.file_id };
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = 'Kirim Permohonan';
      }
    }
  },

  async handleSubmit(event) {
    event.preventDefault();

    const payload = {
      paper_size: document.querySelector('input[name="paper_size"]:checked')?.value || 'A4',
      orientation: document.querySelector('input[name="orientation"]:checked')?.value || 'Portrait',
      color_mode: document.querySelector('input[name="color_mode"]:checked')?.value || 'Black White',
      duplex: document.querySelector('input[name="duplex"]:checked')?.value || 'Single',
      copies: document.getElementById('req-copies')?.value || 1,
      stapler: document.querySelector('input[name="stapler"]:checked')?.value || 'No',
      deadline: document.getElementById('req-deadline')?.value || '-',
      notes: document.getElementById('req-notes')?.value || '-'
    };

    if (AppState.activeUploadTab === 'file') {
      if (!AppState.selectedFile || !AppState.selectedFileBase64) {
        UIModule.showToast('Harap pilih atau tarik dokumen yang akan dicetak.', 'error');
        return;
      }

      payload.file_name = AppState.selectedFile.name;
      payload.file_mime = AppState.selectedFile.type;

      try {
        // Upload file to Google Drive via GAS, get back the Drive URL
        UIModule.showToast('Mengunggah dokumen ke Google Drive...', 'info');
        const { url, fileId } = await this.uploadFileToDrive(
          AppState.selectedFile,
          AppState.selectedFileBase64
        );
        payload.file_url = url;
        payload.file_id = fileId;
      } catch (uploadErr) {
        UIModule.showToast(uploadErr.message, 'error');
        return;
      }

    } else {
      const driveUrl = document.getElementById('req-drive-url')?.value;
      if (!driveUrl) {
        UIModule.showToast('Harap masukkan tautan Google Drive / Google Docs.', 'error');
        return;
      }
      payload.drive_url = driveUrl;
      payload.file_url = driveUrl;
      payload.file_name = document.getElementById('req-drive-title')?.value || 'Dokumen Google Drive';
    }

    try {
      // 3. Create the Firestore document
      const res = await callApi('createPrintRequest', payload);
      UIModule.showToast(`Berhasil! Nomor Antrean: ${res.queueId}`, 'success');
      Router.switchView('status');
    } catch (err) {
      console.error('Request submit error:', err);
    }
  }
};
