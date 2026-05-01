# Documentation Index

**Last Updated:** May 1, 2026 (Phase 1.1)  
**Version:** 2.0 (Post-consolidation)

---

## 📖 Getting Started

### For New Users
1. **[README.md](../README.md)** — Start here! Project overview, features, and quick start
2. **[user_guide.md](user_guide.md)** — How to use the app

### For Developers
1. **[SETUP.md](SETUP.md)** — Installation and development environment setup
2. **[FEATURE_DOCS_GUIDE.md](FEATURE_DOCS_GUIDE.md)** — How to find and understand features
3. **[function-docs/README.md](function-docs/README.md)** — Documentation of all 37+ features
4. **[scripts-guide.md](scripts-guide.md)** — Available build and deployment scripts
5. **[RENDERING_ARCHITECTURE.md](RENDERING_ARCHITECTURE.md)** — How rendering works

### For DevOps / Deployment
1. **[scripts-guide.md](scripts-guide.md)** — DeployWorker, PreviewUI, QuickRebuild commands
2. **[RENDERING_ARCHITECTURE.md](RENDERING_ARCHITECTURE.md)** — Cloudflare Workers setup

---

## 🏗️ Architecture & Design

| Document | Purpose | Audience |
|----------|---------|----------|
| [RENDERING_ARCHITECTURE.md](RENDERING_ARCHITECTURE.md) | Complete rendering system design, shared core module, server vs worker comparison | Developers, Architects |
| [css-pipeline.md](css-pipeline.md) | Design token system, CSS build pipeline, auto-sync mechanism | Designers, Frontend devs |
| [phase-1-1-completion.md](phase-1-1-completion.md) | Phase 1.1 technical completion report, refactoring decisions | Technical leads |
| [phase-1-2-completion.md](phase-1-2-completion.md) | Phase 1.2 CSS pipeline completion report | Technical leads |

### Architecture Diagram

```
User Input (Markdown)
    ↓
Server (dev)  ←→  Worker (published)
    ↓               ↓
md-renderer-core.js (Shared)
├── highlightCodeBlock()
├── sanitizeHtml()         ← XSS Protection
├── wrapInTableWrapper()
└── renderMermaidBlock()
    ↓
Safe HTML Output
```

---

## 🔒 Security

