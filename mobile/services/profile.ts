import { supabase } from '@/lib/supabase';

export async function getProfile(userId: string) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertProfile(userId: string, patch: Record<string, unknown>) {
  const { data, error } = await supabase.from('profiles').upsert({ id: userId, ...patch }, { onConflict: 'id' }).select().single();
  if (error) throw error;
  return data;
}

export async function uploadProfilePhoto(userId: string, uri: string) {
  const response = await fetch(uri);
  const body = await response.arrayBuffer();
  const path = `${userId}/profile-${Date.now()}.jpg`;
  const { error } = await supabase.storage.from('player-photos').upload(path, body, { contentType: 'image/jpeg', upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('player-photos').getPublicUrl(path);
  await upsertProfile(userId, { photo_url: data.publicUrl });
  return data.publicUrl;
}
