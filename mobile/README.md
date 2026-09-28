# Pitchpath Mobile

Native Android + iOS client built with Expo Router, TypeScript, TanStack Query and Supabase.

## Run

```bash
cd mobile
npm install
npx expo install --fix
cp .env.example .env
npx expo start
```

Use Expo Go for the first device pass. For store-style native builds use EAS after configuring the Expo project:

```bash
npm run doctor
eas build --platform android --profile preview
eas build --platform ios --profile preview
```

## Environment

- `EXPO_PUBLIC_SUPABASE_URL`: Supabase project URL.
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: publishable/anon-compatible client key. Never put a service-role key in the app.
- `EXPO_PUBLIC_API_URL`: URL of the existing Pitchpath web backend exposing `/api/assistant`.

## Supabase

The mobile app uses the existing Pitchpath Supabase project and existing authenticated tables. Apply `supabase/migrations/20260928170000_mobile_calendar_preferences_storage.sql` through the normal Supabase migration workflow before enabling recurring rules, player photo storage, preferences and notifications.

## Current native foundation

- Supabase Auth with persistent sessions and readable auth errors.
- Native bottom navigation: Overview, Calendar, Training, AI, More.
- Real calendar reads/writes with local-time conversion.
- Profile data reads and updates through a service layer.
- Native photo picker and camera entry points.
- AI request boundary that only reports a response returned by the backend.
- TanStack Query caching for user/profile/calendar/training data.
- EAS Android/iOS build profiles.
- Design tokens matching the Pitchpath visual direction.

The web app remains in the repository; `mobile/` is the native client.
