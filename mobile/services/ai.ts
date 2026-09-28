export type AiResult = { message: string; actions?: Array<{ type: string; status: 'success' | 'failed'; summary?: string }> };

export async function askPitchpath(input: { userId: string; message: string; context: unknown }): Promise<AiResult> {
  const base = process.env.EXPO_PUBLIC_API_URL;
  if (!base) throw new Error('Missing EXPO_PUBLIC_API_URL');
  const response = await fetch(`${base.replace(/\/$/, '')}/api/assistant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(`AI request failed (${response.status})`);
  const result = await response.json();
  if (!result?.message && !result?.reply) throw new Error('AI returned an invalid response');
  return { message: result.message ?? result.reply, actions: result.actions };
}
