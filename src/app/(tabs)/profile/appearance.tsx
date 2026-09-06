import { AppearanceScreen } from '@/features/profile/appearance-screen';
import { useThemeStore } from '@/store/theme-store';

export default function AppearanceRoute() {
  const preference = useThemeStore((state) => state.preference);
  const setPreference = useThemeStore((state) => state.setPreference);

  return <AppearanceScreen preference={preference} onChange={setPreference} />;
}
