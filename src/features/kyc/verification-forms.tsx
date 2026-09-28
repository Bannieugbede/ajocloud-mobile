import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type {
  AddressRequest,
  BasicInfoRequest,
  IdentityDocumentRequest,
} from '@/api/endpoints/kyc';
import { AppButton } from '@/components/ui/app-button';
import { AppCheckbox } from '@/components/ui/app-checkbox';
import { AppInput } from '@/components/ui/app-input';
import { AppKeyboardScrollView } from '@/components/ui/app-keyboard';
import { AppSegmented } from '@/components/ui/app-segmented';
import { AppSelect } from '@/components/ui/app-select';
import { AppText } from '@/components/ui/app-text';
import {
  formatDateInput,
  isOldEnough,
  parseDate,
} from '@/features/registration/personal-details-step';
import { useErrorToast } from '@/hooks/use-toast-on-change';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';
import type { AppError } from '@/types/errors';
import { GENDER_OPTIONS, NIGERIAN_STATES } from '@/utils/nigerian-states';

type FormProps<T> = {
  submitting: boolean;
  error?: AppError | null;
  onSubmit: (values: T) => void;
};

function Intro({ children }: { children: string }) {
  const { colors } = useTheme();
  return <AppText style={{ color: colors.textMuted }}>{children}</AppText>;
}

function Notice({ children }: { children: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.notice, { backgroundColor: colors.primarySoft }]}>
      <AppText style={[styles.noticeText, { color: colors.primary }]}>{children}</AppText>
    </View>
  );
}

function Footer({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}
    >
      {children}
    </View>
  );
}

/** Stage 1: the details that finish sign-up. */
export function BasicInfoForm({ submitting, error, onSubmit }: FormProps<BasicInfoRequest>) {
  const { colors } = useTheme();
  useErrorToast(error?.message);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<string | null>(null);
  const [occupation, setOccupation] = useState('');
  const [touched, setTouched] = useState(false);

  const date = parseDate(dateOfBirth);
  const problems = {
    dateOfBirth: !date
      ? 'Enter your date of birth as DD/MM/YYYY'
      : !isOldEnough(date)
        ? 'You must be at least 18 years old'
        : null,
    gender: gender ? null : 'Select your gender',
    occupation: occupation.trim().length >= 2 ? null : 'Enter your occupation',
  };
  const show = (message: string | null) => (touched && message ? message : undefined);

  return (
    <AppKeyboardScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      footer={
        <Footer>
          <AppButton
            label="Save and continue"
            loading={submitting}
            disabled={submitting}
            testID="basic-info-submit"
            onPress={() => {
              setTouched(true);
              if (!date || Object.values(problems).some(Boolean) || !gender) return;
              onSubmit({
                dateOfBirth: date.toISOString().slice(0, 10),
                gender: gender as BasicInfoRequest['gender'],
                occupation: occupation.trim(),
              });
            }}
          />
        </Footer>
      }
    >
      <Intro>These must match the details on your NIN, which you verify in stage 2.</Intro>
      <AppInput
        label="Date of birth"
        placeholder="DD/MM/YYYY"
        value={dateOfBirth}
        onChangeText={(text) => setDateOfBirth(formatDateInput(text))}
        keyboardType="number-pad"
        maxLength={10}
        error={show(problems.dateOfBirth)}
        testID="basic-info-dob"
      />
      <AppSelect
        label="Gender"
        value={gender}
        options={GENDER_OPTIONS}
        onChange={setGender}
        error={show(problems.gender)}
        testID="basic-info-gender"
      />
      <AppInput
        label="Occupation"
        value={occupation}
        onChangeText={setOccupation}
        autoCapitalize="words"
        error={show(problems.occupation)}
        testID="basic-info-occupation"
      />
    </AppKeyboardScrollView>
  );
}

/**
 * Stage 2: the NIN. The number lives in component state for one submission
 * and is cleared by the route as soon as the request settles; it is never
 * stored, logged, or put in a route param (ADR-004).
 */
export function NinForm({ submitting, error, onSubmit }: FormProps<{ identityNumber: string }>) {
  const { colors } = useTheme();
  useErrorToast(error?.message);
  const [identityNumber, setIdentityNumber] = useState('');
  const [consent, setConsent] = useState(false);
  const [problem, setProblem] = useState<string | undefined>();

  return (
    <AppKeyboardScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      footer={
        <Footer>
          <AppButton
            label="Verify NIN"
            loading={submitting}
            disabled={submitting}
            testID="nin-submit"
            onPress={() => {
              if (identityNumber.length !== 11) return setProblem('Your NIN is 11 digits');
              if (!consent) return setProblem('Tick the box to let us verify your NIN');
              setProblem(undefined);
              onSubmit({ identityNumber });
              setIdentityNumber('');
            }}
          />
        </Footer>
      }
    >
      <Intro>
        We check your NIN with the identity authority through Monnify and keep only the last 4
        digits.
      </Intro>
      <AppInput
        label="NIN"
        value={identityNumber}
        onChangeText={(text) => setIdentityNumber(text.replace(/\D/g, '').slice(0, 11))}
        keyboardType="number-pad"
        maxLength={11}
        autoComplete="off"
        autoCorrect={false}
        textContentType="none"
        error={problem}
        testID="nin-input"
      />
      <AppText style={[styles.hint, { color: colors.textMuted }]}>
        Dial *346# on your registered line, or check your NIN slip.
      </AppText>
      <AppCheckbox
        label="I allow Ajo Cloud to verify my NIN with the identity authority"
        checked={consent}
        onChange={setConsent}
        disabled={submitting}
      />
    </AppKeyboardScrollView>
  );
}

