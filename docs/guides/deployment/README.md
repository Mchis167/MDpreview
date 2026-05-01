# Deployment Guides

**For DevOps and deployment engineers**

---

## Key Guides

| Guide | Purpose | For |
|-------|---------|-----|
| [Scripts Reference](scripts-reference.md) | All build and deployment scripts | Developers, DevOps |
| [Publishing](../../features/publishing/) | Cloudflare Worker setup and architecture | DevOps, Architects |

---

## Quick Commands

```bash
# Rebuild app locally
./scripts/QuickRebuild.command

# Preview in browser with CSS auto-sync
./scripts/PreviewUI.command

# Deploy to Cloudflare
./scripts/DeployWorker.command

# Build DMG for distribution
npm run build
```

---

## Common Tasks

**"How do I deploy to production?"**
→ [Scripts Reference - DeployWorker](scripts-reference.md)

**"How do I test locally before deploying?"**
→ [Scripts Reference - PreviewUI](scripts-reference.md)

**"How does the Cloudflare Worker work?"**
→ [Publishing - Worker Architecture](../../features/publishing/PUBLISH_WORKER.md)

**"How do I configure environment variables?"**
→ [Scripts Reference - Environment Setup](scripts-reference.md)

---

## Deployment Checklist

- [ ] Read [Scripts Reference](scripts-reference.md)
- [ ] Understand [Worker Architecture](../../features/publishing/)
- [ ] Test locally with PreviewUI
- [ ] Configure environment secrets
- [ ] Run DeployWorker script
- [ ] Verify in production

---

## Related Guides

- **Setup** — [Getting Started - Setup](../getting-started/setup.md)
- **Architecture** — [Developer Architecture](../development/architecture.md)
- **Security** — [Security Policy](../../security/policy.md)

---

[← Back to Documentation](../../00-START.md)
