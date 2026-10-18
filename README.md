# Adaptive DSA Platform V2

A placement-level DSA platform combining:

- LeetCode progress tracking
- Topic-level skill estimation
- Adaptive assessments
- Docker-based code execution
- AI submission analysis
- Analytics
- Personalized roadmap

## Run locally

```bash
npm install
copy .env.example .env.local
npm run dev
```

On macOS/Linux:

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000.

## Supabase

1. Create a Supabase project.
2. Put the URL and anon key into `.env.local`.
3. Run `supabase/schema.sql` in the Supabase SQL editor.
4. Enable Email/Password auth.

## Current implementation

This starter contains the foundation and a working in-memory adaptive engine.

The next production modules to implement are:

1. LeetCode adapter
2. Real Supabase-backed dashboard
3. Problem ingestion/topic mapping
4. Submission worker
5. Docker sandbox execution
6. OpenAI analysis
7. Analytics queries
8. Roadmap generation
9. Tests and deployment

## Security warning

Never execute untrusted student code directly in the Next.js process.

The Docker runner is only a placeholder. Production execution must happen in a separate worker with strong sandbox restrictions.
