---
trigger: always_on
glob: CHANGELOG.md
description: Ensures the AI agent does not automatically update the CHANGELOG.md file without explicit user instruction.
---

# Rule: No Automatic Changelog Updates

To maintain user control over version history and release notes, you MUST NOT automatically add entries or modify `CHANGELOG.md` during a task.

## Instructions:
1. **Wait for command**: Only update `CHANGELOG.md` when the user explicitly asks you to (e.g., "update the changelog", "add this to changelog").
2. **Manual control**: If you perform architectural changes or bug fixes, you may *suggest* a changelog entry in your summary, but do NOT write it to the file yourself unless instructed.
3. **Preserve order**: When updating (upon request), ensure the format and chronological order are strictly maintained as per existing patterns.

This rule prevents clutter and ensures that only significant, user-approved changes are documented in the official history.
