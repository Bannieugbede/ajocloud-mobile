import { act, fireEvent, render } from '@testing-library/react-native';

import type { MemberPoolView, OrganiserPoolView } from '@/api/endpoints/akawo-pools';
import { MemberPoolScreen } from '@/features/akawo/member-pool-screen';
import { OrganiserPoolScreen } from '@/features/akawo/organiser-pool-screen';

const memberView: MemberPoolView = {
  membership: {
    id: 'member-1',
    fullName: 'Chisom Okafor',
    reference: 'CSC/2021/043',
    status: 'ACTIVE',
    joinedAt: '2026-09-01T00:00:00.000Z',
  },
  pool: {
    id: 'pool-1',
    name: '2024/2025 Departmental Dues',
    purpose: 'Annual departmental association dues for all 300L students.',
    amountMinor: '500000',
    currency: 'NGN',
    status: 'OPEN',
    referenceLabel: 'Matric number',
    dueAt: '2026-08-30T23:59:59.999Z',
    closedAt: null,
    createdAt: '2026-07-01T00:00:00.000Z',
    organiserName: 'Emeka Johnson',
  },
  due: { id: 'due-1', amountMinor: '500000', status: 'PAID', paidAt: '2026-07-10T09:34:00.000Z' },
  memberCount: 8,
  paidCount: 4,
  collectedMinor: '2250000',
};

