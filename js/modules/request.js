/**
 * TIBYAN PRINT SERVICE v2.0
 * request.js - Print Request Form & Native Drag-and-Drop Submission Module
 */

const RequestModule = {
  setupDragAndDrop() {
    const dropZone = document.getElementById('uploader-drop-box');
    if (!dropZone) return;

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
    document.getElementById('tab-btn-file').classList.toggle('active', tabType === 'file');
    document.getElementById('tab-btn-link').classList.toggle('active', tabType === 'link');

    document.getElementById('upload-mode-file').style.display = (tabType === 'file' ? 'block' : 'none');
    document.getElementById('upload-mode-link').style.display = (tabType === 'link' ? 'block' : 'none');
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

    const reader = new FileReader();
    reader.onload = (e) => {
      AppState.selectedFileBase64 = e.target.result;
      document.getElementById('file-card-name').innerText = file.name;
      document.getElementById('file-card-size').innerText = (file.size / 1024).toFixed(1) + ' KB';
      document.getElementById('selected-file-info').style.display = 'flex';
      document.getElementById('uploader-drop-box').style.display = 'none';
    };
    reader.readAsDataURL(file);
  },

  removeSelectedFile() {
    AppState.selectedFile = null;
    AppState.selectedFileBase64 = null;
    const inputField = document.getElementById('file-input-field');
    if (inputField) inputField.value = '';
    document.getElementById('selected-file-info').style.display = 'none';
    document.getElementById('uploader-drop-box').style.display = 'block';
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
  },

  async handleSubmit(event) {
    event.preventDefault();

    const payload = {
      paper_size: document.querySelector('input[name="paper_size"]:checked')?.value || 'A4',
      orientation: document.querySelector('input[name="orientation"]:checked')?.value || 'Portrait',
      color_mode: document.querySelector('input[name="color_mode"]:checked')?.value || 'Black White',
      duplex: document.querySelector('input[name="duplex"]:checked')?.value || 'Single',
      copies: document.getElementById('req-copies').value || 1,
      stapler: document.querySelector('input[name="stapler"]:checked')?.value || 'No',
      deadline: document.getElementById('req-deadline').value,
      notes: document.getElementById('req-notes').value || '-'
    };

    if (AppState.activeUploadTab === 'file') {
      if (!AppState.selectedFile || !AppState.selectedFileBase64) {
        UIModule.showToast('Harap pilih atau tarik dokumen yang akan dicetak.', 'error');
        return;
      }
      payload.file_name = AppState.selectedFile.name;
      payload.file_mime = AppState.selectedFile.type;
      payload.file_data = AppState.selectedFileBase64;
    } else {
      const driveUrl = document.getElementById('req-drive-url').value;
      if (!driveUrl) {
        UIModule.showToast('Harap masukkan tautan Google Drive / Google Docs.', 'error');
        return;
      }
      payload.drive_url = driveUrl;
      payload.file_name = document.getElementById('req-drive-title').value || 'Dokumen Google Drive';
    }

    try {
      const res = await callApi('createPrintRequest', payload);
      UIModule.showToast(`Berhasil! Nomor Antrean: ${res.queueId}`, 'success');
      Router.switchView('status');
    } catch (err) {
      console.error('Request submit error:', err);
    }
  }
};
