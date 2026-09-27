import type { BillBiller, BillProduct } from '@/api/endpoints/bill-payments';

/**
 * How the catalogue is presented: which screen a category gets, which network
 * a phone number belongs to, and how data plans are grouped into tabs.
 */

export type BillCategoryKind = 'airtime' | 'internet' | 'electricity' | 'cable';

/** The screen a category is paid on, from the name the backend gives it. */
export function billCategoryKind(categoryName: string | undefined): BillCategoryKind | null {
  const name = (categoryName ?? '').toLowerCase();
  if (name.includes('airtime')) return 'airtime';
  if (name.includes('internet') || name.includes('data')) return 'internet';
  if (name.includes('electric') || name.includes('power')) return 'electricity';
  if (name.includes('tv') || name.includes('cable')) return 'cable';
  return null;
}

/**
 * Nigerian mobile number prefixes by network. A number can be ported, so this
 * only preselects: the payer can still change the network.
 */
const NETWORK_PREFIXES: Record<string, readonly string[]> = {
  MTN: [
    '07025',
    '07026',
    '0703',
    '0704',
    '0706',
    '0803',
    '0806',
    '0810',
    '0813',
    '0814',
    '0816',
    '0903',
    '0906',
    '0913',
    '0916',
  ],
  AIRTEL: ['0701', '0708', '0802', '0808', '0812', '0901', '0902', '0904', '0907', '0911', '0912'],
  GLO: ['0705', '0805', '0807', '0811', '0815', '0905', '0915'],
  '9MOBILE': ['0809', '0817', '0818', '0908', '0909'],
};

/** The network a local-form number (0803…) most likely belongs to. */
export function detectNetwork(phone: string): string | null {
  // Longest prefixes first, so 07025 is not read as some other 0702x.
  const entries = Object.entries(NETWORK_PREFIXES).flatMap(([network, prefixes]) =>
    prefixes.map((prefix) => [network, prefix] as const),
  );
  entries.sort((left, right) => right[1].length - left[1].length);
  return entries.find(([, prefix]) => phone.startsWith(prefix))?.[0] ?? null;
}

/** The biller for a network in this category: "MTN" for airtime, "MTN-DATA" for data. */
export function billerForNetwork(
  billers: readonly BillBiller[],
  network: string,
): BillBiller | null {
  return (
    billers.find(
      (biller) => biller.providerCode === network || biller.providerCode === `${network}-DATA`,
    ) ?? null
  );
}

export type PlanPeriod = 'all' | 'daily' | 'weekly' | 'monthly' | 'other';

export const PLAN_PERIOD_LABELS: Record<PlanPeriod, string> = {
  all: 'All',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  other: 'Other',
};

/** Which tab a package belongs on, from how long it lasts. */
export function planPeriod(validity: string | null): Exclude<PlanPeriod, 'all'> {
  const match = /(\d+)\s*(day|week|month)/i.exec(validity ?? '');
  if (!match) return 'other';
  const count = Number(match[1]);
  const unit = (match[2] ?? '').toLowerCase();
  const days = unit === 'month' ? count * 30 : unit === 'week' ? count * 7 : count;
  if (days <= 3) return 'daily';
  if (days <= 14) return 'weekly';
  return 'monthly';
}

/** The tabs worth showing for a biller's packages: "All" plus each period present. */
export function planPeriods(products: readonly BillProduct[]): PlanPeriod[] {
  const present = new Set(products.map((product) => planPeriod(product.validity)));
  const ordered: PlanPeriod[] = ['daily', 'weekly', 'monthly', 'other'];
  const periods = ordered.filter((period) => present.has(period as Exclude<PlanPeriod, 'all'>));
  return periods.length > 1 ? ['all', ...periods] : ['all'];
}

export function plansFor(products: readonly BillProduct[], period: PlanPeriod): BillProduct[] {
  return period === 'all'
    ? [...products]
    : products.filter((product) => planPeriod(product.validity) === period);
}

/**
 * A plan name split for display, so "7GB" can be drawn as a large "7" and a
 * small "GB" like a price tag. Names that are not a size stay whole.
 */
export function planSize(name: string): { value: string; unit: string } | null {
  const match = /^(\d+(?:\.\d+)?)\s*(GB|MB|TB)$/i.exec(name.trim());
  return match ? { value: match[1] ?? '', unit: (match[2] ?? '').toUpperCase() } : null;
}

/** The short mark drawn on a provider badge: "MTN", "GLO", "DSTV", "AI". */
export function providerMark(name: string): string {
  const first = name.trim().split(/\s+/)[0] ?? '';
  return (first.length <= 4 ? first : first.slice(0, 2)).toUpperCase();
}

/** One-tap amounts, in naira, that also respect the product's limits. */
export function amountPresets(kind: BillCategoryKind): readonly number[] {
  return kind === 'electricity'
    ? [1_000, 2_000, 3_000, 5_000, 10_000, 20_000]
    : [50, 100, 200, 500, 1_000, 2_000];
}
