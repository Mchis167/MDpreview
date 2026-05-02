# ADR: Publishing Service Security Hardening

**Date**: 2026-05-02  
**Status**: Proposed  
**Context**: Phase 2.1 Publishing Service Refactor

---

## Problem

The publishing service has several security vulnerabilities that need to be addressed:

1. **Password Handling**: SHA-256 hashing with no salt is vulnerable to rainbow table attacks. Passwords are passed in URL query parameters, exposing them via browser history, referrer headers, and server logs.

2. **Missing Input Validation**: Slug format validation only occurs after network round-trip to worker. No client-side pre-validation.

3. **Mermaid Configuration**: Default `securityLevel: 'loose'` allows potentially dangerous diagram features.

4. **No Rate Limiting**: Multiple publish attempts have no client or server-side rate limiting, allowing abuse.

5. **Asset Bundling**: No size limits on bundled assets; large/malicious assets could cause memory exhaustion.

---

## Decision

We will harden the publishing service through the following measures:

### 1. Password Security (Client-side + Server coordination)

**Current flow** (Worker-side, out of scope for this ADR):
- Client sends password in request body (not URL)
- Worker hashes with SHA-256 (no salt) and stores in KV
- Published document locked behind password

**Recommendations for Worker upgrade** (document in Worker repo):
- [ ] Implement salted PBKDF2 or bcrypt hashing (not SHA-256)
- [ ] Use HTTP-only, Secure cookies for authenticated sessions (not URL params)
- [ ] Never expose password in any URL or referrer header
- [ ] Implement password reset flow with time-limited tokens

**Client-side enforcement** (this service):
- [x] Passwords never logged to console
- [x] Passwords cleared from memory after publish
- [x] Toast messages never show full password (use mask: `••••••`)

### 2. Input Validation

**Slug Validation** (already implemented):
- Client-side: Regex validation before sending
- Server-side: Re-validate slug format (defense in depth)
- Pattern: `^[a-z0-9\-]{3,50}$` (lowercase, hyphen, 3–50 chars)

**Content Validation**:
- HTML size limit: 10MB (warn at 5MB)
- Asset count limit: 100 files (warn at 50)
- Each asset size limit: 5MB

### 3. Mermaid Security Configuration

**Current risk**: `securityLevel: 'loose'` allows all diagram types and formatting.

**Recommendation for standalone bundles**:
```javascript
window.mermaid.initialize({
  securityLevel: 'antiscript', // Prevent script tags in SVG output
  // or 'strict' for maximum safety (disables some diagram types)
});
```

**Default**: Use `'antiscript'` for published documents (blocks inline scripts, allows HTML formatting).

**Implementation**: Update `design-token-provider.js` to inject proper mermaid config.

### 4. Rate Limiting

**Client-side debouncing** (already implemented):
- Publish button disabled for 5s after successful publish
- Toast prevents duplicate rapid publish attempts

**Server-side recommendations**:
- [ ] Implement per-user rate limiting (e.g., 10 publishes/hour)
- [ ] Log publish attempts with timestamp and user ID
- [ ] Alert on suspicious patterns (>20 attempts in 5 minutes)

### 5. Asset Bundling Limits

**Implemented in `publish-utils.js`**:
```javascript
const ASSET_LIMITS = {
  MAX_ASSET_SIZE: 5 * 1024 * 1024,      // 5MB per asset
  MAX_TOTAL_SIZE: 20 * 1024 * 1024,     // 20MB total
  MAX_ASSET_COUNT: 100,
  WARN_ASSET_SIZE: 3 * 1024 * 1024,     // Warn at 3MB
  WARN_TOTAL_SIZE: 15 * 1024 * 1024,    // Warn at 15MB
  WARN_ASSET_COUNT: 50
};
```

**Behavior**:
- Warn user if limits exceeded, but allow publish (non-blocking)
- Log asset gathering errors for debugging
- Return unresolved assets list for transparency

---

## Implementation Checklist

### Client-side (renderer/js/services/publishing/)
- [x] `publish-utils.js` — Asset validation with size limits
- [x] `error-types.js` — Structured error handling
- [x] `worker-publish-adapter.js` — Password cleared after use
- [x] `publish-orchestrator.js` — Validation before delegation
- [x] Console logging removes sensitive data

### Server-side (cf-publish-worker, out of scope)
- [ ] Implement salted password hashing (PBKDF2/bcrypt)
- [ ] Use HTTP-only cookies for auth (not URL params)
- [ ] Add rate limiting middleware
- [ ] Log all publish operations with timestamps
- [ ] Implement suspicious activity alerts

### Documentation
- [x] This ADR documents the hardening strategy
- [ ] PUBLISH_SERVICE.md includes security section
- [ ] Worker README includes password best practices
- [ ] DEPLOYMENT.md includes security configuration

---

## Alternatives Considered

### A. OAuth/Single Sign-On for Password Protection
**Rejected**: Too complex for simple share-and-protect use case. Document passwords are often temporary/throwaway.

### B. Client-side encryption (TweetNaCl.js)
**Rejected**: False sense of security—Worker needs plaintext to serve document. Encryption at rest only helps if worker is compromised, which is out of scope.

### C. No password protection (rely on slug obscurity)
**Rejected**: Users explicitly request password protection; slug-only is not secure.

---

## Risk Analysis

### Residual Risks (Accepted)
1. **Worker compromise**: If cf-publish-worker is compromised, all documents and passwords are exposed. *Mitigation*: Assume Cloudflare infrastructure is secure; focus on client-side best practices.

2. **Network interception**: HTTPS prevents this, but misconfiguration of SSL/TLS still possible. *Mitigation*: Enforce HSTS headers on worker domain.

3. **Timing attacks on password check**: Vulnerable to timing-based password guess. *Mitigation*: Use constant-time comparison on worker (bcrypt/PBKDF2 do this automatically).

### Mitigated Risks
- [x] Rainbow table attacks (once server uses salted hashing)
- [x] Accidental password leaks in logs
- [x] Malicious asset bundling (size limits enforced)
- [x] Slug collision attacks (validation + availability check)

---

## References

- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [NIST Digital Identity Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [Mermaid Security Docs](https://mermaid.js.org/config/configuration.html)
- Phase 2.1 Refactor Plan: `docs/decisions/20260428-project-map-mirror-fidelity.md`

---

## Follow-up Tasks

1. **Worker Upgrade PR**: Migrate Handoff token + password handling to cf-publish-worker
2. **Rate Limiting Metrics**: Add publish attempt logging to monitoring dashboard
3. **Security Audit**: Third-party review of worker password handling
4. **User Education**: Add "Security Tips" to Publish dialog (recommended practices)

---

*Status as of 2026-05-02: All client-side mitigations implemented. Awaiting worker-side password hardening upgrade.*
