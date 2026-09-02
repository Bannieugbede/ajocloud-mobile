import { act, fireEvent, render } from '@testing-library/react-native';

import { majorToMinor } from '@/features/akawo/create-pool-screen';
import { buildPoolRecordHtml } from '@/features/akawo/export-pool-record';
import { JoinPoolScreen } from '@/features/akawo/join-pool-screen';
import { MemberPoolScreen } from '@/features/akawo/member-pool-screen';
import { PoolCodeScreen } from '@/features/akawo/pool-code-screen';
import type { MemberPoolView, OrganiserPoolView } from '@/api/endpoints/akawo-pools';

describe('majorToMinor', () => {
  it('converts naira to minor units exactly', () => {
    expect(majorToMinor('5000')).toBe('500000');
    expect(majorToMinor('5000.50')).toBe('500050');
    expect(majorToMinor('0.99')).toBe('99');
    expect(majorToMinor('1,500')).toBe('150000');
  });

  it('refuses amounts that are not payable', () => {
    expect(majorToMinor('')).toBeNull();
    expect(majorToMinor('0')).toBeNull();
    expect(majorToMinor('0.00')).toBeNull();
    expect(majorToMinor('-100')).toBeNull();
    expect(majorToMinor('12.345')).toBeNull();
    expect(majorToMinor('abc')).toBeNull();
  });
});

describe('PoolCodeScreen', () => {
  const props = {
    poolName: 'Class of 2026 dues',
    joinCode: 'ABCD2345',
    amountMinor: '500000',
    currency: 'NGN',
  };

  it('shows the code and warns that it cannot be retrieved', async () => {
    const view = await render(<PoolCodeScreen {...props} onDone={jest.fn()} />);
    expect(view.getByText('ABCD2345')).toBeTruthy();
    expect(view.getByText(/shown only once/i)).toBeTruthy();
  });

  it('reads the code out one character at a time for screen readers', async () => {
    const view = await render(<PoolCodeScreen {...props} onDone={jest.fn()} />);
    // "ABCD2345" read as a word is meaningless; spaced, it is dictatable.
    expect(view.getByLabelText('Join code A B C D 2 3 4 5')).toBeTruthy();
  });
});

describe('JoinPoolScreen', () => {
  const preview = {
    id: 'pool-1',
    name: 'Class of 2026 dues',
    purpose: 'Departmental levy',
    amountMinor: '500000',
    currency: 'NGN',
    referenceLabel: 'Matric number',
    dueAt: null,
    organiserName: 'Ada Okafor',
  };

  it('looks a code up before asking for any personal detail', async () => {
    const onLookup = jest.fn();
    const view = await render(
      <JoinPoolScreen
        preview={null}
        looking={false}
        joining={false}
        onLookup={onLookup}
        onJoin={jest.fn()}
        onClearPreview={jest.fn()}
      />,
    );
    // Nothing about the member is asked for until they can see what they are joining.
    expect(view.queryByText('Your full name')).toBeNull();

    // The lookup button is disabled until a plausible code is entered, so the
    // state change has to flush before the press can land.
    await act(async () => {
      fireEvent.changeText(view.getByLabelText('Join code'), 'ABCD2345');
    });
    fireEvent.press(view.getByRole('button', { name: 'Find pool' }));
    expect(onLookup).toHaveBeenCalledWith('ABCD2345');
  });

  it('asks for the reference the organiser chose, not a generic one', async () => {
    const view = await render(
      <JoinPoolScreen
        preview={preview}
        looking={false}
        joining={false}
        onLookup={jest.fn()}
        onJoin={jest.fn()}
        onClearPreview={jest.fn()}
      />,
    );
    expect(view.getByLabelText('Matric number')).toBeTruthy();
    expect(view.getByText('₦5,000.00')).toBeTruthy();
  });

  it('does not submit an incomplete membership', async () => {
    const onJoin = jest.fn();
    const view = await render(
      <JoinPoolScreen
        preview={preview}
        looking={false}
        joining={false}
        onLookup={jest.fn()}
        onJoin={onJoin}
        onClearPreview={jest.fn()}
      />,
    );
    fireEvent.press(view.getByRole('button', { name: 'Join pool' }));
    expect(onJoin).not.toHaveBeenCalled();
  });
});

