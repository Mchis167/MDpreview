---
title: MDPreview Workflow Router
description: Central dispatcher for workflow command routing
version: 1.0
---

# 🎯 Workflow Command Router

**Central dispatcher** for all agent workflows. Routes `/command` → `skills.json` → workflow executor.

---

## 🔄 How It Works

### **Entry Point**
```
User Input: /workflow-name [args]
    ↓
Router checks: skills.json registry
    ↓
Load: workflows/[number].[name].md
    ↓
Execute: Step-by-step instructions
    ↓
Output: Workflow result + checkpoints
```

### **Registry Format** (`skills.json`)

```json
{
  "command-name": {
    "id": "00",
    "file": "workflows/00.startup.md",
    "trigger": "session_start",
    "type": "mandatory",
    "command": "/startup",
    "description": "...",
    "category": "core",
    "params": ["optional", "args"]
  }
}
```

---

## 📋 Core Workflows (Mandatory Routes)

| Command | Trigger | Category | File | Priority |
|---------|---------|----------|------|----------|
| `/startup` | Session start | Core | `00.startup.md` | **CRITICAL** |
| `/discuss` | Analysis request | Planning | `02.discuss.md` | **HIGH** |
| `/smart-edit` | Code edit | Execution | `01.smart-edit.md` | **HIGH** |
| `/linting-gates` | Quality check | Quality | `09.linting-gates.md` | **MANDATORY** |
| `/changelog` | Feature complete | Documentation | `03.changelog.md` | **MANDATORY** |
| `/github` | Release ready | Deployment | `04.github.md` | **CRITICAL** |

---

## 🛠️ Execution Triggers

### **Automatic Triggers** (Agent should initiate without user command)
```
✅ /startup       → Session start (always first)
✅ /linting-gates → After every code change
✅ /changelog     → Before commit
```

### **User-Initiated Triggers**
```
✅ /discuss          → User wants analysis
✅ /smart-edit       → User approves plan
✅ /plan             → User wants planning
✅ /console-test     → User wants verification
✅ /github           → User ready for release
```

### **Conditional Triggers**
```
✅ /token-management → When adding new tokens
✅ /atomic-gen       → When creating components
✅ /session-log      → Session checkpoint
```

---

## 🎓 Development Workflows (Execution Order)

### **Pattern 1: New Feature Development**
```
1. /discuss                  ← Analyze & discuss (wait approval)
2. /plan                     ← Create artifact plan (wait approval)
3. /atomic-gen [name]        ← Create component
4. /token-management         ← If new tokens needed
5. /smart-edit               ← Implement per plan (multiple calls)
6. /console-test             ← Verify functionality
7. /test [feature]           ← Design test cases
8. /linting-gates            ← Check code quality (0 errors mandatory)
9. /changelog                ← Document changes
10. /github                  ← Release (if ready)
```

### **Pattern 2: Bug Fix**
```
1. /discuss          ← Analyze bug
2. /smart-edit       ← Fix code (surgical edit)
3. /console-test     ← Verify fix works
4. /linting-gates    ← Check quality
5. /changelog        ← Document fix
(SKIP /github unless coordinating release)
```

### **Pattern 3: Release Cycle**
```
1. /changelog        ← Compile [Not Committed]
2. /linting-gates    ← Final verification (0 errors)
3. /github           ← Commit + tag + update version
```

### **Pattern 4: Refactoring Legacy**
```
1. /discuss                ← Analyze legacy code
2. /plan                   ← Refactor plan
3. /refactor-to-atomic     ← Execute refactor
4. /smart-edit             ← Fine-tune if needed
5. /linting-gates          ← Verify
6. /changelog              ← Document
```

---

## 🚦 Router Logic Rules

### **Rule 1: Startup is Always First**
```
if (session.isNew) {
  → EXECUTE /startup first
  → Load rules, architecture, context
  → THEN handle user input
}
```

### **Rule 2: Planning Before Execution**
```
if (command == "edit" && !plan.approved) {
  → EXECUTE /discuss first
  → Create /plan artifact
  → WAIT for approval
  → THEN execute /smart-edit
}
```

