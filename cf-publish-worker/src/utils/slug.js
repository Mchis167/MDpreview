/**
 * Simple slug validator
 */
export function isValidSlug(slug) {
  if (!slug || typeof slug !== 'string') return false;
  // Allow a-z, 0-9, hyphens, and underscores. 1-100 chars.
  const regex = /^[a-z0-9-_]{1,100}$/i;
  return regex.test(slug);
}