describe('MemberPoolScreen', () => {
  const base: MemberPoolView = {
    membership: {
      id: 'member-1',
      fullName: 'Ada Okafor',
      reference: 'CSC/2026/001',
      status: 'ACTIVE',
      joinedAt: '2026-09-01T00:00:00.000Z',
    },
    pool: {
      id: 'pool-1',
      name: 'Class of 2026 dues',
      purpose: null,
      amountMinor: '500000',
      currency: 'NGN',
      status: 'OPEN',
      referenceLabel: 'Matric number',
      dueAt: null,
      closedAt: null,
      createdAt: '2026-09-01T00:00:00.000Z',
    },
    due: { id: 'due-1', amountMinor: '500000', status: 'PENDING', paidAt: null },
    memberCount: 30,
    paidCount: 12,
    collectedMinor: '6000000',
  };

  const render_ = (data: MemberPoolView, onPay = jest.fn()) =>
    render(
      <MemberPoolScreen
        data={data}
        loading={false}
        error={false}
        refreshing={false}
        onRefresh={jest.fn()}
        onRetry={jest.fn()}
        onPay={onPay}
      />,
    );

  it('offers payment while a due is outstanding and the pool is open', async () => {
    const onPay = jest.fn();
    const view = await render_(base, onPay);
    fireEvent.press(view.getByRole('button', { name: 'Pay now' }));
    expect(onPay).toHaveBeenCalledTimes(1);
  });

  it('does not offer payment once the member has paid', async () => {
    const view = await render_({
      ...base,
      due: {
        id: 'due-1',
        amountMinor: '500000',
        status: 'PAID',
        paidAt: '2026-09-02T00:00:00.000Z',
      },
    });
    expect(view.queryByRole('button', { name: 'Pay now' })).toBeNull();
    expect(view.getByText('YOU HAVE PAID')).toBeTruthy();
  });

  it('explains why payment is unavailable on a closed pool rather than hiding it', async () => {
    const view = await render_({ ...base, pool: { ...base.pool, status: 'CLOSED' } });
    expect(view.queryByRole('button', { name: 'Pay now' })).toBeNull();
    expect(view.getByText(/no longer accepting payments/i)).toBeTruthy();
  });
});

describe('buildPoolRecordHtml', () => {
  const pool: OrganiserPoolView = {
    id: 'pool-1',
    name: 'Class of 2026 dues',
    purpose: 'Departmental levy',
    amountMinor: '500000',
    currency: 'NGN',
    status: 'OPEN',
    referenceLabel: 'Matric number',
    dueAt: null,
    closedAt: null,
    createdAt: '2026-09-01T00:00:00.000Z',
    memberCount: 1,
    paidCount: 1,
    collectedMinor: '500000',
    expectedMinor: '500000',
    progressBps: 10_000,
    members: [
      {
        id: 'member-1',
        fullName: 'Ada Okafor',
        reference: 'CSC/2026/001',
        status: 'ACTIVE',
        joinedAt: '2026-09-01T00:00:00.000Z',
        due: {
          id: 'due-1',
          amountMinor: '500000',
          status: 'PAID',
          paidAt: '2026-09-02T00:00:00.000Z',
        },
      },
    ],
  };

  it('renders each member as a row with their reference and status', () => {
    const html = buildPoolRecordHtml(pool);
    expect(html).toContain('Ada Okafor');
    expect(html).toContain('CSC/2026/001');
    expect(html).toContain('Paid');
    expect(html).toContain('₦5,000.00');
  });

  it('escapes member-supplied values so a name cannot inject markup', () => {
    const html = buildPoolRecordHtml({
      ...pool,
      members: [{ ...pool.members[0]!, fullName: '<script>alert(1)</script>' }],
    });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
