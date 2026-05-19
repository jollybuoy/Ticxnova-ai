# ai-assistant Edge Function

Deploy this function to the same Supabase project used by `VITE_SUPABASE_URL`.

```bash
supabase secrets set OPENAI_API_KEY=your_openai_key
supabase functions deploy ai-assistant
```

## Knowledge base integration

Before KB-aware answers work, run `supabase/saas-maturity.sql` so `kb_articles` and `kb_categories` exist.

The function:

1. Authenticates the user (JWT)
2. Loads **published** KB articles for the user's `tenant_id` only (RLS + explicit filter)
3. Runs keyword retrieval (`kbRetrieval.ts`, version `keyword_v1`)
4. Injects matching excerpts into the OpenAI system prompt
5. Returns `kbGrounded: true` when KB articles were used

Future semantic search: replace `searchKbArticles` in `kbRetrieval.ts` (keep the same match/response shape).

## Troubleshooting

If the frontend shows `Failed to send a request to the Edge Function`, check:

- The function is deployed as `ai-assistant` (includes `kbRetrieval.ts`)
- `.env.local` points to the same Supabase project
- `OPENAI_API_KEY` is set in Supabase function secrets
- Supabase function logs for runtime errors
- KB articles are **published** (drafts are not searched)
