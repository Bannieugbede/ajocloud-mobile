import { groupTone, rotationProgressBps } from './group-summary';

describe('groupTone', () => {
  it('marks a running group as active', () => {
    expect(groupTone('ACTIVE')).toBe('active');
  });

  it.each(['OPEN', 'LOCKED'])('marks %s as needing attention', (status) => {
    // Waiting on members is not an error, but it is the state worth noticing.
    expect(groupTone(status)).toBe('attention');
  });

  it.each(['DRAFT', 'COMPLETED', 'SUSPENDED', 'CANCELLED'])('treats %s as neutral', (status) => {
    expect(groupTone(status)).toBe('neutral');
  });

  it('does not let an unknown status inherit the last branch', () => {
    expect(groupTone('SOMETHING_NEW')).toBe('neutral');
  });
});

describe('rotationProgressBps', () => {
  it('is zero when a group has no slots configured', () => {
    expect(rotationProgressBps({ maxSlots: 0, _count: { slots: 3, members: 3 } })).toBe(0);
  });

  it('measures slots rather than members', () => {
    // A member holding several slots fills several places; counting heads would
    // show a full group as half empty.
    expect(rotationProgressBps({ maxSlots: 8, _count: { slots: 8, members: 3 } })).toBe(10_000);
  });

  it('scales to basis points', () => {
    expect(rotationProgressBps({ maxSlots: 12, _count: { slots: 3, members: 3 } })).toBe(2500);
  });

  it('clamps rather than exceeding full', () => {
    expect(rotationProgressBps({ maxSlots: 4, _count: { slots: 9, members: 4 } })).toBe(10_000);
  });
});
