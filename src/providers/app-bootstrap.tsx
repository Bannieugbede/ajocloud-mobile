import * as SplashScreen from 'expo-splash-screen';
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';

import { initializeApp, type AppInitialization } from '@/services/app-initialization';

const BootstrapContext = createContext<AppInitialization | null>(null);

export function AppBootstrap({ children }: PropsWithChildren) {
  const [state, setState] = useState<AppInitialization | null>(null);

  useEffect(() => {
    let mounted = true;
    void initializeApp().then((result) => {
      if (mounted) setState(result);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (state) SplashScreen.hide();
  }, [state]);

  if (!state) return null;
  return <BootstrapContext.Provider value={state}>{children}</BootstrapContext.Provider>;
}

export function useAppBootstrap(): AppInitialization {
  const state = useContext(BootstrapContext);
  if (!state) throw new Error('App bootstrap state is unavailable');
  return state;
}
