const os = require('os');
const path = require('path');
const fs = require('fs');

// Self-installs the mdp-comments skill for Claude Code at user scope
// (~/.claude/skills/), so installing the extension is the only setup step.
// SKILL_VERSION gates overwrites: bump it whenever SKILL_MD changes, older
// installed copies get replaced, newer/equal ones are left alone.

const SKILL_VERSION = 1;

const SKILL_MD = `---
name: mdp-comments
description: Use when the user says a markdown (.md) file has review comments / nhận xét / comment from MDpreview waiting — e.g. "đọc comment trong file X", "xử lý comment đi". Reads them via the MDpreview MCP tool.
metadata:
  mdpreview-skill-version: ${SKILL_VERSION}
---

# Đọc comment review từ MDpreview

Người dùng review file markdown trong MDpreview (VSCode extension) và để lại
comment. Khi họ bảo file nào đó "có comment", làm như sau:

1. Gọi tool MCP \`mdp_read_comments\` của server \`mdpreview\` với đường dẫn
   file tương đối so với workspace root (vd \`docs/plan.md\`).
2. Tool trả về toàn bộ comment kèm trích đoạn được bôi đen (\`selectedText\`),
   vị trí dòng và ngữ cảnh. **Tool tự dọn comment ngay khi đọc** — không cần
   xoá, resolve hay gọi lại gì thêm.
3. Áp dụng các thay đổi được yêu cầu vào file. Mỗi comment nhắm vào đúng đoạn
   \`selectedText\` của nó.

Lưu ý:

- KHÔNG tự đi tìm file trong \`.mdpreview/comments/\` — luôn đi qua tool.
- Tool trả "No pending comments" nghĩa là comment đã được đọc trước đó hoặc
  chưa có — hỏi lại người dùng thay vì đoán.
- Nếu tool không gọi được (server không chạy), báo người dùng mở lại IDE có
  cài extension MDpreview.
`;

function installSkill() {
  const skillDir = path.join(os.homedir(), '.claude', 'skills', 'mdp-comments');
  const skillPath = path.join(skillDir, 'SKILL.md');

  try {
    const existing = fs.readFileSync(skillPath, 'utf8');
    const m = existing.match(/mdpreview-skill-version:\s*(\d+)/);
    if (m && parseInt(m[1], 10) >= SKILL_VERSION) return { installed: false, reason: 'up-to-date' };
  } catch {
    // not installed yet
  }

  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(skillPath, SKILL_MD);
  return { installed: true, path: skillPath };
}

module.exports = { installSkill, SKILL_VERSION };
