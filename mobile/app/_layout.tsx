import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/theme';

const queryClient = new QueryClient();

function AuthGate() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!ready) return;
    const inAuth = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';
    if (!session && !inAuth) router.replace('/(auth)/login');
    if (session && inAuth) router.replace('/');
    if (session && !inAuth && !inOnboarding) return;
  }, [ready, session, segments]);

  if (!ready) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface }}><ActivityIndicator color={colors.deepSage} /></View>;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surface } }} />;
}

export default function RootLayout() {
  return <QueryClientProvider client={queryClient}><AuthGate /></QueryClientProvider>;
}
