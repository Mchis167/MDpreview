# 📚 System Documentation

This folder contains reference documentation for key systems and patterns in MDPreview.

## 📖 Documents

| Document | Purpose | Audience |
|----------|---------|----------|
| [Z-INDEX-SYSTEM.md](./Z-INDEX-SYSTEM.md) | Z-index token system, stacking hierarchy, debugging guide | Frontend devs working with CSS/UI stacking |

## 🔍 Quick Reference

**Z-Index Tokens:**
```
base(1) → elevated(10) → toolbar(100) → overlay(1000) 
→ drawer(2000) → modal(3000) → popover(4000) 
→ toast(5000) → drag(6000) → max(9000)
```

See [Z-INDEX-SYSTEM.md](./Z-INDEX-SYSTEM.md) for full details.

---

**Adding a new reference doc?**
1. Write it in this folder
2. Add entry to this README
3. Update memory reference to point here
