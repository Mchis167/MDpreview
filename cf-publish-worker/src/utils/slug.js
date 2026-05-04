/**
 * Simple slug validator
 */
export function isValidSlug(slug) {
  if (!slug || typeof slug !== 'string') return false;
  // Allow a-z, 0-9, hyphens, and underscores. 1-100 chars.
  const regex = /^[a-z0-9-_]{1,100}$/i;
  return regex.test(slug);
}

/**
 * Convert heading text to a URL-safe slug.
 * Handles Vietnamese, emoji, and special characters.
 * @param {string} text - Raw heading text (HTML stripped)
 * @param {Map} usedSlugs - Track duplicate slugs for deduplication
 * @returns {string}
 */
export function slugifyHeading(text, usedSlugs = new Map()) {
  let slug = text
    .toLowerCase()
    .normalize('NFD')                        // Decompose: "ề" → "e" + combining
    .replace(/[\u0300-\u036f]/g, '')         // Strip combining diacritics
    .replace(/đ/g, 'd').replace(/Đ/g, 'd')   // Vietnamese đ → d
    .replace(/[^\w\s-]/g, '')               // Remove non-word chars
    .replace(/[\s_]+/g, '-')                // Spaces/underscores → hyphen
    .replace(/^-+|-+$/g, '')                // Trim hyphens
    || 'section';                           // Fallback if empty

  // Deduplication
  let finalSlug = slug;
  let count = usedSlugs.get(slug) || 0;
  
  if (count > 0) {
    finalSlug = `${slug}-${count}`;
  }
  
  usedSlugs.set(slug, count + 1);
  return finalSlug;
}
