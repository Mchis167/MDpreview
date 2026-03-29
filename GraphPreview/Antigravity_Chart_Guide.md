# 📗 Hướng dẫn: Tạo Biểu đồ Premium trong Antigravity

Chào bạn! Bản hướng dẫn này giúp bạn nắm vững cách sử dụng mã Markdown kết hợp với Mermaid để tôi (Antigravity) có thể giúp bạn tạo ra các bản "Preview Canvas" đẳng cấp.

---

## 🚀 1. Công thức cơ bản
Để tôi có thể vẽ được biểu đồ, bạn chỉ cần đưa đoạn mã vào khối code như sau trong file `.md` của bạn:

```text
# Tên biểu đồ của bạn
```mermaid
[Mã nguồn Mermaid ở đây]
\``` (Nhớ đóng block bằng 3 dấu nháy)
```

---

## 🎨 2. Các mẫu biểu đồ "đẹp" nhất

### A. Biểu đồ luồng (Flowchart - `graph TD`)
Dùng để vẽ kiến trúc app hoặc luồng logic code.
- **Tip**: Dùng `subgraph` để nhóm các module lại.
- **Tip**: Sử dụng các hình dáng nút khác nhau: `[Nút vuông]`, `(Nút tròn)`, `([Nút elip])`, `[[Nút sub-process]]`.

```mermaid
graph TD
    A(["Start"]) --> B[["Process"]]
    B --> C{"Condition"}
    C -- "Yes" --> D["Success"]
    C -- "No" --> E["Retry"]
    
    style A fill:#4CAF50,color:#fff
    style D fill:#2196F3,color:#fff
    style E fill:#F44336,color:#fff
```

### B. Biểu đồ tuần tự (Sequence Diagram - `sequenceDiagram`)
Mô tả cách các Class/Service tương tác qua lại.
```mermaid
sequenceDiagram
    participant UI as SwiftUI View
    participant Store as ChatSessionStore
    participant API as OpenAI API
    
    UI->>Store: Send Message
    Store->>API: POST /chat/completions
    API-->>Store: Return Response
    Store-->>UI: Update @Published List
```

### C. Biểu đồ Gantt (Tiến độ - `gantt`)
Rất tốt để theo dõi Roadmap dự án.
```mermaid
gantt
    title Kế hoạch Development 2026
    section Thiết kế
    UI Design           :done,    des1, 2026-03-01, 7d
    Architecture        :active,  des2, 2026-03-08, 10d
```

---

## ✨ 3. Mẹo làm đẹp (Styling Level "Premium")

Để biểu đồ không bị "phẳng" và nhạt nhòa, bạn có thể thêm các dòng lệnh **Style** ở cuối khối Mermaid:

- `style ID fill:#hex,stroke:#hex,stroke-width:2px,rx:10,ry:10`
  - `fill`: Màu nền (dùng mã màu HSL hoặc HEX).
  - `stroke`: Màu viền.
  - `rx`, `ry`: Độ bo góc cho nút.
- `linkStyle default stroke:#888,stroke-width:1px` : Làm các đường nối thanh mảnh và sang trọng hơn.

---

## 🛠️ 4. Quy trình làm việc đề xuất

1.  **Draft**: Sử dụng [Mermaid Live Editor](https://mermaid.live/) để kéo thả hoặc gõ mã thử nghiệm.
2.  **Paste**: Copy mã từ Live Editor vào file `.md` của dự án bạn.
3.  **Command**: Gọi tôi bằng câu lệnh: **"Hãy render file MD này thành Artifact bản đẹp"**.

---

## 🛑 5. Những nguyên tắc vàng (Anti-Error)
Để tránh các lỗi render phổ biến ("Lexical error" hoặc "Syntax error"), hãy luôn tuân thủ 3 nguyên tắc sau:

### ✅ Luôn dùng Dấu ngoặc kép `"` cho nhãn (Labels)
Nếu nhãn của bạn chứa **Emoji**, **ký tự đặc biệt** (như `[`, `]`, `(`, `)`, `:`, `-`) hoặc **khoảng trắng**, hãy luôn bọc nó trong `""`.
- ❌ Sai: `User([👤 User])`
- ✅ Đúng: `User(["👤 User"])`

### ✅ Dùng `<br/>` thay cho `\n` để xuống dòng
Ký tự `\n` thường gây lỗi trong một số môi trường render. Hãy dùng thẻ HTML `<br/>`.
- ❌ Sai: `DT[[ChatDebugTool\n⚠️ Chỉ là Debug View]]`
- ✅ Đúng: `DT[["ChatDebugTool<br/>⚠️ Chỉ là Debug View"]]`

### ✅ Bọc ID của các Participant (Sequence Diagram)
Trong biểu đồ tuần tự, hãy dùng dấu nháy kép cho tên Participant nếu có ký tự đặc biệt.
- ❌ Sai: `participant V as View (onAppear)`
- ✅ Đúng: `participant V as "View (onAppear)"`

---
*Lưu ý: Bạn không cần lo lắng về việc cài đặt thư viện. Tôi đã tích hợp sẵn trình biên dịch Mermaid tối ưu nhất cho các bản Artifact của bạn.*
