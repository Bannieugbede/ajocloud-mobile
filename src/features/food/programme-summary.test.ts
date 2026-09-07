import {
  acceptsNewMembers,
  coordinatorInvitation,
  enrolmentProgressBps,
  fulfilmentLabel,
  isEnrolled,
  joinBlockedReason,
  placesLeft,
  priceLabel,
} from './programme-summary';

describe('placesLeft', () => {
  it('counts what is still open', () => {
    expect(placesLeft({ enrolmentCapacity: 30, _count: { subscriptions: 28 } })).toBe(2);
  });

  it('is zero when full', () => {
    expect(placesLeft({ enrolmentCapacity: 30, _count: { subscriptions: 30 } })).toBe(0);
  });

  it('never goes negative when oversubscribed', () => {
    // Portions consume places, so a programme can be past its capacity. It is
    // full, not "-3 places left".
    expect(placesLeft({ enrolmentCapacity: 30, _count: { subscriptions: 33 } })).toBe(0);
  });
});

describe('enrolmentProgressBps', () => {
  it('is zero for an unset capacity rather than dividing by it', () => {
    expect(enrolmentProgressBps({ enrolmentCapacity: 0, _count: { subscriptions: 5 } })).toBe(0);
  });

  it('scales to basis points', () => {
    expect(enrolmentProgressBps({ enrolmentCapacity: 30, _count: { subscriptions: 15 } })).toBe(
      5000,
    );
  });

  it('clamps past full', () => {
    expect(enrolmentProgressBps({ enrolmentCapacity: 30, _count: { subscriptions: 60 } })).toBe(
      10_000,
    );
  });
});

describe('fulfilmentLabel', () => {
  it.each([
    ['PICKUP', 'Pickup'],
    ['DELIVERY', 'Delivery'],
    ['DELIVERY_OR_PICKUP', 'Delivery or pickup'],
  ])('%s reads as %s', (method, expected) => {
    expect(fulfilmentLabel(method)).toBe(expected);
  });

  it('degrades readably for an unknown method', () => {
    expect(fulfilmentLabel('SOME_NEW_METHOD')).toBe('some new method');
  });
});

describe('coordinatorInvitation', () => {
  const application = (status: string, createdAt = '2026-08-01T00:00:00Z') => ({
    id: `a-${status}`,
    status,
    createdAt,
    submittedAt: null,
  });

  it('invites someone who has never applied', () => {
    const invitation = coordinatorInvitation(undefined);
    expect(invitation.canApply).toBe(true);
    expect(invitation.title).toBe('Become a coordinator');
  });

  it('does not invite again while an application is in review', () => {
    // Inviting someone who already applied reads as though their application
    // was lost.
    const invitation = coordinatorInvitation([application('SUBMITTED')]);
    expect(invitation.canApply).toBe(false);
    expect(invitation.title).toMatch(/in review/i);
  });

  it('reports approval rather than inviting an approved coordinator', () => {
    const invitation = coordinatorInvitation([application('APPROVED')]);
    expect(invitation.canApply).toBe(false);
    expect(invitation.title).toBe('You are a coordinator');
  });

  it('lets a rejected applicant try again', () => {
    const invitation = coordinatorInvitation([application('REJECTED')]);
    expect(invitation.canApply).toBe(true);
  });

  it('prompts an unfinished draft to be completed', () => {
    const invitation = coordinatorInvitation([application('DRAFT')]);
    expect(invitation.canApply).toBe(true);
    expect(invitation.title).toMatch(/finish/i);
  });

  it('judges by the most recent application, not the first', () => {
    // Someone rejected once and reapplying is in review, not rejected.
    const invitation = coordinatorInvitation([
      application('REJECTED', '2026-01-01T00:00:00Z'),
      application('SUBMITTED', '2026-08-01T00:00:00Z'),
    ]);
    expect(invitation.canApply).toBe(false);
    expect(invitation.title).toMatch(/in review/i);
  });
});

describe('isEnrolled', () => {
  const at = (status: string) => ({ status }) as never;

  it('counts a pending or active enrolment as joined', () => {
    // A pending enrolment is a place taken: the member is in, even before the
    // coordinator confirms.
    expect(isEnrolled(at('PENDING'))).toBe(true);
    expect(isEnrolled(at('ACTIVE'))).toBe(true);
  });

  it('lets someone rejoin after cancelling', () => {
    expect(isEnrolled(at('CANCELLED'))).toBe(false);
    expect(isEnrolled(null)).toBe(false);
    expect(isEnrolled(undefined)).toBe(false);
  });
});

describe('acceptsNewMembers and joinBlockedReason', () => {
  const programme = (status: string, capacity: number, taken: number) =>
    ({ status, enrolmentCapacity: capacity, _count: { subscriptions: taken } }) as never;

  it('takes members while a programme is open and has room', () => {
    expect(acceptsNewMembers(programme('OPEN', 30, 28))).toBe(true);
    expect(joinBlockedReason(programme('OPEN', 30, 28))).toBeNull();
  });

  it('closes once every spot is taken', () => {
    expect(acceptsNewMembers(programme('OPEN', 30, 30))).toBe(false);
    expect(joinBlockedReason(programme('OPEN', 30, 30))).toMatch(/taken/);
  });

  it('explains that buying has already started rather than saying only "closed"', () => {
    // ACTIVE means the coordinator has begun buying, so a late joiner would not
    // be in what was ordered — worth saying, since the programme looks live.
    expect(acceptsNewMembers(programme('ACTIVE', 30, 10))).toBe(false);
    expect(joinBlockedReason(programme('ACTIVE', 30, 10))).toMatch(/Buying has already started/);
  });

  it('reports fullness before status, since that is the more useful reason', () => {
    expect(joinBlockedReason(programme('ACTIVE', 30, 30))).toMatch(/taken/);
  });

  it('always has a reason whenever it refuses', () => {
    for (const status of ['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED']) {
      const entry = programme(status, 30, 1);
      expect(acceptsNewMembers(entry)).toBe(false);
      expect(joinBlockedReason(entry)).toBeTruthy();
    }
  });
});

describe('priceLabel', () => {
  it('says the amount and how often it is paid', () => {
    const label = priceLabel(
      { contributionMinor: '3500000', currency: 'NGN', contributionFrequency: 'MONTHLY' },
      (minor, currency) => `${currency} ${minor}`,
    );
    expect(label).toBe('NGN 3500000 / Monthly');
  });
});
