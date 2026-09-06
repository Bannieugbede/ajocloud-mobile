import type { AkawoDue, AkawoPoolMember } from '@/api/endpoints/akawo-pools';

import {
  activeMembers,
  dueLabel,
  dueTone,
  paidAmountMinor,
  paidAtLabel,
  tallyMembers,
} from './pool-status';

function member(
  id: string,
  dueStatus: AkawoDue['status'] | null,
  status: AkawoPoolMember['status'] = 'ACTIVE',
): AkawoPoolMember {
  return {
    id,
    fullName: `Member ${id}`,
    reference: `CSC/2026/${id}`,
    status,
    joinedAt: '2026-09-01T00:00:00.000Z',
    due:
      dueStatus === null
        ? null
        : {
            id: `due-${id}`,
            amountMinor: '500000',
            status: dueStatus,
            paidAt: dueStatus === 'PAID' ? '2026-09-10T09:34:00.000Z' : null,
          },
  };
}

describe('tallyMembers', () => {
  it('counts each due status into its own bucket', () => {
    const tally = tallyMembers([
      member('1', 'PAID'),
      member('2', 'PAID'),
      member('3', 'PENDING'),
      member('4', 'PROCESSING'),
      member('5', 'WAIVED'),
    ]);
    expect(tally).toEqual({ paid: 2, pending: 1, processing: 1, waived: 1 });
  });

  it('counts a member with no due recorded as still owing', () => {
    // They joined and nothing has been raised against them yet; showing them as
    // neither paid nor pending would lose them from the organiser's chase list.
    expect(tallyMembers([member('1', null)])).toEqual({
      paid: 0,
      pending: 1,
      processing: 0,
      waived: 0,
    });
  });

  it('leaves removed members out of every count', () => {
    // A removed member is no longer part of the collection, so counting their
    // unpaid due would tell the organiser money is outstanding that is not.
    const tally = tallyMembers([member('1', 'PAID'), member('2', 'PENDING', 'REMOVED')]);
    expect(tally).toEqual({ paid: 1, pending: 0, processing: 0, waived: 0 });
  });

  it('counts nothing for an empty pool', () => {
    expect(tallyMembers([])).toEqual({ paid: 0, pending: 0, processing: 0, waived: 0 });
  });
});

describe('activeMembers', () => {
  it('drops removed members but keeps the rest in order', () => {
    const list = [member('1', 'PAID'), member('2', 'PENDING', 'REMOVED'), member('3', 'PENDING')];
    expect(activeMembers(list).map((entry) => entry.id)).toEqual(['1', '3']);
  });
});

describe('dueLabel and dueTone', () => {
  it('words each status and never leaves one unlabelled', () => {
    expect(dueLabel(member('1', 'PAID').due)).toBe('Paid');
    expect(dueLabel(member('1', 'PROCESSING').due)).toBe('Processing');
    expect(dueLabel(member('1', 'WAIVED').due)).toBe('Waived');
    expect(dueLabel(member('1', 'PENDING').due)).toBe('Pending');
    expect(dueLabel(null)).toBe('Pending');
  });

  it('gives each status a distinct tone so the pills are not all one colour', () => {
    expect(dueTone(member('1', 'PAID').due)).toBe('success');
    expect(dueTone(member('1', 'PENDING').due)).toBe('warning');
    expect(dueTone(member('1', 'PROCESSING').due)).toBe('info');
    expect(dueTone(member('1', 'WAIVED').due)).toBe('neutral');
  });
});

describe('paidAmountMinor', () => {
  it('reports what landed, not what was expected', () => {
    expect(paidAmountMinor(member('1', 'PAID').due)).toBe('500000');
  });

  it('reports nothing for a payment that has not settled', () => {
    // Showing the expected amount against a processing due would read as money
    // already collected when it may still fail.
    expect(paidAmountMinor(member('1', 'PROCESSING').due)).toBe('0');
    expect(paidAmountMinor(member('1', 'PENDING').due)).toBe('0');
    expect(paidAmountMinor(member('1', 'WAIVED').due)).toBe('0');
    expect(paidAmountMinor(null)).toBe('0');
  });
});

describe('paidAtLabel', () => {
  it('reads a settled payment as a date and a time', () => {
    // Month spelling varies by locale ("Sep" vs "Sept"), so this asserts the
    // shape — day, year and clock time joined — rather than one locale's words.
    const label = paidAtLabel(member('1', 'PAID').due, 'en-NG');
    expect(label).toMatch(/^10 \w+ 2026 · \d{1,2}:34/);
  });

  it('has nothing to say about an unsettled due', () => {
    expect(paidAtLabel(member('1', 'PENDING').due)).toBeNull();
    expect(paidAtLabel(null)).toBeNull();
  });

  it('survives an unparseable timestamp rather than rendering "Invalid Date"', () => {
    const due: AkawoDue = { id: 'd', amountMinor: '1', status: 'PAID', paidAt: 'not-a-date' };
    expect(paidAtLabel(due)).toBeNull();
  });
});
