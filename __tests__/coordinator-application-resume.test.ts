import { resumableApplicationId } from '@/features/food/coordinator-application-form';

/**
 * Applying is two calls, so a submit that fails leaves a draft behind and the
 * backend refuses to create a second one. These pin the recovery.
 */
describe('resumableApplicationId', () => {
  it('reuses the draft a failed submit left behind', () => {
    // Without this the retry is refused with "an active coordinator
    // application already exists", and the applicant can never get through.
    expect(resumableApplicationId([{ id: 'app-1', status: 'DRAFT' }])).toBe('app-1');
  });

  it('reuses one sent back for more information', () => {
    expect(resumableApplicationId([{ id: 'app-2', status: 'MORE_INFORMATION_REQUIRED' }])).toBe(
      'app-2',
    );
  });

  it('creates afresh when there is nothing to resume', () => {
    expect(resumableApplicationId([])).toBeNull();
    expect(resumableApplicationId(undefined)).toBeNull();
  });

  it('never rewrites an application already under review', () => {
    // The backend refuses a PATCH in these states, and changing an application
    // while someone is assessing it is not what a retry should mean.
    for (const status of ['AUTOMATED_REVIEW', 'MANUAL_REVIEW', 'APPROVED', 'SUSPENDED']) {
      expect(resumableApplicationId([{ id: 'app-3', status }])).toBeNull();
    }
  });

  it('resumes a rejected applicant by creating a new application', () => {
    // The backend allows a fresh application after a rejection, and the old one
    // is not editable, so it must not be reused.
    expect(resumableApplicationId([{ id: 'app-4', status: 'REJECTED' }])).toBeNull();
  });
});