function renderMember(data: MemberPoolView = memberView, onPay = jest.fn()) {
  return render(
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
}

describe('MemberPoolScreen', () => {
  it('leads with what the pool has collected against its target', async () => {
    const view = await renderMember();
    expect(view.getByText('TOTAL COLLECTED')).toBeTruthy();
    expect(view.getByLabelText('₦22,500.00')).toBeTruthy();
    // 8 members × ₦5,000 = ₦40,000, derived because the member endpoint does
    // not return a target of its own.
    expect(view.getByText(/Target: ₦40,000\.00/)).toBeTruthy();
  });

  it('confirms a settled payment with the date it landed', async () => {
    const view = await renderMember();
    expect(view.getByText('Your payment is complete')).toBeTruthy();
    expect(view.getByText(/^Paid .*10.*2026 · /)).toBeTruthy();
  });

  it('switches to the members panel without losing the pool', async () => {
    const view = await renderMember();
    expect(view.getByLabelText('Organiser: Emeka Johnson')).toBeTruthy();

    await act(async () => fireEvent.press(view.getByRole('tab', { name: 'Members (8)' })));
    expect(view.getByText('Who has paid')).toBeTruthy();
    expect(view.queryByLabelText('Organiser: Emeka Johnson')).toBeNull();
  });

  it('never lists another member as having paid a specific amount', async () => {
    // The member endpoint returns a tally, not other people's payment records.
    // Rendering per-person amounts here would mean inventing them.
    const view = await renderMember();
    await act(async () => fireEvent.press(view.getByRole('tab', { name: 'Members (8)' })));
    expect(view.queryByText('Ngozi Eze')).toBeNull();
    expect(view.getByLabelText('Paid: 4 members')).toBeTruthy();
  });

  it('offers payment only while the due is outstanding', async () => {
    const view = await renderMember({
      ...memberView,
      due: { id: 'due-1', amountMinor: '500000', status: 'PENDING', paidAt: null },
    });
    expect(view.getByRole('button', { name: 'Pay ₦5,000.00' })).toBeTruthy();
    expect(view.queryByText('Your payment is complete')).toBeNull();
  });
});

const organiserView: OrganiserPoolView = {
  id: 'pool-1',
  name: '2024/2025 Departmental Dues',
  purpose: 'Annual departmental association dues.',
  amountMinor: '500000',
  currency: 'NGN',
  status: 'OPEN',
  referenceLabel: 'Matric number',
  dueAt: '2026-08-30T23:59:59.999Z',
  closedAt: null,
  createdAt: '2026-07-01T00:00:00.000Z',
  memberCount: 8,
  paidCount: 4,
  collectedMinor: '2250000',
  expectedMinor: '4000000',
  progressBps: 5625,
  members: [
    {
      id: 'm1',
      fullName: 'Chisom Okafor',
      reference: 'CSC/2021/043',
      status: 'ACTIVE',
      joinedAt: '2026-07-01T00:00:00.000Z',
      due: {
        id: 'd1',
        amountMinor: '500000',
        status: 'PAID',
        paidAt: '2026-07-10T09:34:00.000Z',
      },
    },
    {
      id: 'm2',
      fullName: 'Tunde Adeyemi',
      reference: 'CSC/2021/029',
      status: 'ACTIVE',
      joinedAt: '2026-07-02T00:00:00.000Z',
      due: { id: 'd2', amountMinor: '500000', status: 'PENDING', paidAt: null },
    },
    {
      id: 'm3',
      fullName: 'Ngozi Eze',
      reference: 'CSC/2021/017',
      status: 'ACTIVE',
      joinedAt: '2026-07-03T00:00:00.000Z',
      due: { id: 'd3', amountMinor: '500000', status: 'PROCESSING', paidAt: null },
    },
  ],
};

function renderOrganiser(
  data: OrganiserPoolView = organiserView,
  overrides: Partial<Parameters<typeof OrganiserPoolScreen>[0]> = {},
) {
  return render(
    <OrganiserPoolScreen
      data={data}
      loading={false}
      error={false}
      refreshing={false}
      busy={false}
      onRefresh={jest.fn()}
      onRetry={jest.fn()}
      onOpen={jest.fn()}
      onClose={jest.fn()}
      onCancel={jest.fn()}
      onShareCode={jest.fn()}
      onExport={jest.fn()}
      onWaive={jest.fn()}
      onRemove={jest.fn()}
      {...overrides}
    />,
  );
}

describe('OrganiserPoolScreen', () => {
  it('opens on the overview with the pool details', async () => {
    const view = await renderOrganiser();
    expect(view.getByText('TOTAL COLLECTED')).toBeTruthy();
    expect(view.getByLabelText('Amount per member: ₦5,000.00')).toBeTruthy();
    expect(view.getByLabelText(/^Due date: .*30.*2026$/)).toBeTruthy();
  });

  it('tallies the members panel by what each due is actually doing', async () => {
    const view = await renderOrganiser();
    await act(async () => fireEvent.press(view.getByRole('tab', { name: 'Members (3)' })));
    expect(view.getByLabelText('1 Paid')).toBeTruthy();
    expect(view.getByLabelText('1 Pending')).toBeTruthy();
    expect(view.getByLabelText('1 Processing')).toBeTruthy();
  });

  it('shows a member as owing nothing until their payment settles', async () => {
    // Ngozi's payment is in flight. Showing ₦5,000 against her would read as
    // money collected, and the hero total would not agree with the list.
    const view = await renderOrganiser();
    await act(async () => fireEvent.press(view.getByRole('tab', { name: 'Members (3)' })));
    expect(view.getByLabelText('Ngozi Eze, CSC/2021/017, ₦0.00, Processing')).toBeTruthy();
    expect(
      view.getByLabelText(/^Chisom Okafor, CSC\/2021\/043, ₦5,000\.00, Paid, paid .*10.*2026/),
    ).toBeTruthy();
  });

  it('exports the record from the members panel', async () => {
    const onExport = jest.fn();
    const view = await renderOrganiser(organiserView, { onExport });
    await act(async () => fireEvent.press(view.getByRole('tab', { name: 'Members (3)' })));
    await act(async () =>
      fireEvent.press(view.getByRole('button', { name: 'Download PDF Report' })),
    );
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it('leaves a removed member out of the count and the list', async () => {
    const view = await renderOrganiser({
      ...organiserView,
      members: [
        organiserView.members[0]!,
        { ...organiserView.members[1]!, status: 'REMOVED' as const },
      ],
    });
    await act(async () => fireEvent.press(view.getByRole('tab', { name: 'Members (1)' })));
    expect(view.queryByText('Tunde Adeyemi')).toBeNull();
    expect(view.getByLabelText('0 Pending')).toBeTruthy();
  });
});
