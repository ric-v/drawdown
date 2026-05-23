// Feature: ui-overhaul-ai-insights, Property: Sparkline variant token resolution
import fc from 'fast-check';
import { sparklineVariants, variantColorMap } from '../sparkline';

/**
 * Validates: Requirements 1.5
 *
 * Property: Each CVA variant in sparklineVariants resolves to the expected
 * CSS variable token from variantColorMap, ensuring the design-token contract
 * is maintained for all sparkline color states.
 */
describe('Sparkline variant token resolution (property)', () => {
  const allVariants = ['positive', 'negative', 'neutral'] as const;

  const expectedTokens: Record<(typeof allVariants)[number], string> = {
    positive: 'var(--positive)',
    negative: 'var(--negative)',
    neutral: 'var(--neutral)',
  };

  it('variantColorMap maps every variant to its expected CSS variable token', () => {
    fc.assert(
      fc.property(fc.constantFrom(...allVariants), (variant) => {
        expect(variantColorMap[variant]).toBe(expectedTokens[variant]);
      }),
      { numRuns: 100 }
    );
  });

  it('sparklineVariants accepts every defined variant without throwing', () => {
    fc.assert(
      fc.property(fc.constantFrom(...allVariants), (variant) => {
        const result = sparklineVariants({ variant });
        expect(typeof result).toBe('string');
      }),
      { numRuns: 100 }
    );
  });

  it('every variantColorMap value follows the var(--<name>) pattern', () => {
    fc.assert(
      fc.property(fc.constantFrom(...allVariants), (variant) => {
        const token = variantColorMap[variant];
        expect(token).toMatch(/^var\(--[a-z]+\)$/);
      }),
      { numRuns: 100 }
    );
  });

  it('variant name matches the CSS variable name inside the token', () => {
    fc.assert(
      fc.property(fc.constantFrom(...allVariants), (variant) => {
        const token = variantColorMap[variant];
        const match = token.match(/^var\(--([a-z]+)\)$/);
        expect(match).not.toBeNull();
        expect(match![1]).toBe(variant);
      }),
      { numRuns: 100 }
    );
  });

  it('variantColorMap keys exactly match the set of defined CVA variants', () => {
    const variantMapKeys = Object.keys(variantColorMap).sort();
    expect(variantMapKeys).toEqual([...allVariants].sort());
  });

  it('all variant tokens are distinct (no two variants share a token)', () => {
    const tokens = Object.values(variantColorMap);
    const uniqueTokens = new Set(tokens);
    expect(uniqueTokens.size).toBe(tokens.length);
  });

  it('variantColorMap is exhaustive — every variant has a mapping', () => {
    for (const variant of allVariants) {
      expect(variantColorMap).toHaveProperty(variant);
      expect(variantColorMap[variant]).toBeDefined();
      expect(variantColorMap[variant].length).toBeGreaterThan(0);
    }
  });
});
