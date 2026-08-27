# Demo: ASCII Art → SVG Converter

Tài liệu này dùng để kiểm tra tính năng render biểu đồ **ASCII / Unicode Art** sang **SVG vector** trực tiếp trên **MDpreview** (Desktop App & Extension).

---

## 1. Cây Layer & Context Menu (Ví dụ thực tế)

```ascii
┌─ CÂY LAYER (Bên trái) ──────────────────┐  ┌─ CANVAS ────────────────────────┐
│ ▼ Frame 1                               │  │                                 │
│   ├─ Header                             │  │   ┌─────────────────────────┐   │
│   ├─ Hero Banner  (Chuột phải) ◄───────┼──┼───┤ (Chuột phải vào node)   │   │
│   │  ┌───────────────────────┐          │  │   │  ┌────────────────────┐ │   │
│   │  │ Rename             ⌘R │          │  │   │  │ Rename          ⌘R │ │   │
│   │  │ Copy node ID          │          │  │   │  │ Copy node ID       │ │   │
│   │  └───────────────────────┘          │  │   │  └────────────────────┘ │   │
│   └─ Footer                             │  │   └─────────────────────────┘   │
└─────────────────────────────────────────┘  └─────────────────────────────────┘
```

---

## 2. Luồng Flowchart & Quyết định

```art
┌───────────────┐        ┌───────────────┐        ┌───────────────┐
│ User Input    │ ──────►│ Parser (MD)   │ ──────►│ Tokenizer     │
└───────────────┘        └───────────────┘        └───────┬───────┘
                                                          │
                                                          ▼
┌───────────────┐        ┌───────────────┐        ┌───────────────┐
│ Rendered SVG  │ ◄──────│ AsciiArtModule│ ◄──────│ Code Fence    │
│ (Vector DOM)  │        │ (Grid Parser) │        │ (lang: ascii) │
└───────────────┘        └───────────────┘        └───────────────┘
```

---

## 3. Kiến trúc Microservices & Data Pipeline

```bob
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ Client (Webview)│ ◄────►│ MDpreview Core  │ ◄────►│ Local Storage   │
└────────┬────────┘       └────────┬────────┘       └─────────────────┘
         │                         │
         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐
│ SVG Rendering   │       │ Monaco Service  │
│ Container       │       │ Sync Dispatcher │
└─────────────────┘       └─────────────────┘
```

---

## 4. Chuẩn ASCII Cổ điển (Dùng `+`, `-`, `|`)

```ascii
+-------------------+       +-------------------+
| Component A       | ----> | Component B       |
| (Legacy ASCII)    |       | (Auto Connector)  |
+-------------------+       +-------------------+
```
