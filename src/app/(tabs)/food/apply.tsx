import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

import {
  createCoordinatorApplication,
  listMyCoordinatorApplications,
  submitCoordinatorApplication,
  updateCoordinatorApplication,
} from '@/api/endpoints/food-ajo';
import { listBanks } from '@/api/endpoints/kyc';
import {
  resumableApplicationId,
  toApplicationRequest,
} from '@/features/food/coordinator-application-form';
import { CoordinatorApplicationScreen } from '@/features/food/coordinator-application-screen';
import type { AppError } from '@/types/errors';

export default function CoordinatorApplicationRoute() {
  const queryClient = useQueryClient();
  const banks = useQuery({ queryKey: ['kyc', 'banks'], queryFn: listBanks });
  // Read rather than assume: a previous attempt that created a draft and then
  // failed to submit leaves one behind, and the backend refuses a second.
  const applications = useQuery({
    queryKey: ['food-coordinator-applications'],
    queryFn: listMyCoordinatorApplications,
    retry: 1,
  });

  const apply = useMutation({
    mutationFn: async (values: Parameters<typeof toApplicationRequest>[0]) => {
      const body = toApplicationRequest(values);
      // Null means a step regressed after the button was enabled. Creating a
      // partial application would leave one in review missing what a reviewer
      // needs to assess it.
      if (!body) throw new Error('The application is not complete yet.');

      // Submitting is a second call, so a failure there — a dropped connection,
      // a refused request — leaves the draft from the first behind. Creating
      // again would be refused with "an active application already exists",
      // which strands the applicant on an error they cannot clear. Rewriting
      // the draft they already have is the same intent, and it succeeds.
      const draftId = resumableApplicationId(applications.data);
      const application = draftId
        ? await updateCoordinatorApplication(draftId, body)
        : await createCoordinatorApplication(body);
      // Two calls because the backend keeps them separate: POST leaves a draft,
      // and only a submit starts the clock on a decision. A draft left behind
      // by a failed submit is recoverable; a silent non-submission is not.
      return submitCoordinatorApplication(application.id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['food-coordinator-applications'] });
      // replace: the form has been submitted, so backing into it would only
      // offer to apply a second time, which the backend refuses anyway.
      router.replace('/(tabs)/food');
    },
  });

  return (
    <CoordinatorApplicationScreen
      banks={banks.data?.banks}
      banksLoading={banks.isPending}
      submitting={apply.isPending}
      error={apply.error as AppError | null}
      onSubmit={(values) => apply.mutate(values)}
    />
  );
}
