import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { LoadingFallback } from '@/components/LoadingFallback';
import { fonts, palette } from '@/styles/theme';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    [fonts.heading]: require('../../assets/fonts/Michroma-Regular.ttf'),
    [fonts.body]: require('../../assets/fonts/Roboto-Regular.ttf'),
  });

  if (!fontsLoaded && !fontError) {
    return <LoadingFallback />;
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: palette.background },
          headerShown: false,
        }}
      />
    </>
  );
}
