/**
 * MARKAZ PRINTING v2.0
 * Powered by Buana Studios for Yayasan T.I.B.Y.A.N.
 * request.js - Print Request Form, Drag-and-Drop & Firebase Storage Upload Module
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

    // Show file info card (no longer need base64 for preview)
    const cardName = document.getElementById('file-card-name');
    const cardSize = document.getElementById('file-card-size');
    const fileInfo = document.getElementById('selected-file-info');
    const dropBox = document.getElementById('uploader-drop-box');

    if (cardName) cardName.innerText = file.name;
    if (cardSize) cardSize.innerText = (file.size / 1024).toFixed(1) + ' KB';
    if (fileInfo) fileInfo.style.display = 'flex';
    if (dropBox) dropBox.style.display = 'none';
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
   * Uploads a file to Firebase Storage and returns its public download URL.
   * Shows a progress bar during upload.
   *
   * @param {File} file - The file object to upload
   * @param {string} queueId - Used to build a unique storage path
   * @returns {Promise<{url: string, path: string}>}
   */
  uploadFileToStorage(file, queueId) {
    return new Promise((resolve, reject) => {
      // Guard: if Firebase Storage isn't available, skip upload
      if (typeof storage === 'undefined') {
        console.warn('[Storage] Firebase Storage not ready – skipping upload.');
        return resolve({ url: '#', path: '' });
      }

      const storagePath = `printFiles/${queueId}/${file.name}`;
      const storageRef = storage.ref(storagePath);
      const uploadTask = storageRef.put(file);

      // Show upload progress in the submit button
      const submitBtn = document.getElementById('btn-submit-request');
      if (submitBtn) submitBtn.disabled = true;

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          if (submitBtn) submitBtn.innerText = `Mengunggah... ${progress}%`;
        },
        (err) => {
          console.error('[Storage] Upload error:', err);
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = 'Kirim Permohonan';
          }
          reject(new Error('Gagal mengunggah file ke Firebase Storage: ' + err.message));
        },
        async () => {
          const downloadUrl = await uploadTask.snapshot.ref.getDownloadURL();
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = 'Kirim Permohonan';
          }
          resolve({ url: downloadUrl, path: storagePath });
        }
      );
    });
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
      if (!AppState.selectedFile) {
        UIModule.showToast('Harap pilih atau tarik dokumen yang akan dicetak.', 'error');
        return;
      }

      payload.file_name = AppState.selectedFile.name;

      try {
        // 1. Generate a temporary queue ID for storage path naming
        //    (the real sequential ID will be generated inside callApi)
        const tempId = `PRN-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-TEMP-${Date.now()}`;

        // 2. Upload file to Firebase Storage first
        UIModule.showToast('Mengunggah dokumen ke Firebase Storage...', 'info');
        const { url, path } = await this.uploadFileToStorage(AppState.selectedFile, tempId);

        payload.file_url = url;
        payload.file_storage_path = path;
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
