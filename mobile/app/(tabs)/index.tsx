import { useQuery } from '@tanstack/react-query';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { supabase } from '@/lib/supabase';
import { colors, radius } from '@/lib/theme';
import { getProfile } from '@/services/profile';
import { localDateKey } from '@/lib/date';

export default function Overview() {
  const { data: user } = useQuery({ queryKey: ['user'], queryFn: async () => (await supabase.auth.getUser()).data.user });
  const { data: profile } = useQuery({ queryKey: ['profile', user?.id], enabled: !!user, queryFn: () => getProfile(user!.id) });
  const { data: water } = useQuery({ queryKey: ['water', user?.id, localDateKey()], enabled: !!user, queryFn: async () => { const { data, error } = await supabase.from('water_logs').select('amount_ml').eq('user_id', user!.id).eq('date', localDateKey()); if (error) throw error; return (data ?? []).reduce((sum, row) => sum + (row.amount_ml ?? 0), 0); } });

  return <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={s.page}>
    <Text style={s.eyebrow}>TODAY</Text><Text style={s.title}>Good morning{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}.</Text>
    <Text style={s.date}>{new Intl.DateTimeFormat(undefined, { weekday:'long', day:'numeric', month:'long' }).format(new Date())}</Text>
    <View style={s.hero}><View style={{ flex: 1 }}><Text style={s.heroKicker}>TODAY'S FOCUS</Text><Text style={s.heroTitle}>{profile?.goals || 'Build consistency without overloading your week.'}</Text><Text style={s.heroSub}>Built around your current schedule and training context.</Text></View><Text style={s.heroMark}>P</Text></View>
    <Text style={s.section}>Your day</Text>
    <View style={s.grid}><Metric label="Hydration" value={`${water ?? 0} ml`} /><Metric label="Training" value="—" /><Metric label="Recovery" value="—" /><Metric label="Football IQ" value="Start" /></View>
    <View style={s.why}><Text style={s.whyTitle}>Why today looks like this</Text><Text style={s.whyText}>Pitchpath uses your calendar, profile and recent activity. When those change, the plan can adapt instead of forcing a fixed routine.</Text></View>
  </ScrollView>;
}
function Metric({ label, value }: { label: string; value: string }) { return <View style={s.metric}><Text style={s.metricLabel}>{label}</Text><Text style={s.metricValue}>{value}</Text></View>; }
const s=StyleSheet.create({page:{padding:22,gap:8,paddingBottom:110,backgroundColor:colors.surface},eyebrow:{fontSize:11,letterSpacing:1.8,fontWeight:'800',color:colors.deepSage,marginTop:6},title:{fontSize:34,fontWeight:'700',color:colors.ink,lineHeight:39},date:{fontSize:15,color:colors.muted,marginBottom:10},hero:{minHeight:180,borderRadius:radius.xl,backgroundColor:colors.sand,padding:22,flexDirection:'row',overflow:'hidden'},heroKicker:{fontSize:10,letterSpacing:1.5,fontWeight:'800',color:colors.deepSage},heroTitle:{fontSize:24,fontWeight:'700',lineHeight:29,color:colors.ink,marginTop:8},heroSub:{fontSize:13,lineHeight:19,color:colors.muted,marginTop:8},heroMark:{fontSize:120,fontWeight:'800',color:'rgba(115,135,123,0.18)',alignSelf:'flex-end',lineHeight:120},section:{fontSize:19,fontWeight:'700',color:colors.ink,marginTop:18},grid:{flexDirection:'row',flexWrap:'wrap',gap:10},metric:{width:'48%',minHeight:104,borderRadius:radius.md,backgroundColor:colors.white,padding:16,borderWidth:1,borderColor:colors.blush,justifyContent:'space-between'},metricLabel:{fontSize:12,color:colors.muted,fontWeight:'700'},metricValue:{fontSize:22,color:colors.ink,fontWeight:'700'},why:{borderRadius:radius.md,backgroundColor:colors.ink,padding:18,marginTop:8},whyTitle:{color:colors.white,fontSize:16,fontWeight:'700'},whyText:{color:'#C8D0CB',fontSize:13,lineHeight:20,marginTop:7} });
