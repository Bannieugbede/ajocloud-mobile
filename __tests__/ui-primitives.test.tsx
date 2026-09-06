import { act, fireEvent, render } from '@testing-library/react-native';

import { AppAmount } from '@/components/ui/app-amount';
import { AppCard } from '@/components/ui/app-card';
import { AppIconButton } from '@/components/ui/app-icon-button';
import { AppListItem } from '@/components/ui/app-list-item';
import { AppProgress } from '@/components/ui/app-progress';
import { AppSearch } from '@/components/ui/app-search';
import { AppEmptyState, AppErrorState } from '@/components/ui/app-state';
import { AppText } from '@/components/ui/app-text';
import { statusLabel } from '@/utils/status';

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

describe('statusLabel', () => {
  it('renders a domain status as readable text', () => {
    expect(statusLabel('PENDING_REVIEW')).toBe('Pending Review');
    expect(statusLabel('ACTIVE')).toBe('Active');
  });

  it('tolerates an unexpected shape rather than throwing', () => {
    expect(statusLabel('')).toBe('');
    expect(statusLabel('__ODD__VALUE__')).toBe('Odd Value');
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

describe('the empty state', () => {
  it('offers a way out of the empty screen when there is one', async () => {
    // The Ajo list used to say "Groups you create or join will appear here"
    // with nothing to press, while the header carried both buttons. An empty
    // state that names an action and cannot perform it is a dead end.
    const onAction = jest.fn();
    const view = await render(
      <AppEmptyState
        title="No Ajo groups yet"
        description="Start a circle with people you trust."
        action="Create a group"
        onAction={onAction}
      />,
    );

    await act(async () => fireEvent.press(view.getByText('Create a group')));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('offers a quieter second route alongside the main one', async () => {
    const onAction = jest.fn();
    const onSecondaryAction = jest.fn();
    const view = await render(
      <AppEmptyState
        title="No Ajo groups yet"
        description="Start a circle, or join one."
        action="Create a group"
        onAction={onAction}
        secondaryAction="Join with a code"
        onSecondaryAction={onSecondaryAction}
      />,
    );

    await act(async () => fireEvent.press(view.getByText('Join with a code')));
    expect(onSecondaryAction).toHaveBeenCalledTimes(1);
    expect(onAction).not.toHaveBeenCalled();
  });

  it('hides the second action unless both its label and handler are given', async () => {
    // A half-configured secondary action would render a button that does
    // nothing, which is worse than not offering it.
    const view = await render(
      <AppEmptyState
        title="No groups"
        description="Nothing here yet."
        action="Create"
        onAction={jest.fn()}
        secondaryAction="Join"
      />,
    );

    expect(view.queryByText('Join')).toBeNull();
  });

  it('renders without any action at all', async () => {
    // Most empty states have nothing the member can do about them, and must
    // still read as a finished screen rather than a broken one.
    const view = await render(
      <AppEmptyState tone="neutral" title="No billers here yet" description="Try another." />,
    );

    expect(view.getByText('No billers here yet')).toBeTruthy();
  });

  it('keeps the decorative icon out of the accessibility tree', async () => {
    // The title and description already say what the state is; announcing the
    // glyph as well would repeat it.
    const view = await render(
      <AppEmptyState title="No groups" description="Nothing here yet." testID="empty" />,
    );

    expect(view.getByTestId('empty')).toBeTruthy();
    expect(view.queryByLabelText('file-tray-outline')).toBeNull();
  });
});
