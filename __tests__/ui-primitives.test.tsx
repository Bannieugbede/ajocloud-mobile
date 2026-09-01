import { fireEvent, render } from '@testing-library/react-native';

import { AppAmount } from '@/components/ui/app-amount';
import { AppBadge, statusLabel, statusTone } from '@/components/ui/app-badge';
import { AppCard } from '@/components/ui/app-card';
import { AppIconButton } from '@/components/ui/app-icon-button';
import { AppListItem } from '@/components/ui/app-list-item';
import { AppProgress } from '@/components/ui/app-progress';
import { AppSearch } from '@/components/ui/app-search';
import { AppEmptyState, AppErrorState } from '@/components/ui/app-state';
import { AppText } from '@/components/ui/app-text';

describe('AppCard', () => {
  it('stays a plain container until it is given an action', async () => {
    const view = await render(
      <AppCard>
        <AppText>Group</AppText>
      </AppCard>,
    );
    expect(view.queryByRole('button')).toBeNull();
  });

  it('exposes the whole surface as one labelled button when pressable', async () => {
    const onPress = jest.fn();
    const view = await render(
      <AppCard onPress={onPress} accessibilityLabel="Open Lagos Traders">
        <AppText>Lagos Traders</AppText>
      </AppCard>,
    );
    fireEvent.press(view.getByRole('button', { name: 'Open Lagos Traders' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('AppAmount', () => {
  it('formats minor units exactly, including beyond safe-integer range', async () => {
    const view = await render(<AppAmount amountMinor="123456789012345678901" />);
    expect(view.getByText('₦1,234,567,890,123,456,789.01')).toBeTruthy();
  });

  it('masks the value but still announces that the balance is hidden', async () => {
    const view = await render(<AppAmount amountMinor="500000" hidden />);
    expect(view.getByLabelText('Balance hidden')).toBeTruthy();
    expect(view.queryByText('₦5,000.00')).toBeNull();
  });
});

describe('AppBadge', () => {
  it('carries meaning in the label rather than colour alone', async () => {
    const view = await render(<AppBadge label={statusLabel('PENDING_REVIEW')} tone="warning" />);
    expect(view.getByText('Pending Review')).toBeTruthy();
  });

  it('maps domain statuses onto consistent tones', async () => {
    expect(statusTone('ACTIVE')).toBe('success');
    expect(statusTone('DEFAULTED')).toBe('error');
    expect(statusTone('PENDING')).toBe('warning');
    expect(statusTone('SOMETHING_NEW')).toBe('neutral');
  });
});

describe('AppProgress', () => {
  it('reports basis points as an accessible percentage', async () => {
    const view = await render(<AppProgress progressBps={4250} label="Rent goal" />);
    const bar = view.getByLabelText('Rent goal');
    expect(bar.props.accessibilityRole).toBe('progressbar');
    expect(bar.props.accessibilityValue).toMatchObject({ now: 43, text: '43 percent' });
  });

  it('clamps values that fall outside the valid range', async () => {
    const view = await render(<AppProgress progressBps={99999} label="Overfunded" />);
    expect(view.getByLabelText('Overfunded').props.accessibilityValue.now).toBe(100);
  });
});

describe('state components', () => {
  it('offers a retry action on failure', async () => {
    const onRetry = jest.fn();
    const view = await render(
      <AppErrorState description="Network unavailable." onRetry={onRetry} />,
    );
    fireEvent.press(view.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders an empty state without an action when none is supplied', async () => {
    const view = await render(<AppEmptyState title="No groups" description="Nothing here yet." />);
    expect(view.getByText('No groups')).toBeTruthy();
    expect(view.queryByRole('button')).toBeNull();
  });
});

describe('AppIconButton', () => {
  it('requires and exposes an accessible name for the icon', async () => {
    const onPress = jest.fn();
    const view = await render(
      <AppIconButton icon="eye-outline" label="Show wallet balance" onPress={onPress} />,
    );
    fireEvent.press(view.getByRole('button', { name: 'Show wallet balance' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire while disabled', async () => {
    const onPress = jest.fn();
    const view = await render(
      <AppIconButton icon="eye-outline" label="Show balance" onPress={onPress} disabled />,
    );
    fireEvent.press(view.getByRole('button', { name: 'Show balance' }));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('AppListItem', () => {
  it('announces the title and description as one row', async () => {
    const onPress = jest.fn();
    const view = await render(
      <AppListItem title="Security" description="PIN and biometrics" onPress={onPress} />,
    );
    fireEvent.press(view.getByRole('button', { name: 'Security. PIN and biometrics' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('AppSearch', () => {
  it('clears the query through a labelled control', async () => {
    const onChangeText = jest.fn();
    const view = await render(
      <AppSearch value="lagos" onChangeText={onChangeText} label="Search Ajo groups" />,
    );
    fireEvent.press(view.getByRole('button', { name: 'Clear search' }));
    expect(onChangeText).toHaveBeenCalledWith('');
  });

  it('hides the clear control when the query is empty', async () => {
    const view = await render(
      <AppSearch value="" onChangeText={jest.fn()} label="Search Ajo groups" />,
    );
    expect(view.queryByRole('button', { name: 'Clear search' })).toBeNull();
  });
});