### **Rule 3: Quality Gates are Mandatory**
```
if (code.modified) {
  → ALWAYS execute /linting-gates
  → 0 errors MANDATORY (not warnings)
  → Don't proceed if fail
}
```

### **Rule 4: Documentation is Non-Optional**
```
if (feature.completed || bug.fixed) {
  → MUST execute /changelog
  → Document in "Not Committed" section
  → Mandatory before /github
}
```

### **Rule 5: Wait for Approval**
```
if (command == "/plan" || command == "/discuss") {
  → Output artifact/analysis
  → DON'T proceed to next step
  → WAIT for: "proceed", "approve", or feedback
  → Re-route based on user input
}
```

---

## 📊 Workflow Categories

### **Core (5)**
- `/startup` - Session initialization
- `/smart-edit` - Code editing
- `/discuss` - Analysis
- `/linting-gates` - Quality check
- `/changelog` - Documentation

### **Planning (3)**
- `/discuss` - Analysis & proposals
- `/plan` - Implementation planning
- `/phase-detail` - Phase detailing

### **Execution (1)**
- `/smart-edit` - Code modification

### **Testing & Verification (2)**
- `/console-test` - Browser automation test
- `/test` - Test case design

### **Deployment (1)**
- `/github` - Release automation

### **Scaffolding (2)**
- `/atomic-gen` - Component generation
- `/module-creation` - Module scaffolding

### **Design System (2)**
- `/token-management` - Token operations
- `/standardize-ds` - DS standardization

### **Documentation & Utility (3)**
- `/changelog` - Change documentation
- `/artifact-docs` - Artifact strategy
- `/session-log` - Session logging

---

## 🔗 Workflow Dependencies

```
/startup (entry point)
    ↓
/discuss (analysis gate)
    ↓
/plan (approval gate)
    ↓
/smart-edit (code execution)
    ↓
/linting-gates (quality gate)
    ↓
/console-test (verification)
    ↓
/changelog (documentation gate)
    ↓
/github (release gate)
```

---

## ⚡ Quick Router Reference

| Scenario | Workflow Chain |
|----------|----------------|
| **Fix bug** | discuss → smart-edit → linting-gates → console-test → changelog |
| **Add feature** | discuss → plan → atomic-gen → smart-edit → linting-gates → changelog |
| **Release** | changelog → linting-gates → github |
| **Refactor** | discuss → plan → refactor-to-atomic → smart-edit → linting-gates |
| **New component** | discuss → plan → atomic-gen → smart-edit → test → linting-gates |

---

## 🛡️ Router Enforcement

### **Cannot Skip These**
- ❌ Skip `/discuss` for major changes
- ❌ Skip `/plan` approval for complex tasks
- ❌ Skip `/linting-gates` before commit
- ❌ Skip `/changelog` documentation
- ❌ Auto-proceed after `/discuss` or `/plan`

### **Must Wait For**
- ⏸️ User approval after `/discuss`
- ⏸️ User approval after `/plan`
- ⏸️ Linting to pass (0 errors, 0 warnings)

---

## 📝 Implementation Checklist

- [x] Registry created (`skills.json`)
- [x] Router logic documented (`command-router.md`)
- [x] Workflow ordering defined
- [x] Triggers documented
- [ ] Auto-trigger system in place
- [ ] Error handling for missing workflows
- [ ] Workflow versioning system
- [ ] Audit logging for workflow execution

---

## 🔄 How to Add a New Workflow

1. **Create workflow file:** `workflows/[number].[name].md`
2. **Register in `skills.json`:**
   ```json
   "command-name": {
     "id": "[number]",
     "file": "workflows/[number].[name].md",
     "command": "/command-name",
     "trigger": "event_type",
     "category": "category_name"
   }
   ```
3. **Add to router dependencies** if needed
4. **Update this file** with new workflow details

---

**Last Updated:** 2026-05-16  
**Version:** 1.0 — Complete Router System  
**Status:** Production Ready ✅
