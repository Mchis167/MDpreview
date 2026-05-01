# Security

**Security policies, vulnerability reporting, and protection mechanisms**

---

## Guides

| Guide | Purpose | Priority |
|-------|---------|----------|
| [Security Policy](policy.md) | Security policies, XSS protection, incident response | **HIGH** |

---

## Key Security Features (v1.1.0+)

✅ **XSS Protection** — Sanitize HTML in both server and worker  
✅ **Input Validation** — Validate all file paths and inputs  
✅ **No Code Execution** — No eval() or unsafe code  
✅ **Admin Secret** — Protect publishing with secrets  
✅ **CORS & CSP** — Browser security headers  

---

## Quick Questions

**"How do I report a security vulnerability?"**
→ [Security Policy - Vulnerability Reporting](policy.md#vulnerability-reporting)

**"What XSS protection is in place?"**
→ [Security Policy - XSS Protection](policy.md#xss-protection-v110)

**"What should I check before deploying?"**
→ [Security Policy - Production Deployment](policy.md#production-deployment)

**"How does the rendering protect against XSS?"**
→ [Architecture - XSS Protection](../guides/development/architecture.md#xss-protection-pipeline)

---

## For Contributors

Before submitting code:

1. Review [Security Policy](policy.md)
2. Run security tests: `npm run test`
3. Check for vulnerabilities
4. Follow secure coding guidelines

---

## Related Documentation

- **Setup** — [Getting Started - Setup](../guides/getting-started/setup.md)
- **Architecture** — [Developer Architecture](../guides/development/architecture.md)
- **Testing** — [Manual Tests](../testing/)

---

[← Back to Documentation](../00-START.md)
