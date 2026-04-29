# Trình bày giải pháp cho tính năng copy as file trên app electron

***

## Tổng quan flow

```
[Button "Copy as File"]
        │ ipcRenderer.invoke()
        ▼
[Main Process]
        │ electron-clipboard-ex
        ▼
[OS Clipboard — CF_HDROP / NSPasteboard]
        │ Ctrl+V
        ▼
[Browser / Slack / Discord / bất kỳ app nào]
        → Nhận như drag-and-drop file thật
```

***

## Bước 1: Cài đặt dependencies

```bash
npm install electron-clipboard-ex
npm install --save-dev @electron/rebuild
```

Sau đó thêm script rebuild vào `package.json`:

```json
{
  "scripts": {
    "postinstall": "electron-rebuild",
    "rebuild": "electron-rebuild"
  }
}
```

Chạy rebuild lần đầu:

```bash
npm run rebuild
```

> **Lưu ý:** Mỗi khi update phiên bản Electron, phải chạy lại `npm run rebuild`. Nếu không rebuild, app sẽ crash khi `require('electron-clipboard-ex')`.

***

## Bước 2: Cấu trúc project

```
my-electron-app/
├── main.js
├── preload.js          ← bridge giữa main và renderer
├── renderer/
│   ├── index.html
│   └── app.js
└── package.json
```

***

## Bước 3: Main Process (`main.js`)

```js
const { app, BrowserWindow, ipcMain } = require('electron');
const clipboardEx = require('electron-clipboard-ex');
const path = require('path');
const fs = require('fs');
const os = require('os');

function createWindow() {
    const win = new BrowserWindow({
        width: 900,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,   // bảo mật — bắt buộc
            nodeIntegration: false,   // bảo mật — bắt buộc
        }
    });

    win.loadFile('renderer/index.html');
}

// ─── IPC Handler ────────────────────────────────────────────────────

// Case 1: File đã có sẵn trên disk → pass path thẳng
ipcMain.handle('copy-file-by-path', (event, filePath) => {
    try {
        if (!fs.existsSync(filePath)) {
            return { success: false, error: 'File không tồn tại: ' + filePath };
        }
        clipboardEx.writeFilePaths([filePath]);
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// Case 2: File là buffer trong memory (generated PDF, export data...)
// → Ghi ra temp file trước, rồi writeFilePaths
ipcMain.handle('copy-file-from-buffer', async (event, { buffer, filename }) => {
    try {
        const tempDir  = os.tmpdir();
        const tempPath = path.join(tempDir, filename);

        fs.writeFileSync(tempPath, Buffer.from(buffer));
        clipboardEx.writeFilePaths([tempPath]);

        // Dọn temp file sau 60s (đủ để user paste xong)
        setTimeout(() => {
            try { fs.unlinkSync(tempPath); } catch {}
        }, 60_000);

        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// Case 3: Copy nhiều file cùng lúc
ipcMain.handle('copy-multiple-files', (event, filePaths) => {
    try {
        const validPaths = filePaths.filter(p => fs.existsSync(p));
        if (validPaths.length === 0) {
            return { success: false, error: 'Không có file hợp lệ nào' };
        }
        clipboardEx.writeFilePaths(validPaths);
        return { success: true, count: validPaths.length };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

app.whenReady().then(createWindow);
```

***

## Bước 4: Preload (`preload.js`)

Preload là **bridge an toàn** giữa renderer và main — không expose thẳng `ipcRenderer` ra ngoài:

```js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('clipboardAPI', {

    // Copy file từ path
    copyFileByPath: (filePath) =>
        ipcRenderer.invoke('copy-file-by-path', filePath),

    // Copy file từ buffer (Uint8Array hoặc ArrayBuffer)
    copyFileFromBuffer: (buffer, filename) =>
        ipcRenderer.invoke('copy-file-from-buffer', { buffer, filename }),

    // Copy nhiều file
    copyMultipleFiles: (filePaths) =>
        ipcRenderer.invoke('copy-multiple-files', filePaths),
});
```

***

## Bước 5: Renderer UI (`renderer/index.html` + `app.js`)

