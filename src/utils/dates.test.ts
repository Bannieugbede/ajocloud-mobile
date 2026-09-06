import { dateAndTime, longDate, shortDate } from './dates';

describe('longDate', () => {
  it('reads an end-of-day deadline as the day it was set', () => {
    // Deadlines are stored as the last instant of a day in UTC. In local time
    // east of Greenwich that instant belongs to the next date, which would show
    // every member a deadline a day later than the real one.
    expect(longDate('2026-08-30T23:59:59.999Z', 'en-GB')).toBe('30 Aug 2026');
  });

  it('words a missing or malformed date rather than rendering "Invalid Date"', () => {
    expect(longDate(null)).toBe('No date');
    expect(longDate(undefined)).toBe('No date');
    expect(longDate('')).toBe('No date');
    expect(longDate('not-a-date')).toBe('No date');
  });
});

describe('shortDate', () => {
  it('drops the year for a card', () => {
    expect(shortDate('2026-08-30T23:59:59.999Z', 'en-GB')).toBe('30 Aug');
  });

  it('does not roll onto the next day either', () => {
    expect(shortDate('2026-08-30T23:59:59.999Z', 'en-GB')).toMatch(/^30 /);
  });
});

describe('dateAndTime', () => {
  it('reads a moment as a day and a clock time', () => {
    expect(dateAndTime('2026-07-10T09:34:00.000Z', 'en-GB')).toMatch(/^10 Jul 2026 · 0?9:34/);
  });

  it('has nothing to say about a missing moment', () => {
    expect(dateAndTime(null)).toBeNull();
    expect(dateAndTime('not-a-date')).toBeNull();
  });
});
