# 📊 Example: AIChat Audit (Với Biểu Đồ Mermaid)

> [!NOTE]
> **Đây là file ví dụ để bạn tham khảo cách viết mã Mermaid kết hợp Markdown.**

---

## 🗺️ Visual Architecture Flow
Sơ đồ Mermaid vẽ kiến trúc:

```mermaid
graph TD
    User(["👤 User Message"]) --> CV[["ChatView<br/>Production UI"]]
    CV --> CS["AIChatService.shared"]
    CS --> CSS["ChatSessionStore"]
    CSS --> CP["ChatSessionPersistence"]
    
    subgraph "AI Processing"
        CS --> CPB["ChatPromptBuilder"]
        CPB --> LLM[("OpenAI/Claude API<br/>gpt-4.1-nano")]
    end
    
    subgraph "Storage"
        CP --> JSON[("JSON Files<br/>Atomic Writes")]
    end
    
    style CV fill:#1565C0,color:#fff
    style LLM fill:#6A1B9A,color:#fff
    style JSON fill:#2E7D32,color:#fff
```

---

## 📈 Dự Án Tiến Độ (Project Roadmap)
Ví dụ về biểu đồ Gantt:

```mermaid
gantt
    title AIChat Implementation Roadmap
    dateFormat  YYYY-MM-DD
    section Hoàn Thành
    "Bước 1 - Models & Store"           :done,    des1, 2026-03-24, 2026-03-25
    "Bước 2 - Service Refactor"         :done,    des2, 2026-03-25, 2026-03-26
    "Bước 5 - Relationship Store Integ"  :done,    des5, 2026-03-27, 2026-03-28
    section Đang Xử Lý
    "Bước 3 - Prompt Optimization"      :active,  des3, 2026-03-28, 1d
    section Chưa Bắt Đầu
    "Bước 4 - Production ChatView"      :         des4, 2026-03-29, 3d
```

---

## 🏔️ Tình Trạng Tổng Quan

Proposal đề ra 5 bước. Hiện tại **4/5 bước đã hoàn thành**, bước còn lại (ChatView) chưa tồn tại.

---
*File này được tạo tự động để làm mẫu cho bộ hướng dẫn tạo Chart.*
