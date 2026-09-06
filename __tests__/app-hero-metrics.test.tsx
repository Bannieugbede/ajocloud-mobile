import { render } from '@testing-library/react-native';

import { AppHero } from '@/components/ui/app-hero';
import { AppMedallion } from '@/components/ui/app-medallion';
import { AppMetricRow } from '@/components/ui/app-metric-row';

describe('AppHero', () => {
  it('reads its figure as money, not as loose digits', async () => {
    const view = await render(
      <AppHero label="TOTAL COLLECTED" amountMinor="2250000" currency="NGN" />,
    );
    expect(view.getByText('TOTAL COLLECTED')).toBeTruthy();
    expect(view.getByLabelText('₦22,500.00')).toBeTruthy();
  });

  it('leads with a caption when there is no amount', async () => {
    // Food programmes and other non-money heroes still need the same surface.
    const view = await render(<AppHero label="OPEN FOOD AJO" caption="December Hampers" />);
    expect(view.getByText('December Hampers')).toBeTruthy();
  });

  it('announces progress as a value, not only as a coloured bar', async () => {
    const view = await render(
      <AppHero
        label="COLLECTED"
        amountMinor="0"
        progressBps={5625}
        progressLabel="Dues progress"
      />,
    );
    const bar = view.getByLabelText('Dues progress');
    expect(bar.props.accessibilityValue).toMatchObject({ now: 56, text: '56 percent' });
  });

  it('never draws a bar past its track, however far past target it is', async () => {
    const view = await render(
      <AppHero label="COLLECTED" amountMinor="0" progressBps={24000} progressLabel="Overpaid" />,
    );
    expect(view.getByLabelText('Overpaid').props.accessibilityValue.now).toBe(100);
  });

  it('draws no bar at all when there is no progress to report', async () => {
    // A bar defaulting to zero reads as a stalled collection rather than one
    // that simply does not track progress. Asserted by the bar's accessible
    // name: queryByRole('progressbar') matches nothing here either way, so it
    // would pass whether or not the bar were drawn.
    const view = await render(
      <AppHero label="PAYING" amountMinor="500000" progressLabel="Payment progress" />,
    );
    expect(view.queryByLabelText('Payment progress')).toBeNull();
  });
});

describe('AppMetricRow', () => {
  it('reads each fact as a labelled pair rather than a stray number', async () => {
    // Three bare numbers side by side tell a screen-reader user nothing about
    // which is which.
    const view = await render(
      <AppMetricRow
        metrics={[
          { label: 'Amount', value: '₦5,000.00' },
          { label: 'Members', value: '8' },
          { label: 'Due Date', value: 'Aug 30' },
        ]}
      />,
    );
    expect(view.getByLabelText('Amount: ₦5,000.00')).toBeTruthy();
    expect(view.getByLabelText('Members: 8')).toBeTruthy();
    expect(view.getByLabelText('Due Date: Aug 30')).toBeTruthy();
  });
});

describe('AppMedallion', () => {
  it('announces nothing of its own', async () => {
    // The heading beneath always says what happened, so the glyph would stop a
    // screen reader on a second, wordless element. It is hidden thoroughly
    // enough that the testing library's queries cannot reach it either — which
    // is the assertion: nothing here is addressable by role, label or test id.
    const view = await render(
      <AppMedallion icon="checkmark-circle" tone="success" testID="mark" />,
    );
    expect(view.queryByTestId('mark')).toBeNull();
    expect(view.queryByLabelText(/checkmark/i)).toBeNull();
  });

  it('tints itself by tone rather than by the caller passing colours', async () => {
    // Six screens used to pass their own tint and soft background. A tone name
    // means a palette change lands everywhere at once.
    // Same icon in both, so the tone is the only thing that can differ.
    const success = await render(<AppMedallion icon="checkmark-circle" tone="success" />);
    const error = await render(<AppMedallion icon="checkmark-circle" tone="error" />);
    expect(JSON.stringify(success.toJSON())).not.toBe(JSON.stringify(error.toJSON()));
  });
});
