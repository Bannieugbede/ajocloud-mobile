import { Redirect } from 'expo-router';

import { useAppBootstrap } from '@/providers/app-bootstrap';

export default function Index() {
  const { initialRoute } = useAppBootstrap();
  return <Redirect href={initialRoute} />;
}
