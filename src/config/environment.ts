import { z } from 'zod';

const optionalUrl = z.union([z.literal(''), z.url()]).optional();

export const environmentSchema = z.object({
  EXPO_PUBLIC_APP_ENV: z.enum(['development', 'preview', 'production']).default('development'),
  EXPO_PUBLIC_API_BASE_URL: optionalUrl,
  EXPO_PUBLIC_WEB_URL: optionalUrl,
  EXPO_PUBLIC_SUPPORT_EMAIL: z.union([z.literal(''), z.email()]).optional(),
  EXPO_PUBLIC_PRIVACY_URL: optionalUrl,
  EXPO_PUBLIC_TERMS_URL: optionalUrl,
});

export type Environment = z.infer<typeof environmentSchema>;

export function parseEnvironment(values: Record<string, string | undefined>): Environment {
  return environmentSchema.parse(values);
}

export const environment = parseEnvironment({
  EXPO_PUBLIC_APP_ENV: process.env.EXPO_PUBLIC_APP_ENV,
  EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
  EXPO_PUBLIC_WEB_URL: process.env.EXPO_PUBLIC_WEB_URL,
  EXPO_PUBLIC_SUPPORT_EMAIL: process.env.EXPO_PUBLIC_SUPPORT_EMAIL,
  EXPO_PUBLIC_PRIVACY_URL: process.env.EXPO_PUBLIC_PRIVACY_URL,
  EXPO_PUBLIC_TERMS_URL: process.env.EXPO_PUBLIC_TERMS_URL,
});
