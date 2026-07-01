# RealAndPaws 🐾

RealAndPaws is a friendly website for dog lovers — browse popular breeds, enjoy fun
trivia, pick up practical care tips, catch the latest dog news, and take a dog quiz.
It's plain HTML, CSS, and JavaScript with no build step or framework; a handful of
tiny zero-dependency serverless functions power the news feed, the quiz lead capture,
and a password-protected admin page, with lead data stored in Supabase.

Breed photos load at runtime from the free [Dog CEO API](https://dog.ceo), and the
News page pulls fresh, tone-filtered headlines server-side — both degrade gracefully
to built-in content when offline.

## File structure

```
realsandpaws2/
├── index.html       # Homepage — hero, intro, links to every page
├── breeds.html      # Popular breeds gallery (photos via the Dog CEO API)
├── trivia.html      # Fun dog facts + a random-fact generator
├── care.html        # Care tips accordion (feeding, grooming, exercise, health)
├── news.html        # Dog news feed (live headlines + curated fallback)
├── styles.css       # Shared styles for the whole site
├── script.js        # Shared JS (mobile nav, active link, footer year)
├── favicon.svg      # Site icon
├── images/          # Bundled assets (Cane Corso photo)
├── admin.html       # Protected admin page (quiz leads), served at /admin
├── api/
│   ├── news.js      # GET: tone-filtered dog news
│   ├── lead.js      # POST: save a quiz lead to Supabase
│   └── admin/       # login.js · leads.js · logout.js (session-gated)
├── lib/
│   └── server.js    # Shared server helpers (auth + Supabase) — not an endpoint
├── vercel.json      # Vercel config (static + functions + /admin rewrite)
├── .env.example     # Required environment variables (names only, no secrets)
├── README.md        # This file
└── .gitignore
```

## Run locally

No tooling needed beyond Python (preinstalled on most systems):

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000> in your browser.

## Deploy on Vercel

This is a static site with **no build command** and **no framework** — Vercel
serves the pages as-is and automatically runs the one function in `api/` (see
[Live news feed](#live-news-feed) below). Nothing to configure.

### Option A — One-click deploy button

Once this project is on GitHub, deploy it in a single click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/vaeduco/realsandpaws2)

> The button clones [`vaeduco/realsandpaws2`](https://github.com/vaeduco/realsandpaws2)
> into the visitor's Vercel account and deploys it as-is, with no extra configuration.
> Anyone who opens the repo can deploy their own copy the same way.

### Option B — Vercel CLI

```bash
npm i -g vercel
vercel            # deploy a preview
vercel --prod     # deploy to production
```

### Option C — GitHub + vercel.com

1. Push this folder to GitHub:
   ```bash
   git remote add origin https://github.com/vaeduco/realsandpaws2.git
   git push -u origin main
   ```
2. Go to [vercel.com](https://vercel.com) and import the repo.
3. Set **Framework Preset** to **Other**.
4. Leave the **Build Command** empty.
5. Set the **Output Directory** to the project root (`.`).
6. Deploy.

Because the breed photos come from `dog.ceo` at runtime, the deployed site needs
internet access to display images — nothing is bundled or cached server-side.

## Live news feed

The News page calls `GET /api/news`, a small serverless function that runs on
Vercel. It fetches dog-related stories **server-side** (no CORS issues, no API key
required) and returns a JSON list filtered for a friendly tone — an item must
contain a positive signal (adoption, therapy, rescue, dog park, …) and must not
contain distressing or off-topic ("hot dog") terms.

- **Default (keyless):** uses the free Google News RSS feed — headline, source,
  and date. No setup needed.
- **Optional richer feed:** set a `GNEWS_KEY` environment variable in Vercel
  (free key from [gnews.io](https://gnews.io)) and the function switches to the
  GNews API, which also returns a real one-line **summary** per story.

If the function is unavailable, or too few wholesome stories are found, the page
keeps its built-in **curated articles**, so it always looks good.

Tune the feed by editing `api/news.js` — the search query and the `ALLOW` /
`BLOCK` / `FOOD` regular expressions control what shows up.

**Local note:** `python3 -m http.server` only serves static files, so `/api/news`
won't run locally and you'll see the curated articles. To exercise the function
locally, run `vercel dev` instead (requires the Vercel CLI).

## Quiz leads + admin (Supabase)

Before the quiz starts, visitors fill in **name, email, and phone**. On submit the
details are saved to a Supabase table called `quiz_leads`, and a protected
**`/admin`** page lists them (newest first).

### How it's wired (and why it's safe)

The browser never talks to Supabase directly. All access goes through serverless
functions that use the **service-role key** (a server-only env var):

- `POST /api/lead` — validates the three fields and inserts the lead (returns its id).
- `POST /api/quiz-result` — records the quiz score + pass/fail (recomputed server-side; write-once) and the per-question answers for that lead once they finish.
- `POST /api/admin/login` — checks `ADMIN_USER` / `ADMIN_PASSWORD` (constant-time)
  and sets an HMAC-signed, HttpOnly, SameSite session cookie (8-hour expiry).
- `GET /api/admin/leads` — returns the leads **only** for a request with a valid
  session cookie; otherwise `401`. The `/admin` page shows just a login form until
  you're authenticated, so the data is never exposed to anyone who isn't logged in.
- `POST /api/admin/logout` — clears the cookie.

Keys and the password live in environment variables, never in the code.

### 1. Create the table in Supabase

In the Supabase dashboard → **SQL Editor**, run:

```sql
create table if not exists public.quiz_leads (
  id           bigint generated always as identity primary key,
  name         text        not null,
  email        text        not null,
  phone        text        not null,
  created_at   timestamptz not null default now(),
  score        int,                 -- null until the quiz is completed
  passed       boolean,             -- true/false once completed; null = not finished
  completed_at timestamptz,
  answers      jsonb                -- per-question answers, shown in the admin details view
);

-- Lock the table down: with RLS on and no policies, the public/anon key has no
-- access. Our serverless functions use the service-role key, which bypasses RLS.
alter table public.quiz_leads enable row level security;

-- Already created the table from an earlier version? Add the result columns:
alter table public.quiz_leads
  add column if not exists score        int,
  add column if not exists passed       boolean,
  add column if not exists completed_at timestamptz,
  add column if not exists answers      jsonb;
```

### 2. Set environment variables (Vercel → Project → Settings → Environment Variables)

See [`.env.example`](.env.example). All five are required:

| Variable | What it is |
| --- | --- |
| `SUPABASE_URL` | e.g. `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase **service_role** key (Settings → API). Server-only — never expose it. |
| `ADMIN_USER` | Admin login username |
| `ADMIN_PASSWORD` | Admin login password |
| `ADMIN_SECRET` | Random string that signs the session cookie — generate with `openssl rand -hex 32` |

Redeploy after adding them. Then open **`/admin`** and log in.

**Local note:** the lead form and `/admin` need the functions, so use `vercel dev`
(with a local `.env`) rather than `python3 -m http.server`. Over plain-HTTP localhost
the session cookie is set without the `Secure` flag automatically; in production
(HTTPS on Vercel) it's `Secure`.
