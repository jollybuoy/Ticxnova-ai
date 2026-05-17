# ai-assistant Edge Function

Deploy this function to the same Supabase project used by `VITE_SUPABASE_URL`.

```bash
supabase secrets set OPENAI_API_KEY=your_openai_key
supabase functions deploy ai-assistant
```

If the frontend shows `Failed to send a request to the Edge Function`, check:

- The function is deployed as `ai-assistant`
- `.env.local` points to the same Supabase project
- `OPENAI_API_KEY` is set in Supabase function secrets
- Supabase function logs for runtime errors

