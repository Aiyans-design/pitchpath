import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { colors, radius } from '@/lib/theme';
import { createEvent, listEvents } from '@/services/calendar';
import { localDateKey, localTime } from '@/lib/date';

export default function Calendar() {
  const qc = useQueryClient(); const [showAdd,setShowAdd]=useState(false); const [title,setTitle]=useState(''); const [time,setTime]=useState('18:00');
  const [date] = useState(localDateKey());
  const { data: user } = useQuery({queryKey:['user'],queryFn:async()=> (await supabase.auth.getUser()).data.user});
  const from=useMemo(()=>{const d=new Date(); d.setHours(0,0,0,0); return d},[]); const to=useMemo(()=>new Date(from.getTime()+7*86400000),[from]);
  const {data:events=[]}=useQuery({queryKey:['calendar',user?.id,date],enabled:!!user,queryFn:()=>listEvents(user!.id,from,to)});
  const add=async()=>{if(!title.trim()) return; try { await createEvent(user!.id,{type:'personal',title:title.trim(),date,time,durationMinutes:60}); setTitle(''); setShowAdd(false); await qc.invalidateQueries({queryKey:['calendar']}); } catch(e){Alert.alert('Could not save event',String(e instanceof Error?e.message:e));}};
  return <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={s.page}>
    <View style={s.head}><View><Text style={s.eyebrow}>PLAN</Text><Text style={s.title}>Calendar</Text></View><Pressable onPress={()=>setShowAdd(v=>!v)} style={s.add}><Text style={s.addText}>+</Text></Pressable></View>
    {showAdd && <View style={s.form}><Text style={s.formTitle}>New personal event</Text><TextInput value={title} onChangeText={setTitle} placeholder="Study, hangout…" placeholderTextColor={colors.muted} style={s.input}/><TextInput value={time} onChangeText={setTime} placeholder="18:00" placeholderTextColor={colors.muted} style={s.input}/><Pressable onPress={add} style={s.save}><Text style={s.saveText}>Save to calendar</Text></Pressable></View>}
    <Text style={s.day}>{new Intl.DateTimeFormat(undefined,{weekday:'long',day:'numeric',month:'long'}).format(new Date())}</Text>
    {events.length===0 ? <View style={s.empty}><Text style={s.emptyTitle}>Your day is open.</Text><Text style={s.emptyText}>Add school, study, football, gym or personal events. Pitchpath uses the calendar as the central planning layer.</Text></View> : events.map((e:any)=><View key={e.id} style={s.event}><View style={s.dot}/><View style={{flex:1}}><Text style={s.eventTime}>{localTime(e.starts_at)}</Text><Text style={s.eventTitle}>{e.title}</Text><Text style={s.eventType}>{e.type}</Text></View></View>)}
  </ScrollView>;
}
const s=StyleSheet.create({page:{padding:22,gap:10,paddingBottom:110,backgroundColor:colors.surface},head:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},eyebrow:{fontSize:11,letterSpacing:1.8,color:colors.deepSage,fontWeight:'800'},title:{fontSize:34,color:colors.ink,fontWeight:'700'},add:{width:46,height:46,borderRadius:23,backgroundColor:colors.ink,alignItems:'center',justifyContent:'center'},addText:{fontSize:27,color:colors.white,fontWeight:'300'},form:{backgroundColor:colors.white,borderRadius:radius.lg,padding:16,gap:10,borderWidth:1,borderColor:colors.blush,marginTop:8},formTitle:{fontSize:17,fontWeight:'700',color:colors.ink},input:{height:50,borderRadius:radius.md,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.blush,paddingHorizontal:15,color:colors.ink},save:{height:50,borderRadius:radius.md,backgroundColor:colors.deepSage,alignItems:'center',justifyContent:'center'},saveText:{color:colors.white,fontWeight:'700'},day:{fontSize:16,fontWeight:'700',color:colors.ink,marginTop:14},empty:{padding:22,borderRadius:radius.lg,backgroundColor:colors.sand,marginTop:4},emptyTitle:{fontSize:20,fontWeight:'700',color:colors.ink},emptyText:{fontSize:14,lineHeight:21,color:colors.muted,marginTop:8},event:{backgroundColor:colors.white,borderRadius:radius.md,padding:16,flexDirection:'row',gap:13,borderWidth:1,borderColor:colors.blush,marginTop:3},dot:{width:8,height:8,borderRadius:4,backgroundColor:colors.deepSage,marginTop:6},eventTime:{fontSize:12,color:colors.deepSage,fontWeight:'800'},eventTitle:{fontSize:17,color:colors.ink,fontWeight:'700',marginTop:2},eventType:{fontSize:12,color:colors.muted,marginTop:3,textTransform:'capitalize'} });
