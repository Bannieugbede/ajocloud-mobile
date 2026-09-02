import type { CurrentUser } from '@/api/endpoints/users';
import { mergeProfile } from './merge-profile';

const user: CurrentUser = {
  id: 'u1',
  email: 'ada@example.test',
  phone: '+2348010000001',
  status: 'ACTIVE',
  profile: {
    firstName: 'Ada',
    lastName: 'Admin',
    avatarUrl: null,
    timezone: 'Africa/Lagos',
    locale: 'en-NG',
  },
};

describe('mergeProfile', () => {
  it('keeps the fields the PATCH response does not return', () => {
    // The endpoint returns only the profile; replacing the cached user with it
    // would blank the email and status everywhere they are shown.
    const merged = mergeProfile(user, { ...user.profile, firstName: 'Adaeze' });
    expect(merged?.email).toBe('ada@example.test');
    expect(merged?.status).toBe('ACTIVE');
    expect(merged?.profile.firstName).toBe('Adaeze');
  });

  it('does nothing when there is no cached user to merge into', () => {
    expect(mergeProfile(undefined, user.profile)).toBeUndefined();
  });
});
