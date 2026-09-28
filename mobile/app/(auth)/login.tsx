import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { colors, radius } from '@/lib/theme';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email || !password) return Alert.alert('Log in', 'Enter your email and password.');
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) Alert.alert('Could not log in', error.message);
  };

  return <View style={s.screen}>
    <View style={s.brand}><View style={s.logo}><Text style={s.logoText}>P</Text></View><Text style={s.wordmark}>PITCHPATH</Text></View>
    <Text style={s.kicker}>YOUR FOOTBALL LIFE, CONNECTED.</Text>
    <Text style={s.title}>Build your path.</Text>
    <Text style={s.sub}>Football, school, recovery and development in one calm system.</Text>
    <TextInput autoCapitalize="none" keyboardType="email-address" placeholder="Email" placeholderTextColor={colors.muted} value={email} onChangeText={setEmail} style={s.input} />
    <TextInput secureTextEntry placeholder="Password" placeholderTextColor={colors.muted} value={password} onChangeText={setPassword} style={s.input} />
    <Pressable disabled={busy} onPress={submit} style={({ pressed }) => [s.button, pressed && { opacity: 0.82 }]}><Text style={s.buttonText}>{busy ? 'Logging in…' : 'Log in'}</Text></Pressable>
    <Link href="/(auth)/signup" style={s.link}>Create an account</Link>
  </View>;
}

const s = StyleSheet.create({
  screen: { flex: 1, padding: 28, justifyContent: 'center', gap: 14, backgroundColor: colors.surface },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 26 },
  logo: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  logoText: { color: colors.white, fontSize: 23, fontWeight: '700' },
  wordmark: { fontSize: 13, letterSpacing: 2.6, fontWeight: '800', color: colors.ink },
  kicker: { fontSize: 11, letterSpacing: 1.7, color: colors.deepSage, fontWeight: '800' },
  title: { fontSize: 38, lineHeight: 42, color: colors.ink, fontWeight: '700', marginTop: 2 },
  sub: { fontSize: 16, lineHeight: 23, color: colors.muted, marginBottom: 12 },
  input: { height: 56, borderRadius: radius.md, backgroundColor: colors.white, paddingHorizontal: 18, fontSize: 16, color: colors.ink, borderWidth: 1, borderColor: colors.blush },
  button: { height: 56, borderRadius: radius.md, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  link: { textAlign: 'center', color: colors.deepSage, fontWeight: '700', marginTop: 8 },
});
