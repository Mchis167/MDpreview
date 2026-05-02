# Development Guides

**For developers building and understanding MDpreview**

**Last Updated:** May 2, 2026

---

## Key Guides

| Guide | Purpose | Read Time |
|-------|---------|-----------|
| [Architecture](architecture.md) | How rendering works, shared core module, server vs worker | 20 min |
| [Design Tokens](design-tokens.md) | CSS system, design tokens, token pipeline, layout synchronization | 15 min |

---

## What You'll Learn

1. **Architecture** — The complete rendering system design
2. **Design Tokens** — How to update and build the CSS system
3. **Layout Synchronization** — How padding/width tokens sync across views (added May 2, 2026)

---

## Quick Questions

**"How does the markdown rendering work?"**
→ [Architecture - Rendering Pipeline](architecture.md#rendering-pipeline)

**"What's the shared rendering core?"**
→ [Architecture - Shared Core Module](architecture.md#shared-core-module)

**"How do I update the design system?"**
→ [Design Tokens - Updating Tokens](design-tokens.md#updating-tokens)

**"How do I change content padding or width?"**
→ [Design Tokens - Scenario 4](design-tokens.md#scenario-4-content-padding--width-adjustment-affects-all-views)

**"How does the project map (minimap) work?"**
→ [Project Map Component](../../features/components/PROJECT_MAP.md)

**"Why is the viewport indicator misaligned?"**
→ [ADR: Content Padding Synchronization](../../decisions/20260502-content-padding-width-synchronization.md)

**"How does XSS protection work?"**
→ [Architecture - XSS Protection](architecture.md#xss-protection-pipeline)

---

## Related Guides

- **Setup** — [Getting Started - Setup](../getting-started/setup.md)
- **Features** — [Feature Documentation](../../features/)
- **Deployment** — [Scripts Reference](../deployment/scripts-reference.md)

---

[← Back to Documentation](../../00-START.md)