```html
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Copy as File Demo</title>
    <style>
        body { font-family: sans-serif; padding: 32px; }

        .file-card {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
        }

        .copy-btn {
            padding: 8px 16px;
            background: #01696f;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: background 0.15s;
        }
        .copy-btn:hover { background: #0c4e54; }
        .copy-btn.success { background: #437a22; }
        .copy-btn.error   { background: #a12c7b; }

        #toast {
            position: fixed;
            bottom: 24px; left: 50%;
            transform: translateX(-50%);
            background: #28251d;
            color: #f9f8f5;
            padding: 10px 20px;
            border-radius: 8px;
            opacity: 0;
            transition: opacity 0.2s;
            pointer-events: none;
        }
        #toast.show { opacity: 1; }
    </style>
</head>
<body>

    <h2>Danh sách file</h2>

    <!-- Case 1: file có sẵn trên disk -->
    <div class="file-card">
        <span>📄 report-2026-q1.pdf</span>
        <button class="copy-btn"
            onclick="copyByPath('/Users/minh/Documents/report-2026-q1.pdf', this)">
            Copy as File
        </button>
    </div>

    <!-- Case 2: file generated (export từ app) -->
    <div class="file-card">
        <span>📊 export-data.csv</span>
        <button class="copy-btn"
            onclick="copyGeneratedFile(this)">
            Copy as File
        </button>
    </div>

    <div id="toast"></div>
    <script src="app.js"></script>
</body>
</html>
```

```js
// renderer/app.js

// ─── Case 1: File đã có trên disk ───────────────────────────────────
async function copyByPath(filePath, btn) {
    setButtonState(btn, 'loading', 'Đang copy...');

    const result = await window.clipboardAPI.copyFileByPath(filePath);

    if (result.success) {
        setButtonState(btn, 'success', '✓ Đã copy!');
        showToast('File đã vào clipboard — Ctrl+V để paste vào bất kỳ đâu');
    } else {
        setButtonState(btn, 'error', 'Lỗi');
        showToast('Lỗi: ' + result.error);
    }

    // Reset button sau 2s
    setTimeout(() => setButtonState(btn, '', 'Copy as File'), 2000);
}

// ─── Case 2: File generated từ memory ───────────────────────────────
async function copyGeneratedFile(btn) {
    setButtonState(btn, 'loading', 'Đang tạo file...');

    // Giả lập export data (thực tế có thể là PDF export, xlsx, v.v.)
    const csvContent = 'Name,Score\nMinh,95\nAn,87\nBinh,91';
    const buffer     = new TextEncoder().encode(csvContent);

    const result = await window.clipboardAPI.copyFileFromBuffer(
        buffer,
        'export-data.csv'   // tên file sẽ hiện khi paste
    );

    if (result.success) {
        setButtonState(btn, 'success', '✓ Đã copy!');
        showToast('File CSV đã vào clipboard — Ctrl+V để paste');
    } else {
        setButtonState(btn, 'error', 'Lỗi');
        showToast('Lỗi: ' + result.error);
    }

    setTimeout(() => setButtonState(btn, '', 'Copy as File'), 2000);
}

// ─── Helpers ─────────────────────────────────────────────────────────
function setButtonState(btn, state, text) {
    btn.textContent = text;
    btn.className   = 'copy-btn ' + state;
    btn.disabled    = state === 'loading';
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}
```

***

## Bước 6: Packaging (khi build production)

Khi dùng `electron-builder` hoặc `electron-forge`, cần khai báo để native module được đóng gói đúng:

**`electron-builder` (`package.json`):**
```json
{
  "build": {
    "files": ["**/*"],
    "extraResources": [],
    "npmRebuild": true,
    "nodeGypRebuild": false,
    "asarUnpack": [
      "**/node_modules/electron-clipboard-ex/**"
    ]
  }
}
```

> `asarUnpack` quan trọng — native `.node` file **không thể chạy bên trong `.asar` archive**, phải unpack ra ngoài. [fileside](https://www.fileside.app/blog/2019-04-22_fixing-drag-and-drop/)

***

## Checklist trước khi ship

- [ ] Chạy `npm run rebuild` sau mỗi lần `npm install` hoặc update Electron
- [ ] Test `Ctrl+V` vào Chrome, Slack, Discord — kiểm tra file nhận đúng tên và nội dung
- [ ] Kiểm tra `asarUnpack` trong build config nếu dùng electron-builder
- [ ] Với file generated (buffer): xác nhận temp file được cleanup sau 60s
- [ ] Test case file path có space hoặc ký tự Unicode (tiếng Việt) — `electron-clipboard-ex` xử lý được nhưng nên verify
- [ ] Build thử trên cả Windows và macOS nếu app cross-platform