type PickedPhoto = { uri: string; base64: string; contentType: 'image/jpeg' | 'image/png' };

const DOCUMENT_TYPES = [
  { value: 'NIN_SLIP', label: 'NIN slip' },
  { value: 'NIN_CARD', label: 'NIN card' },
] as const;

/**
 * Stage 2: a photo of the NIN slip or card. Chosen from the photo library,
 * which needs no permission prompt; the photo stays in memory only until it is
 * sent.
 */
export function DocumentForm({ submitting, error, onSubmit }: FormProps<IdentityDocumentRequest>) {
  const { colors } = useTheme();
  useErrorToast(error?.message);
  const [type, setType] = useState<IdentityDocumentRequest['type']>('NIN_SLIP');
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      // Keeps a phone photo under the 1.5 MB the server accepts.
      quality: 0.4,
      base64: true,
      exif: false,
    });
    const asset = result.canceled ? null : result.assets[0];
    if (!asset?.base64) return;
    setProblem(null);
    setPhoto({
      uri: asset.uri,
      base64: asset.base64,
      contentType: asset.mimeType === 'image/png' ? 'image/png' : 'image/jpeg',
    });
  };

  return (
    <AppKeyboardScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      footer={
        <Footer>
          <AppButton
            label="Upload document"
            loading={submitting}
            disabled={submitting}
            testID="document-submit"
            onPress={() => {
              if (!photo) return setProblem('Choose a photo of your NIN slip or card');
              onSubmit({ type, contentType: photo.contentType, data: photo.base64 });
            }}
          />
        </Footer>
      }
    >
      <Intro>
        Upload a clear photo of the NIN slip or card you verified. A reviewer may check it, and it
        is stored encrypted.
      </Intro>
      <AppSegmented
        options={DOCUMENT_TYPES}
        value={type}
        onChange={(value) => setType(value)}
        label="Document type"
      />
      <View
        style={[styles.photo, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
      >
        {photo ? (
          <Image
            source={{ uri: photo.uri }}
            style={styles.preview}
            contentFit="contain"
            accessibilityLabel="The photo you chose"
          />
        ) : (
          <Ionicons name="id-card-outline" size={48} color={colors.textMuted} />
        )}
      </View>
      {problem ? (
        <AppText accessibilityLiveRegion="polite" style={{ color: colors.error }}>
          {problem}
        </AppText>
      ) : null}
      <AppButton
        label={photo ? 'Choose another photo' : 'Choose photo'}
        variant="outline"
        icon="images-outline"
        onPress={() => void pick()}
        disabled={submitting}
        testID="document-pick"
      />
      <Notice>All four corners in view, no glare, and every word readable.</Notice>
    </AppKeyboardScrollView>
  );
}

/** Stage 3: the address, which must match the one on the NIN record. */
export function AddressForm({ submitting, error, onSubmit }: FormProps<AddressRequest>) {
  const { colors } = useTheme();
  useErrorToast(error?.message);
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [lga, setLga] = useState('');
  const [state, setState] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const problems = {
    addressLine: addressLine.trim().length >= 3 ? null : 'Enter your house number and street',
    city: city.trim().length >= 2 ? null : 'Enter your town or city',
    state: state ? null : 'Select your state',
  };
  const show = (message: string | null) => (touched && message ? message : undefined);

  return (
    <AppKeyboardScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      footer={
        <Footer>
          <AppButton
            label="Verify address"
            loading={submitting}
            disabled={submitting}
            testID="address-submit"
            onPress={() => {
              setTouched(true);
              if (Object.values(problems).some(Boolean) || !state) return;
              onSubmit({
                addressLine: addressLine.trim(),
                city: city.trim(),
                ...(lga.trim() ? { lga: lga.trim() } : {}),
                state,
              });
            }}
          />
        </Footer>
      }
    >
      <Intro>
        Enter the address exactly as it appears on your NIN record. We compare it with the record,
        so a different house number, street or state will not pass.
      </Intro>
      <AppInput
        label="House number and street"
        value={addressLine}
        onChangeText={setAddressLine}
        autoComplete="street-address"
        error={show(problems.addressLine)}
        testID="address-line"
      />
      <AppInput
        label="Town or city"
        value={city}
        onChangeText={setCity}
        autoCapitalize="words"
        error={show(problems.city)}
        testID="address-city"
      />
      <AppInput
        label="Local government area (optional)"
        value={lga}
        onChangeText={setLga}
        autoCapitalize="words"
      />
      <AppSelect
        label="State"
        value={state}
        options={NIGERIAN_STATES}
        onChange={setState}
        searchable
        error={show(problems.state)}
        testID="address-state"
      />
    </AppKeyboardScrollView>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg, padding: spacing.md, paddingBottom: spacing.xl },
  footer: { borderTopWidth: 1, padding: spacing.md },
  hint: { fontSize: fontSizes.caption },
  notice: { borderRadius: radius.md, padding: spacing.md },
  noticeText: { fontSize: fontSizes.caption },
  photo: {
    alignItems: 'center',
    aspectRatio: 1.6,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  preview: { height: '100%', width: '100%' },
});