| Document | Purpose | Priority |
|----------|---------|----------|
| [SECURITY.md](SECURITY.md) | Security policies, XSS protection details, incident response | **HIGH** |
| [RENDERING_ARCHITECTURE.md](RENDERING_ARCHITECTURE.md#xss-protection-pipeline) | XSS protection implementation details | **HIGH** |
| [README.md](../README.md#security) | Security overview and features | **MEDIUM** |

### Key Security Features (v1.1.0+)
- ✅ XSS sanitization in both server and worker
- ✅ Input validation for file paths
- ✅ No eval() or code execution
- ✅ Admin secret protection for publishing

---

## 🧪 Testing & Quality

| Document | Purpose | Test Count |
|----------|---------|-----------|
| [manual-testing-phase-1-1.md](manual-testing-phase-1-1.md) | Step-by-step manual test cases with curl commands | 12 tests |
| [phase-1-1-completion.md](phase-1-1-completion.md#testing--verification) | Unit and integration test results | 21 tests |

### Test Execution

```bash
# Unit tests (21 tests)
npm run test

# Integration tests (6 categories)
bash scripts/test-phase-1-1.sh

# Manual tests (12 procedures)
See: manual-testing-phase-1-1.md
```

---

## 🚀 Development & Deployment

| Document | Task | Commands |
|----------|------|----------|
| [SETUP.md](SETUP.md) | Local development setup | `npm install`, `npm run serve` |
| [scripts-guide.md](scripts-guide.md) | Build and deployment scripts | `./scripts/*.command` |
| [RENDERING_ARCHITECTURE.md](RENDERING_ARCHITECTURE.md) | Understanding rendering pipeline | `npm run test`, debugging |
| [README.md](../README.md) | Project overview | All npm scripts |

### Quick Reference

**Development**
```bash
npm run serve              # Local server (localhost:3737)
npm run dev                # Electron app
./scripts/PreviewUI.command # Browser preview with CSS auto-sync
```

**Testing**
```bash
npm run test               # Unit tests (21 tests)
bash scripts/test-phase-1-1.sh  # Full integration tests
npm run lint               # Linting (JS + CSS)
```

**Building & Deployment**
```bash
npm run build:publish-css  # Rebuild CSS from tokens
./scripts/QuickRebuild.command  # Rebuild app
./scripts/DeployWorker.command  # Deploy to Cloudflare
npm run build              # Create DMG release
```

---

## 📋 Phase Completion Reports

| Phase | Document | Status | Features |
|-------|----------|--------|----------|
| 1.1 | [phase-1-1-completion.md](phase-1-1-completion.md) | ✅ COMPLETE | Render consolidation, XSS fix, 21 tests |
| 1.2 | [phase-1-2-completion.md](phase-1-2-completion.md) | ✅ COMPLETE | CSS pipeline, auto-sync |

### Phase 1.1: Render Logic Consolidation

**Key Achievement:** Fixed critical XSS security gap in worker

| Aspect | Before | After |
|--------|--------|-------|
| Server XSS Protection | ✅ Yes | ✅ Yes |
| Worker XSS Protection | ❌ **No** | ✅ **Yes** (NEW) |
| Shared Code | ❌ Duplicated | ✅ **Consolidated** |
| Test Coverage | Minimal | 21 tests |

See: [SECURITY.md](SECURITY.md#xss-protection-v110)

---

## 📚 Topic-Based Reference

### **"How do I...?"**

**Start developing?**
→ [SETUP.md](SETUP.md)

**Understand the rendering system?**
→ [RENDERING_ARCHITECTURE.md](RENDERING_ARCHITECTURE.md)

**Deploy to production?**
→ [scripts-guide.md](scripts-guide.md)

**Test my changes?**
→ [manual-testing-phase-1-1.md](manual-testing-phase-1-1.md) or run `npm run test`

**Fix an XSS vulnerability?**
→ [SECURITY.md](SECURITY.md)

**Update design tokens?**
→ [css-pipeline.md](css-pipeline.md)

**Understand why certain decisions were made?**
→ [phase-1-1-completion.md](phase-1-1-completion.md#technical-decisions)

**Report a security issue?**
→ [SECURITY.md](SECURITY.md#vulnerability-reporting)

**Troubleshoot common issues?**
→ [SETUP.md](SETUP.md#troubleshooting) or [README.md](../README.md#troubleshooting)

---

## 🗂️ Complete File Structure

```
MDpreview/
├── README.md                           [Project overview, features, quick start]
├── CHANGELOG.md                        [Version history, Phase 1.1 release notes]
│
├── docs/
│   ├── INDEX.md                       [This file - documentation guide]
│   ├── SECURITY.md                    [Security policies, XSS protection details]
│   ├── SETUP.md                       [Development setup and workflow]
│   ├── RENDERING_ARCHITECTURE.md      [Rendering system technical details]
│   ├── phase-1-1-completion.md        [Phase 1.1 technical completion report]
│   ├── phase-1-2-completion.md        [Phase 1.2 CSS pipeline completion]
│   ├── manual-testing-phase-1-1.md    [12 manual test cases with curl commands]
│   ├── scripts-guide.md               [Build and deployment scripts reference]
│   ├── css-pipeline.md                [Design tokens and CSS build system]
│   ├── user_guide.md                  [User manual for the app]
│   │
│   └── decisions/                     [Architecture decision records]
│       └── *.md                       [Various ADRs]
│
├── renderer/js/services/
│   ├── md-renderer-core.js            [Shared rendering primitives (Phase 1.1)]
│   └── __tests__/
│       └── md-renderer-core.test.js   [21 unit tests]
│
├── server/routes/
│   └── render.js                      [Server rendering with line tracking]
│
├── cf-publish-worker/src/
│   └── renderer.js                    [Worker rendering with premium UI]
│
└── scripts/
    ├── test-phase-1-1.sh              [Integration test runner]
    ├── build-publish-css.js           [CSS build pipeline]
    └── *.command                      [Build and deployment scripts]
```

---

## 🔄 Documentation Navigation

### By Role

**Product Manager / Non-Technical**
1. [README.md](../README.md) — Features and capabilities
2. [user_guide.md](user_guide.md) — How to use
3. [function-docs/README.md](function-docs/README.md) — All features at a glance

**Frontend Developer**
1. [SETUP.md](SETUP.md) — Setup environment
2. [FEATURE_DOCS_GUIDE.md](FEATURE_DOCS_GUIDE.md) — How to find features
3. [function-docs/](function-docs/) — Feature documentation (37+ modules)
4. [RENDERING_ARCHITECTURE.md](RENDERING_ARCHITECTURE.md) — Rendering system
5. [css-pipeline.md](css-pipeline.md) — Styling system

**Backend/Full-Stack Developer**
1. [SETUP.md](SETUP.md) — Environment setup
2. [FEATURE_DOCS_GUIDE.md](FEATURE_DOCS_GUIDE.md) — How to find features
3. [function-docs/](function-docs/) — Feature documentation
4. [RENDERING_ARCHITECTURE.md](RENDERING_ARCHITECTURE.md) — Rendering pipeline
5. [SECURITY.md](SECURITY.md) — Security considerations
6. [phase-1-1-completion.md](phase-1-1-completion.md) — Architecture decisions

**DevOps / Deployment**
1. [scripts-guide.md](scripts-guide.md) — Deployment procedures
2. [RENDERING_ARCHITECTURE.md](RENDERING_ARCHITECTURE.md#worker-renderer) — Worker setup
3. [SECURITY.md](SECURITY.md#production-deployment) — Production security
4. [function-docs/PUBLISH_WORKER.md](function-docs/PUBLISH_WORKER.md) — Worker architecture

**QA / Test Engineer**
1. [FEATURE_DOCS_GUIDE.md](FEATURE_DOCS_GUIDE.md) — How to find features
2. [function-docs/README.md](function-docs/README.md) — All features
3. [manual-testing-phase-1-1.md](manual-testing-phase-1-1.md) — Test procedures
4. [SETUP.md](SETUP.md#testing) — Running tests

---

## 📊 Documentation Statistics

- **Total Files:** 11 main documents (+ ADRs)
- **Total Lines:** ~2,500+ lines of documentation
- **Coverage:** All major systems and workflows
- **Last Updated:** May 1, 2026
- **Phase:** Post Phase 1.1 (Consolidation)

---

## ✅ Checklist: Documentation Complete

- [x] README.md — Project overview and quick start
- [x] SETUP.md — Development environment setup
- [x] SECURITY.md — Security policies and procedures
- [x] RENDERING_ARCHITECTURE.md — Technical rendering details
- [x] manual-testing-phase-1-1.md — Test procedures (12 cases)
- [x] phase-1-1-completion.md — Phase 1.1 technical report
- [x] phase-1-2-completion.md — Phase 1.2 technical report
- [x] scripts-guide.md — Script reference
- [x] css-pipeline.md — Design system documentation
- [x] CHANGELOG.md — Version history with Phase 1.1
- [x] This INDEX.md — Documentation guide

---

## 🎯 Key Takeaways

**Phase 1.1 Documentation Focus:**

✅ **Consolidation** — Render logic unified in `md-renderer-core.js`  
✅ **Security** — XSS protection now in both server and worker  
✅ **Testing** — 21 unit tests + 12 manual test cases  
✅ **Quality** — Full test coverage with integration tests  
✅ **Documentation** — Comprehensive guides for all roles  

**Ready for:**
- New developers to join and contribute
- Production deployment with confidence
- Future phases (1.3, 2.1, etc.)
- Security audits and reviews

---

**Need Help?** Start with [README.md](../README.md) or [SETUP.md](SETUP.md) depending on your role.

**Found an issue?** See [SECURITY.md](SECURITY.md#vulnerability-reporting) for security issues or open a GitHub issue.

**Want to contribute?** See [SETUP.md](SETUP.md#git-workflow) for development workflow guidelines.
