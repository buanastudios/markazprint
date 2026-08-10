# Google Apps Script Backend — Markaz Printing v3.0

## What this does

In **v3**, the GAS script has **one job only**:  
**Receive a file from the browser → save it to a Google Drive folder → return the Drive URL.**

All other data (queue, status, users) lives in **Firebase Firestore**.

---

## Setup Instructions

### Step 1 — Create a Google Drive folder

1. Go to [drive.google.com](https://drive.google.com)
2. Create a new folder, e.g. **"Markaz Print Files"**
3. Open the folder and copy its **ID** from the URL:
   ```
   https://drive.google.com/drive/folders/THIS_IS_THE_FOLDER_ID
   ```

### Step 2 — Create the Apps Script project

1. Go to [script.google.com](https://script.google.com)
2. Click **New Project**
3. Delete the default `function myFunction() {}` code
4. Paste the entire contents of **`Code.gs`**
5. Replace `YOUR_GOOGLE_DRIVE_FOLDER_ID_HERE` with your actual folder ID:
   ```js
   var DRIVE_FOLDER_ID = '1AbCdEfGhIjKlMnOpQrStUvWxYz'; // ← your folder ID here
   ```
6. Save (Ctrl+S), name the project **"Markaz Print v3"**

### Step 3 — Deploy as a Web App

1. Click **Deploy → New Deployment**
2. Click the gear icon ⚙️ next to "Type" → select **Web App**
3. Set:
   - **Description**: `Markaz Print v3 - Drive Upload Endpoint`
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
4. Click **Deploy**
5. **Copy the Web App URL** — it looks like:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```

### Step 4 — Update the frontend config

Paste the Web App URL into [`js/config.js`](../js/config.js):

```js
GAS_UPLOAD_URL: 'https://script.google.com/macros/s/AKfycb.../exec',
```

---

## Testing the endpoint

Open this URL in your browser to verify it's running:
```
https://script.google.com/macros/s/AKfycb.../exec
```

You should see:
```json
{
  "success": true,
  "message": "Markaz Printing v3.0 GAS Endpoint is running.",
  "timestamp": "2026-08-10T..."
}
```

---

## What the script does when called

1. Frontend sends a `POST` request with:
   ```json
   {
     "action": "uploadFileToDrive",
     "payload": {
       "file_name": "Soal_Ujian.pdf",
       "file_mime": "application/pdf",
       "file_data": "data:application/pdf;base64,JVBERi0..."
     }
   }
   ```

2. GAS decodes the Base64, creates the file in your Drive folder, sets it to **"Anyone with link can view"**

3. Returns:
   ```json
   {
     "success": true,
     "data": {
       "file_id": "1AbCdEfGh...",
       "file_url": "https://drive.google.com/file/d/1AbCdEfGh.../view",
       "file_name": "Soal_Ujian.pdf"
     }
   }
   ```

4. The frontend saves `file_url` into Firestore — admins click the link to open the file from Drive.

---

## Re-deploying after changes

If you edit `Code.gs`, you **must** create a **new deployment version**:
1. Deploy → Manage Deployments
2. Click the pencil ✏️ on your existing deployment
3. Change **Version** to `New version`
4. Click **Deploy**

> ⚠️ The Web App URL stays the same — no need to update `config.js` again.
