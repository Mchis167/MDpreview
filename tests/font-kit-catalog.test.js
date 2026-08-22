import { describe, it, expect } from 'vitest';
const { createCatalog, ROLE_CATEGORIES } = require('../shared/font-kit/catalog.js');

// Shape trimmed from https://fonts.google.com/metadata/fonts
const METADATA = {
  familyMetadataList: [
    { family: 'Lexend', category: 'Sans Serif', subsets: ['menu', 'latin', 'vietnamese'], fonts: { 400: {}, 500: {}, 600: {}, 700: {} } },
    { family: 'Lexend Deca', category: 'Sans Serif', subsets: ['menu', 'latin'], fonts: { 400: {}, 700: {} } },
    { family: 'Playfair Display', category: 'Serif', subsets: ['menu', 'latin', 'vietnamese'], fonts: { 400: {}, 700: {} } },
    { family: 'JetBrains Mono', category: 'Monospace', subsets: ['menu', 'latin'], fonts: { 400: {}, 500: {}, 700: {} } },
    { family: 'Caveat', category: 'Handwriting', subsets: ['menu', 'latin'], fonts: { 400: {} } }
  ]
};

function catalogWith(json = METADATA) {
  let calls = 0;
  const catalog = createCatalog({
    fetchJson: async () => {
      calls += 1;
      return json;
    }
  });
  return { catalog, calls: () => calls };
}

describe('font-kit/catalog load', () => {
  it('normalizes the metadata into {family, category, subsets, weights}', async () => {
    const { catalog } = catalogWith();
    const families = await catalog.load();

    expect(families).toHaveLength(5);
    expect(families[0]).toEqual({
      family: 'Lexend',
      category: 'Sans Serif',
      subsets: ['menu', 'latin', 'vietnamese'],
      weights: ['400', '500', '600', '700']
    });
  });

  it('fetches once and reuses the result', async () => {
    const { catalog, calls } = catalogWith();
    await catalog.load();
    await catalog.load();
    expect(calls()).toBe(1);
  });

  it('survives a family entry missing fonts/subsets', async () => {
    const { catalog } = catalogWith({ familyMetadataList: [{ family: 'Odd', category: 'Serif' }] });
    const [odd] = await catalog.load();
    expect(odd.weights).toEqual([]);
    expect(odd.subsets).toEqual([]);
  });
});

describe('font-kit/catalog search', () => {
  it('matches case-insensitively on any part of the family name', async () => {
    const { catalog } = catalogWith();
    await catalog.load();
    expect(catalog.search('lex').map((f) => f.family)).toEqual(['Lexend', 'Lexend Deca']);
    expect(catalog.search('MONO').map((f) => f.family)).toEqual(['JetBrains Mono']);
  });

  it('ranks an exact prefix match above a mid-string match', async () => {
    const { catalog } = catalogWith();
    await catalog.load();
    // "Deca" appears mid-name in "Lexend Deca"; "Caveat" starts with "Ca".
    expect(catalog.search('ca')[0].family).toBe('Caveat');
  });

  it('returns everything for an empty query', async () => {
    const { catalog } = catalogWith();
    await catalog.load();
    expect(catalog.search('')).toHaveLength(5);
  });

  it('limits the result count when asked', async () => {
    const { catalog } = catalogWith();
    await catalog.load();
    expect(catalog.search('', { limit: 2 })).toHaveLength(2);
  });
});

describe('font-kit/catalog role filtering', () => {
  it('offers only monospace families for the code role', async () => {
    const { catalog } = catalogWith();
    await catalog.load();
    expect(catalog.search('', { role: 'code' }).map((f) => f.family)).toEqual(['JetBrains Mono']);
  });

  it('excludes monospace from the body role', async () => {
    const { catalog } = catalogWith();
    await catalog.load();
    expect(catalog.search('', { role: 'body' }).map((f) => f.family))
      .not.toContain('JetBrains Mono');
  });

  it('lets display and handwriting through for the title role', async () => {
    const { catalog } = catalogWith();
    await catalog.load();
    const titles = catalog.search('', { role: 'title' }).map((f) => f.family);
    expect(titles).toContain('Playfair Display');
    expect(titles).toContain('Caveat');
  });

  it('declares a category set for each of the three roles', () => {
    expect(Object.keys(ROLE_CATEGORIES).sort()).toEqual(['body', 'code', 'title']);
  });
});

describe('font-kit/catalog weight negotiation', () => {
  it('keeps only the wanted weights the family actually ships', async () => {
    const { catalog } = catalogWith();
    await catalog.load();
    // Lexend Deca has no 600 — asking Google for it is pointless.
    expect(catalog.weightsFor('Lexend Deca', ['400', '600', '700'])).toEqual(['400', '700']);
    expect(catalog.weightsFor('Lexend', ['400', '600', '700'])).toEqual(['400', '600', '700']);
  });

  it('falls back to the wanted weights for an unknown family', async () => {
    const { catalog } = catalogWith();
    await catalog.load();
    expect(catalog.weightsFor('Not In Catalog', ['400', '700'])).toEqual(['400', '700']);
  });

  it('falls back to 400 when nothing overlaps', async () => {
    const { catalog } = catalogWith();
    await catalog.load();
    expect(catalog.weightsFor('Caveat', ['600', '700'])).toEqual(['400']);
  });
});
