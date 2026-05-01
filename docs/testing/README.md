# Testing

**Test guides, procedures, and quality assurance**

---

## Guides

| Guide | Purpose | Coverage |
|-------|---------|----------|
| [Manual Tests](manual-tests.md) | 12 step-by-step test procedures | XSS protection, features, edge cases |

---

## Running Tests

### Unit Tests (21 tests)
```bash
npm run test
```

### Integration Tests
```bash
bash scripts/test-phase-1-1.sh
```

### Manual Tests (12 procedures)
```bash
# Follow steps in manual-tests.md
# Use provided curl commands
```

---

## Test Coverage

- ✅ **21 unit tests** — Core rendering functions
- ✅ **12 manual tests** — End-to-end procedures
- ✅ **Integration tests** — Server + worker validation
- ✅ **Security tests** — XSS protection verification

---

## Quick Questions

**"How do I test XSS protection?"**
→ [Manual Tests - XSS Protection](manual-tests.md#xss-protection-tests)

**"How do I test a new feature?"**
→ [Manual Tests - Feature Testing](manual-tests.md#feature-tests)

**"What should pass/fail?"**
→ [Manual Tests - Pass/Fail Criteria](manual-tests.md)

---

## Testing Checklist

Before committing:

- [ ] Run `npm run test` — all 21 unit tests pass
- [ ] Run `npm run lint` — no linting errors
- [ ] Run manual tests for your changes
- [ ] Verify XSS protection still works
- [ ] Check for regressions

---

## For QA Engineers

1. **Get Started** → [Getting Started - Setup](../guides/getting-started/setup.md)
2. **Understand Features** → [Feature Documentation](../features/)
3. **Run Tests** → [Manual Tests](manual-tests.md)
4. **Check Security** → [Security Policy](../security/policy.md)

---

## Related Documentation

- **Setup** — [Getting Started - Setup](../guides/getting-started/setup.md)
- **Features** — [All Features](../features/)
- **Security** — [Security Policy](../security/policy.md)

---

[← Back to Documentation](../00-START.md)
