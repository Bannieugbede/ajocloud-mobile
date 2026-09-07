import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { updatePersonalDetails } from '@/api/endpoints/kyc';
import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { AppSelect } from '@/components/ui/app-select';
import type { AppError } from '@/types/errors';
import { spacing } from '@/theme';
import { GENDER_OPTIONS, NIGERIAN_STATES } from '@/utils/nigerian-states';
import { StepScreen } from './step-screen';

/** Accepts what a user types, then checks it is a real, past, adult date. */
const DATE_PATTERN = /^\d{2}\/\d{2}\/\d{4}$/;
const MINIMUM_AGE_YEARS = 18;

const schema = z.object({
  dateOfBirth: z
    .string()
    .regex(DATE_PATTERN, 'Use DD/MM/YYYY')
    .refine((value) => parseDate(value) !== null, 'That date does not exist')
    .refine((value) => {
      const date = parseDate(value);
      return date !== null && isOldEnough(date);
    }, `You must be at least ${MINIMUM_AGE_YEARS} years old`),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'], {
    error: 'Select your gender',
  }),
  addressLine: z.string().trim().min(3, 'Enter your residential address').max(200),
  city: z.string().trim().min(2, 'Enter your city').max(100),
  state: z.string().min(1, 'Select your state'),
  occupation: z.string().trim().min(2, 'Enter your occupation').max(120),
});

type FormValues = z.infer<typeof schema>;

/**
 * Step g. Ordinary profile data, so unlike the identity step there is nothing
 * here that must be kept out of state or storage.
 */
export function PersonalDetailsStep({ onSaved }: { onSaved: () => void }) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      dateOfBirth: '',
      gender: '' as FormValues['gender'],
      addressLine: '',
      city: '',
      state: '',
      occupation: '',
    },
  });

  const mutation = useMutation({
    mutationFn: updatePersonalDetails,
    onSuccess: () => onSaved(),
  });

  const submit = form.handleSubmit((values) => {
    const date = parseDate(values.dateOfBirth);
    if (!date) return;
    mutation.mutate({
      dateOfBirth: date.toISOString().slice(0, 10),
      gender: values.gender,
      addressLine: values.addressLine.trim(),
      city: values.city.trim(),
      state: values.state,
      occupation: values.occupation.trim(),
    });
  });

  return (
    <StepScreen
      step="personal-details"
      title="Your details"
      description="These must match the details held against your BVN or NIN."
      error={(mutation.error as AppError | null)?.message}
    >
      <View style={styles.form}>
        <Controller
          control={form.control}
          name="dateOfBirth"
          render={({ field, fieldState }) => (
            <AppInput
              label="Date of birth"
              placeholder="DD/MM/YYYY"
              value={field.value}
              onBlur={field.onBlur}
              onChangeText={(text) => field.onChange(formatDateInput(text))}
              error={fieldState.error?.message}
              keyboardType="number-pad"
              maxLength={10}
              editable={!mutation.isPending}
            />
          )}
        />
        <Controller
          control={form.control}
          name="gender"
          render={({ field, fieldState }) => (
            <AppSelect
              label="Gender"
              value={field.value || null}
              options={GENDER_OPTIONS}
              onChange={field.onChange}
              error={fieldState.error?.message}
              disabled={mutation.isPending}
              testID="gender-select"
            />
          )}
        />
        <Controller
          control={form.control}
          name="addressLine"
          render={({ field, fieldState }) => (
            <AppInput
              label="Residential address"
              value={field.value}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
              autoComplete="street-address"
              editable={!mutation.isPending}
            />
          )}
        />
        <Controller
          control={form.control}
          name="city"
          render={({ field, fieldState }) => (
            <AppInput
              label="City"
              value={field.value}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
              autoCapitalize="words"
              editable={!mutation.isPending}
            />
          )}
        />
        <Controller
          control={form.control}
          name="state"
          render={({ field, fieldState }) => (
            <AppSelect
              label="State"
              value={field.value || null}
              options={NIGERIAN_STATES}
              onChange={field.onChange}
              error={fieldState.error?.message}
              searchable
              disabled={mutation.isPending}
              testID="state-select"
            />
          )}
        />
        <Controller
          control={form.control}
          name="occupation"
          render={({ field, fieldState }) => (
            <AppInput
              label="Occupation"
              value={field.value}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
              autoCapitalize="words"
              editable={!mutation.isPending}
            />
          )}
        />
        <AppButton
          label="Continue"
          onPress={submit}
          loading={mutation.isPending}
          disabled={mutation.isPending}
        />
      </View>
    </StepScreen>
  );
}

/** Inserts the slashes as the user types, so they only enter digits. */
function formatDateInput(text: string): string {
  const digits = text.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/**
 * Parses DD/MM/YYYY and rejects dates that do not exist, such as 31/02/2000,
 * which `new Date` would silently roll into March.
 */
function parseDate(value: string): Date | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCDate() !== day ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCFullYear() !== year
  ) {
    return null;
  }
  return date;
}

function isOldEnough(dateOfBirth: Date): boolean {
  const eligibleFrom = new Date(dateOfBirth);
  eligibleFrom.setUTCFullYear(eligibleFrom.getUTCFullYear() + MINIMUM_AGE_YEARS);
  return eligibleFrom.getTime() <= Date.now();
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
});
