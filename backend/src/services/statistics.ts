/**
 * Self-contained statistics utilities for correlation analysis.
 *
 * No external dependencies: correlation coefficients, a Student-t p-value via the
 * regularized incomplete beta function, Benjamini-Hochberg FDR, and Cohen's d.
 */

export interface MeanStddev {
  mean: number;
  stddev: number;
}

/** Sample mean and (sample, n-1) standard deviation. */
export function meanStddev(values: number[]): MeanStddev {
  if (values.length === 0) return { mean: 0, stddev: 0 };
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (values.length === 1) return { mean, stddev: 0 };
  const variance =
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1);
  return { mean, stddev: Math.sqrt(variance) };
}

/** Pearson product-moment correlation. Returns 0 when undefined (n<2 or zero variance). */
export function pearson(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;
  let sx = 0;
  let sy = 0;
  for (let i = 0; i < n; i++) {
    sx += x[i];
    sy += y[i];
  }
  const mx = sx / n;
  const my = sy / n;
  let num = 0;
  let dx2 = 0;
  let dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx;
    const dy = y[i] - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }
  const denom = Math.sqrt(dx2 * dy2);
  if (denom === 0) return 0;
  return num / denom;
}

/** Fractional ranks with average-of-ties (1-based). */
export function rank(values: number[]): number[] {
  const n = values.length;
  const idx = values.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
  const ranks = new Array<number>(n);
  let i = 0;
  while (i < n) {
    let j = i;
    while (j + 1 < n && idx[j + 1].v === idx[i].v) j++;
    // Positions i..j are tied; average rank (1-based) is (i + j)/2 + 1
    const avgRank = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) ranks[idx[k].i] = avgRank;
    i = j + 1;
  }
  return ranks;
}

/** Spearman rank correlation (Pearson on ranks). */
export function spearman(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;
  return pearson(rank(x.slice(0, n)), rank(y.slice(0, n)));
}

// --- Student-t two-sided p-value via regularized incomplete beta ------------

/** Natural log of the gamma function (Lanczos approximation). */
function lgamma(x: number): number {
  /* eslint-disable no-loss-of-precision -- standard Lanczos g=5 coefficients */
  const c = [
    76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5,
  ];
  let ser = 1.000000000190015;
  /* eslint-enable no-loss-of-precision */
  const SQRT_2PI = Math.sqrt(2 * Math.PI);
  let y = x;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  for (let j = 0; j < 6; j++) {
    y += 1;
    ser += c[j] / y;
  }
  return -tmp + Math.log((SQRT_2PI * ser) / x);
}

/** Continued fraction for the incomplete beta function (Numerical Recipes betacf). */
function betacf(a: number, b: number, x: number): number {
  const FPMIN = 1e-30;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= 200; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 3e-11) break;
  }
  return h;
}

/** Regularized incomplete beta function I_x(a, b). */
function betai(a: number, b: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(
    lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x)
  );
  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betacf(a, b, x)) / a;
  }
  return 1 - (bt * betacf(b, a, 1 - x)) / b;
}

/**
 * Two-sided p-value for a correlation coefficient r over n observations,
 * using the Student-t distribution with df = n - 2.
 * Returns 1 when undefined (n < 3), and a tiny value for a perfect correlation.
 */
export function correlationPValue(r: number, n: number): number {
  if (n < 3) return 1;
  const rr = Math.max(-1, Math.min(1, r));
  if (Math.abs(rr) >= 1) return 0;
  const df = n - 2;
  const t2 = (rr * rr * df) / (1 - rr * rr);
  // Two-sided p = I_{df/(df+t^2)}(df/2, 1/2)
  return betai(df / 2, 0.5, df / (df + t2));
}

/**
 * Benjamini-Hochberg FDR adjustment. Returns q-values aligned to the input order.
 * Valid under positive dependence (as in the overlapping lag/window grid).
 */
export function benjaminiHochberg(pValues: number[]): number[] {
  const m = pValues.length;
  if (m === 0) return [];
  const order = pValues.map((p, i) => ({ p, i })).sort((a, b) => a.p - b.p);
  const q = new Array<number>(m);
  let prev = 1;
  for (let k = m - 1; k >= 0; k--) {
    const rank1 = k + 1;
    const val = Math.min(prev, (order[k].p * m) / rank1);
    q[order[k].i] = val;
    prev = val;
  }
  return q;
}

/** Cohen's d (pooled standard deviation) for two groups. Returns 0 if undefined. */
export function cohensD(a: number[], b: number[]): number {
  if (a.length < 2 || b.length < 2) return 0;
  const sa = meanStddev(a);
  const sb = meanStddev(b);
  const na = a.length;
  const nb = b.length;
  const pooledVar =
    ((na - 1) * sa.stddev ** 2 + (nb - 1) * sb.stddev ** 2) / (na + nb - 2);
  const pooled = Math.sqrt(pooledVar);
  if (pooled === 0) return 0;
  return (sa.mean - sb.mean) / pooled;
}
