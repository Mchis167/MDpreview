# Quickstart — 5 Minutes to Running

**Get MDpreview running in 5 minutes**

---

## Prerequisites

- **Node.js** 18+ ([download](https://nodejs.org/))
- **Git** ([download](https://git-scm.com/))
- **npm** 9+ (comes with Node)

```bash
node --version  # Should be v18+
npm --version   # Should be v9+
```

---

## Install & Run

### 1. Clone Repository (1 min)

```bash
git clone <repository-url>
cd MDpreview
```

### 2. Install Dependencies (2 min)

```bash
npm install
```

### 3. Start Server (1 min)

Choose one:

**Option A: Web Server (Recommended for UI work)**
```bash
npm run serve
# Opens: http://localhost:3737
```

**Option B: Electron Desktop App**
```bash
npm run dev
# or
npm start
```

---

## ✅ You're Done!

The app is now running. You can:
- **Edit markdown files** in your editor
- **See live preview** in the browser
- **Publish to the web** using the Publish button

---

## Next Steps

### For Development
→ [Full Setup Guide](setup.md)

### To Learn How to Use It
→ [User Guide](user-guide.md)

### To Understand the Architecture
→ [Architecture Guide](../development/architecture.md)

---

## Troubleshooting

**Port 3737 already in use?**
```bash
lsof -i :3737              # Find what's using it
kill -9 <PID>             # Kill it
npm run serve             # Try again
```

**npm install fails?**
```bash
rm -rf node_modules package-lock.json
npm install
```

**More issues?** → [Setup Guide - Troubleshooting](setup.md#troubleshooting)

---

[← Back](README.md) | [Full Setup →](setup.md)
