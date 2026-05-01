# MDPreview Documentation

**Last Updated:** May 1, 2026 (Phase 1.1)  
**Status:** Fully organized by topic and role

---

## 🎯 Quick Links by Role

### 👤 New Users
Start here to understand and use the app:
1. **[Getting Started](guides/getting-started/)** → Quickstart and user guide
2. **[Project Overview](../README.md)** → Features and capabilities

### 👨‍💻 Developers
Understand the codebase and contribute:
1. **[Setup Guide](guides/getting-started/setup.md)** → Local development environment
2. **[Features Guide](features/GUIDE.md)** → How to find and understand 37+ modules
3. **[Feature Docs](features/)** → Complete module documentation
4. **[Architecture](guides/development/architecture.md)** → How rendering works
5. **[Design System](guides/development/design-tokens.md)** — Design tokens and CSS pipeline

### 🎨 UI/Component Developers
Build and style components:
1. **[Design System](features/components/)** — All UI components
2. **[Design Tokens](guides/development/design-tokens.md)** — Token system and CSS
3. **[Architecture](guides/development/architecture.md)** — Rendering fundamentals

### 🚀 DevOps / Deployment
Deploy and manage infrastructure:
1. **[Deployment Guide](guides/deployment/scripts-reference.md)** — Scripts and commands
2. **[Publishing](features/publishing/)** — Cloudflare Worker setup
3. **[Architecture](guides/development/architecture.md)** — Worker architecture

### 🧪 QA / Testing
Test and verify the application:
1. **[Testing Guide](testing/)** — Manual test procedures
2. **[Features](features/)** — All testable features
3. **[Security](security/)** — Security policies and checks

---

## 📚 Documentation by Topic

### Getting Started
| Guide | Purpose |
|-------|---------|
| [**Quickstart**](guides/getting-started/) | 5-minute setup and first run |
| [**Setup**](guides/getting-started/setup.md) | Complete installation and environment |
| [**User Guide**](guides/getting-started/user-guide.md) | How to use the app |

### Development
| Guide | Purpose |
|-------|---------|
| [**Architecture**](guides/development/architecture.md) | Rendering system design and rendering core |
| [**Design Tokens**](guides/development/design-tokens.md) | CSS system and token pipeline |
| [**Features**](features/) | All 37+ modules organized by category |

### Deployment
| Guide | Purpose |
|-------|---------|
| [**Scripts Reference**](guides/deployment/scripts-reference.md) | Build and deployment commands |
| [**Publishing**](features/publishing/) | Publishing to Cloudflare Workers |

### Security
| Guide | Purpose |
|-------|---------|
| [**Security Policy**](security/policy.md) | Security policies and incident response |
| [**Architecture**](guides/development/architecture.md#xss-protection-pipeline) | XSS protection details |

### Testing
| Guide | Purpose |
|-------|---------|
| [**Manual Tests**](testing/manual-tests.md) | 12 test procedures with curl commands |
| [**Test Procedures**](testing/) | Testing guide and checklist |

---

## 🗂️ Complete Documentation Structure

```
docs/
├── 00-START.md                    ← You are here
│
├── guides/
│   ├── getting-started/
│   │   ├── quickstart.md          ← 5-minute setup
│   │   ├── setup.md               ← Full installation
│   │   └── user-guide.md          ← How to use
│   ├── development/
│   │   ├── architecture.md        ← Rendering & core system
│   │   └── design-tokens.md       ← CSS & tokens
│   └── deployment/
│       └── scripts-reference.md   ← Scripts & CLI
│
├── features/                      ← 37+ Feature documentation
│   ├── README.md                  ← Feature index & navigation
│   ├── GUIDE.md                   ← How to find features
│   ├── core/                      ← Core modules (2)
│   ├── editor/                    ← Editor & rendering (2)
│   ├── components/                ← UI components (10)
│   ├── services/                  ← Services & logic (6)
│   ├── file-management/           ← Files & workspace (5)
│   ├── publishing/                ← Publishing & workers (3)
│   ├── utilities/                 ← Helpers (3)
│   └── advanced/                  ← Advanced features (6)
│
├── security/
│   ├── README.md
│   └── policy.md                  ← Security policies
│
├── testing/
│   ├── README.md
│   └── manual-tests.md            ← Manual test procedures
│
├── decisions/
│   └── [45+ Architecture Decision Records]
│
└── reference/
    ├── phase-reports/             ← Phase 1.1 & 1.2 reports
    └── archive/                   ← Ideas & incomplete docs
```

---

## 🚀 Most Common Tasks

### "I want to set up development"
→ [Setup Guide](guides/getting-started/setup.md)

### "I want to understand how the app renders markdown"
→ [Architecture](guides/development/architecture.md)

### "I want to find a specific feature"
→ [Features Guide](features/GUIDE.md) then [Feature Docs](features/)

### "I want to deploy to production"
→ [Scripts Reference](guides/deployment/scripts-reference.md)

### "I want to test the application"
→ [Manual Tests](testing/manual-tests.md)

### "I want to update the design system"
→ [Design Tokens](guides/development/design-tokens.md)

### "I have a security concern"
→ [Security Policy](security/policy.md)

---

## 📊 Documentation Overview

| Category | Files | Purpose |
|----------|-------|---------|
| **Guides** | 7 files | Getting started, development, deployment |
| **Features** | 37+ modules | Complete feature documentation |
| **Security** | 2 files | Security policies and guidelines |
| **Testing** | 2 files | Test procedures and checklists |
| **Decisions** | 45+ files | Architecture decision records |
| **Reference** | Phase reports, archive | Supplementary materials |
| **Total** | 100+ | Comprehensive documentation |

---

## ✨ Key Features (v1.1.0+)

✅ **Centralized Entry Point** — Start here for everything  
✅ **Role-Based Navigation** — Guides tailored to your role  
✅ **Organized by Topic** — Find what you need quickly  
✅ **37+ Features Documented** — Complete module reference  
✅ **Security First** — Comprehensive security policies  
✅ **Test Coverage** — 12 manual tests + 21 unit tests  

---

## 🔍 Search by Topic

- **Architecture:** [Architecture Guide](guides/development/architecture.md)
- **Components:** [Components](features/components/)
- **Deployment:** [Deployment Guide](guides/deployment/scripts-reference.md)
- **Design System:** [Design Tokens](guides/development/design-tokens.md)
- **Editor:** [Editor Features](features/editor/)
- **Features:** [All Features](features/)
- **Security:** [Security Policy](security/policy.md)
- **Setup:** [Setup Guide](guides/getting-started/setup.md)
- **Testing:** [Test Guide](testing/)
- **Workspace:** [File Management](features/file-management/)

---

## 📝 For Contributors

When adding new documentation:

1. **Choose the right location:**
   - User guides → `guides/getting-started/`
   - Developer guides → `guides/development/`
   - Deployment info → `guides/deployment/`
   - New features → `features/[category]/`
   - Security issues → `security/`
   - Test procedures → `testing/`

2. **Update the relevant README** in each category

3. **Update this file** if adding a new category

---

**Need Help?** Check [Features Guide](features/GUIDE.md) for step-by-step navigation.

**Found an Issue?** See [Security Policy](security/policy.md) for vulnerability reporting.

**Want to Contribute?** See [Setup Guide](guides/getting-started/setup.md#git-workflow).
