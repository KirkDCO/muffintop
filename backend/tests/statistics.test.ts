import { describe, it, expect } from 'vitest';
import {
  pearson,
  spearman,
  rank,
  correlationPValue,
  benjaminiHochberg,
  cohensD,
} from '../src/services/statistics.js';

describe('pearson', () => {
  it('is +1 for a perfectly increasing linear relationship', () => {
    expect(pearson([1, 2, 3], [2, 4, 6])).toBeCloseTo(1, 10);
  });

  it('is -1 for a perfectly decreasing linear relationship', () => {
    expect(pearson([1, 2, 3], [6, 4, 2])).toBeCloseTo(-1, 10);
  });

  it('matches a hand-computed value', () => {
    // mx=3, my=4 -> r = 6 / sqrt(60)
    expect(pearson([1, 2, 3, 4, 5], [2, 4, 5, 4, 5])).toBeCloseTo(0.774597, 5);
  });

  it('returns 0 for zero variance or n<2', () => {
    expect(pearson([1, 1, 1], [1, 2, 3])).toBe(0);
    expect(pearson([1], [1])).toBe(0);
  });
});

describe('rank', () => {
  it('assigns average ranks to ties', () => {
    expect(rank([2, 4, 5, 4, 5])).toEqual([1, 2.5, 4.5, 2.5, 4.5]);
  });
});

describe('spearman', () => {
  it('is +1 for a monotonic (non-linear) increasing relationship', () => {
    expect(spearman([1, 2, 3, 4], [1, 4, 9, 16])).toBeCloseTo(1, 10);
  });

  it('matches a hand-computed value with ties', () => {
    expect(spearman([1, 2, 3, 4, 5], [2, 4, 5, 4, 5])).toBeCloseTo(0.7378648, 5);
  });
});

describe('correlationPValue', () => {
  it('returns 1 when n < 3', () => {
    expect(correlationPValue(0.9, 2)).toBe(1);
  });

  it('returns ~0.05 at the two-tailed critical r for df=10', () => {
    // r=0.576 is the 5% two-tailed critical value for n=12 (df=10)
    expect(correlationPValue(0.576, 12)).toBeCloseTo(0.05, 2);
  });

  it('gives a large p for no correlation and a tiny p for a perfect one', () => {
    expect(correlationPValue(0, 30)).toBe(1);
    expect(correlationPValue(1, 30)).toBe(0);
    expect(correlationPValue(0.9, 30)).toBeLessThan(0.001);
  });
});

describe('benjaminiHochberg', () => {
  it('adjusts a uniform ramp to a constant q', () => {
    const q = benjaminiHochberg([0.01, 0.02, 0.03, 0.04, 0.05]);
    q.forEach((v) => expect(v).toBeCloseTo(0.05, 10));
  });

  it('preserves input order and enforces monotonicity', () => {
    const q = benjaminiHochberg([0.001, 0.5]);
    expect(q[0]).toBeCloseTo(0.002, 10);
    expect(q[1]).toBeCloseTo(0.5, 10);
  });

  it('returns empty for empty input', () => {
    expect(benjaminiHochberg([])).toEqual([]);
  });
});

describe('cohensD', () => {
  it('matches a hand-computed pooled effect size', () => {
    // means 3 and 5, equal SDs -> d = -2 / 1.5811
    expect(cohensD([1, 2, 3, 4, 5], [3, 4, 5, 6, 7])).toBeCloseTo(-1.264911, 5);
  });

  it('returns 0 when a group has zero variance and no spread', () => {
    expect(cohensD([2, 2, 2], [2, 2, 2])).toBe(0);
  });
});
