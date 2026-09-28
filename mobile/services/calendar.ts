import { supabase } from '@/lib/supabase';
import { localDateKey, toUtcIsoFromLocal } from '@/lib/date';

export type EventType = 'school' | 'commute' | 'study' | 'personal' | 'social' | 'training' | 'match' | 'gym' | 'individual' | 'recovery' | 'sleep' | 'other';

export async function listEvents(userId: string, from: Date, to: Date) {
  const { data, error } = await supabase.from('calendar_events').select('*').eq('user_id', userId).gte('starts_at', from.toISOString()).lt('starts_at', to.toISOString()).order('starts_at');
  if (error) throw error;
  return data ?? [];
}

export async function createEvent(userId: string, input: { type: EventType; title: string; date: string; time: string; durationMinutes: number; notes?: string }) {
  const startsAt = toUtcIsoFromLocal(input.date, input.time);
  const endsAt = new Date(new Date(startsAt).getTime() + input.durationMinutes * 60000).toISOString();
  const { data, error } = await supabase.from('calendar_events').insert({ user_id: userId, type: input.type, title: input.title, starts_at: startsAt, ends_at: endsAt, duration_minutes: input.durationMinutes, notes: input.notes ?? null }).select().single();
  if (error) throw error;
  return data;
}

export async function createRecurringRule(userId: string, input: { title: string; type: EventType; weekday: number; time: string; durationMinutes: number; startDate?: string; endDate?: string }) {
  const { data, error } = await supabase.from('recurring_calendar_rules').insert({ user_id: userId, title: input.title, type: input.type, weekday: input.weekday, local_time: input.time, duration_minutes: input.durationMinutes, start_date: input.startDate ?? localDateKey(), end_date: input.endDate ?? null, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }).select().single();
  if (error) throw error;
  return data;
}
