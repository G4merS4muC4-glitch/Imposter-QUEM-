import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts as useBebasFonts,
  BebasNeue_400Regular,
} from '@expo-google-fonts/bebas-neue';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_900Black,
} from '@expo-google-fonts/nunito';
import { Toaster } from '@/components/Toaster';
import { Onboarding } from '@/components/Onboarding';
import { theme } from '@/lib/theme';
import { useGameStore } from '@/lib/store';
import { applyCurrentTrackState } from '@/lib/music';

SplashScreen.preventAutoHideAsync().catch(() => {});

function MusicController() {
  const musicOn = useGameStore((s) => s.musicOn);
  const mode = useGameStore((s) => s.mode);

  useEffect(() => {
    applyCurrentTrackState().catch(() => {});
  }, [musicOn, mode]);

  return null;
}

function OnboardingGate() {
  const hasSeen = useGameStore((s) => s.hasSeenOnboarding);
  const markSeen = useGameStore((s) => s.markOnboardingSeen);
  if (hasSeen) return null;
  return <Onboarding onDone={markSeen} />;
}

export default function RootLayout() {
  const [loaded] = useBebasFonts({
    BebasNeue_400Regular,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_900Black,
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.bg },
            animation: 'fade',
          }}
        />
        <MusicController />
        <OnboardingGate />
        <Toaster />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
