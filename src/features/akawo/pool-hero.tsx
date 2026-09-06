import { AppHero } from '@/components/ui/app-hero';
import { formatMinorAmount } from '@/utils/money';

/**
 * The collection banner at the top of a pool.
 *
 * A thin arrangement of `AppHero`: what is Akawo-specific is only how the
 * numbers are worded — a target, a deadline, members paid — so that lives here
 * and the surface itself stays shared with every other product's hero.
 */
export function PoolHero({
  label,
  collectedMinor,
  targetMinor,
  currency,
  dueLabel,
  paidCount,
  memberCount,
  progressBps,
  testID,
}: {
  label: string;
  collectedMinor: string;
  /** The full expected amount. Omitted when nothing has been set to collect. */
  targetMinor?: string;
  currency: string;
  dueLabel?: string;
  paidCount: number;
  memberCount: number;
  progressBps: number;
  testID?: string;
}) {
  const meta = [
    targetMinor ? `Target: ${formatMinorAmount(targetMinor, currency)}` : null,
    dueLabel ? `Due: ${dueLabel}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const percent = Math.max(0, Math.min(100, Math.round(progressBps / 100)));

  return (
    <AppHero
      label={label}
      amountMinor={collectedMinor}
      currency={currency}
      meta={meta || undefined}
      progressBps={progressBps}
      progressLabel="Collection progress"
      footer={[`${paidCount}/${memberCount} members paid`, `${percent}% of target`]}
      testID={testID}
    />
  );
}
