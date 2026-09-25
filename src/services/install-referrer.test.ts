import { attributionFromInstallReferrer } from './install-referrer';

const CODE = 'q7Xv3nRk2LpZ8sWt4YbG1mHc6dJfN0uA9eKiOxPzQrE';
const NONE = { invitationCode: null, poolCode: null, programmeId: null, referralCode: null };

describe('attributionFromInstallReferrer', () => {
  it('reads both values the website attaches', () => {
    expect(
      attributionFromInstallReferrer(`ajocloud_invite=${CODE}&ajocloud_ref=AJO-7KQ3MZ`),
    ).toEqual({ ...NONE, invitationCode: CODE, referralCode: 'AJO-7KQ3MZ' });
  });

  it('ignores the utm values Play adds around them', () => {
    expect(
      attributionFromInstallReferrer(
        `utm_source=google-play&ajocloud_ref=AJO-7KQ3MZ&utm_medium=organic`,
      ),
    ).toEqual({ ...NONE, referralCode: 'AJO-7KQ3MZ' });
  });

  it('decodes values that arrive still encoded', () => {
    expect(attributionFromInstallReferrer('ajocloud_ref=ajo%2D7kq3mz').referralCode).toBe(
      'AJO-7KQ3MZ',
    );
  });

  it('reports nothing for an organic install', () => {
    expect(attributionFromInstallReferrer('utm_source=google-play&utm_medium=organic')).toEqual(
      NONE,
    );
  });

  it('drops values that are not well formed, since anyone can craft a Play link', () => {
    expect(attributionFromInstallReferrer('ajocloud_invite=short&ajocloud_ref=AJO-00000O')).toEqual(
      NONE,
    );
  });

  it('survives malformed input', () => {
    expect(attributionFromInstallReferrer('ajocloud_ref=%E0%A4%A')).toEqual(NONE);
    expect(attributionFromInstallReferrer(undefined)).toEqual(NONE);
    expect(attributionFromInstallReferrer('=&&=x')).toEqual(NONE);
  });

  it("reads an Akawo pool code in the backend's canonical form", () => {
    expect(attributionFromInstallReferrer('ajocloud_pool=abcd-efgh').poolCode).toBe('ABCDEFGH');
  });

  it('reads a Food Ajo programme id', () => {
    expect(
      attributionFromInstallReferrer('ajocloud_food=11111111-2222-4333-8444-555555555555')
        .programmeId,
    ).toBe('11111111-2222-4333-8444-555555555555');
  });

  it('drops a pool code or programme id that is not well formed', () => {
    expect(attributionFromInstallReferrer('ajocloud_pool=ABC0EFGH&ajocloud_food=../x')).toEqual(
      NONE,
    );
  });
});
