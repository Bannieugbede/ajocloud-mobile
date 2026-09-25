import { attributionFromInstallReferrer } from './install-referrer';

const CODE = 'q7Xv3nRk2LpZ8sWt4YbG1mHc6dJfN0uA9eKiOxPzQrE';

describe('attributionFromInstallReferrer', () => {
  it('reads both values the website attaches', () => {
    expect(
      attributionFromInstallReferrer(`ajocloud_invite=${CODE}&ajocloud_ref=AJO-7KQ3MZ`),
    ).toEqual({
      invitationCode: CODE,
      referralCode: 'AJO-7KQ3MZ',
    });
  });

  it('ignores the utm values Play adds around them', () => {
    expect(
      attributionFromInstallReferrer(
        `utm_source=google-play&ajocloud_ref=AJO-7KQ3MZ&utm_medium=organic`,
      ),
    ).toEqual({ invitationCode: null, referralCode: 'AJO-7KQ3MZ' });
  });

  it('decodes values that arrive still encoded', () => {
    expect(attributionFromInstallReferrer('ajocloud_ref=ajo%2D7kq3mz').referralCode).toBe(
      'AJO-7KQ3MZ',
    );
  });

  it('reports nothing for an organic install', () => {
    expect(attributionFromInstallReferrer('utm_source=google-play&utm_medium=organic')).toEqual({
      invitationCode: null,
      referralCode: null,
    });
  });

  it('drops values that are not well formed, since anyone can craft a Play link', () => {
    expect(attributionFromInstallReferrer('ajocloud_invite=short&ajocloud_ref=AJO-00000O')).toEqual(
      { invitationCode: null, referralCode: null },
    );
  });

  it('survives malformed input', () => {
    expect(attributionFromInstallReferrer('ajocloud_ref=%E0%A4%A')).toEqual({
      invitationCode: null,
      referralCode: null,
    });
    expect(attributionFromInstallReferrer(undefined)).toEqual({
      invitationCode: null,
      referralCode: null,
    });
    expect(attributionFromInstallReferrer('=&&=x')).toEqual({
      invitationCode: null,
      referralCode: null,
    });
  });
});
