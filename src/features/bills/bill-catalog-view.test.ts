import {
  billCategoryKind,
  billerForNetwork,
  detectNetwork,
  planPeriod,
  planPeriods,
  planSize,
  providerMark,
} from './bill-catalog-view';

describe('bill catalogue presentation', () => {
  it.each([
    ['Airtime', 'airtime'],
    ['Internet', 'internet'],
    ['Electricity', 'electricity'],
    ['Cable TV', 'cable'],
    ['Water', null],
  ])('pays %s on the %s screen', (name, kind) => {
    expect(billCategoryKind(name)).toBe(kind);
  });

  it.each([
    ['08031234567', 'MTN'],
    ['07025123456', 'MTN'],
    ['08021234567', 'AIRTEL'],
    ['08051234567', 'GLO'],
    ['08091234567', '9MOBILE'],
    ['05001234567', null],
  ])('reads %s as %s', (phone, network) => {
    expect(detectNetwork(phone)).toBe(network);
  });

  it('finds the network among airtime or data billers', () => {
    const billers = [
      { providerCode: 'MTN-DATA', id: 'data' },
      { providerCode: 'GLO', id: 'airtime' },
    ] as unknown as Parameters<typeof billerForNetwork>[0];
    expect(billerForNetwork(billers, 'MTN')?.id).toBe('data');
    expect(billerForNetwork(billers, 'GLO')?.id).toBe('airtime');
    expect(billerForNetwork(billers, 'AIRTEL')).toBeNull();
  });

  it.each([
    ['1 day', 'daily'],
    ['2 days', 'daily'],
    ['7 days', 'weekly'],
    ['30 days', 'monthly'],
    ['1 month', 'monthly'],
    [null, 'other'],
  ])('files a %s plan under %s', (validity, period) => {
    expect(planPeriod(validity)).toBe(period);
  });

  it('offers a tab only for lengths that exist, and none for a single length', () => {
    const plan = (validity: string) => ({ validity }) as Parameters<typeof planPeriods>[0][number];
    expect(planPeriods([plan('1 day'), plan('30 days')])).toEqual(['all', 'daily', 'monthly']);
    expect(planPeriods([plan('1 month'), plan('1 month')])).toEqual(['all']);
  });

  it('splits a plan size for display, and leaves other names whole', () => {
    expect(planSize('2.5GB')).toEqual({ value: '2.5', unit: 'GB' });
    expect(planSize('Unlimited Lite')).toBeNull();
  });

  it('marks providers with a short, recognisable label', () => {
    expect(providerMark('MTN Data')).toBe('MTN');
    expect(providerMark('Ikeja Electric (IKEDC)')).toBe('IK');
  });
});
