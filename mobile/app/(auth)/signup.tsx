import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { colors, radius } from '@/lib/theme';

export default function Signup() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!email || password.length < 8) return Alert.alert('Create account', 'Use a valid email and a password with at least 8 characters.');
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
    setBusy(false);
    if (error) return Alert.alert('Could not create account', error.message);
    if (!data.session) Alert.alert('Account created', 'Check your email to confirm your account.');
  };
  return <View style={s.screen}>
    <Text style={s.kicker}>PITCHPATH</Text><Text style={s.title}>Start your path.</Text><Text style={s.sub}>One account for your football, school and development system.</Text>
    <TextInput autoCapitalize="none" keyboardType="email-address" placeholder="Email" placeholderTextColor={colors.muted} value={email} onChangeText={setEmail} style={s.input} />
    <TextInput secureTextEntry placeholder="Password" placeholderTextColor={colors.muted} value={password} onChangeText={setPassword} style={s.input} />
    <Pressable disabled={busy} onPress={submit} style={s.button}><Text style={s.buttonText}>{busy ? 'Creating…' : 'Create account'}</Text></Pressable>
    <Link href="/(auth)/login" style={s.link}>Already have an account? Log in</Link>
  </View>;
}
const s = StyleSheet.create({ screen:{flex:1,padding:28,justifyContent:'center',gap:14,backgroundColor:colors.surface}, kicker:{fontSize:12,letterSpacing:2,color:colors.deepSage,fontWeight:'800'}, title:{fontSize:38,color:colors.ink,fontWeight:'700'}, sub:{fontSize:16,lineHeight:23,color:colors.muted,marginBottom:10}, input:{height:56,borderRadius:radius.md,backgroundColor:colors.white,paddingHorizontal:18,fontSize:16,color:colors.ink,borderWidth:1,borderColor:colors.blush},button:{height:56,borderRadius:radius.md,backgroundColor:colors.ink,alignItems:'center',justifyContent:'center'},buttonText:{color:colors.white,fontSize:16,fontWeight:'700'},link:{textAlign:'center',color:colors.deepSage,fontWeight:'700',marginTop:8} });
