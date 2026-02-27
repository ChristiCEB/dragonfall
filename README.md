# Dragonfall

Full-stack web app for a Roblox realm economy: **Drogons** (currency), **Houses**, **Bounties**, and player profiles linked to Roblox accounts.

## Tech stack

- **Frontend & API**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Database**: PostgreSQL with Prisma
- **Auth**: Roblox OAuth 2.0 + OIDC (Sign in with Roblox), JWT sessions (jose)
- **Security**: Postback key for game server calls, rate limiting (Upstash Redis or in-memory), Zod validation, Discord webhooks for important events

---

## Local setup

### 1. Prerequisites

- **Node.js** 18+
- **PostgreSQL** 14+ (local or cloud)

### 2. Install dependencies

```bash
npm install
```

### 3. Environment variables

Copy the example env and edit:

```bash
cp .env.example .env
```

Set at minimum:

- `DATABASE_URL` — Postgres connection string (e.g. `postgresql://user:password@localhost:5432/dragonfall`)
- `APP_BASE_URL` — Base URL for the app (local: `http://localhost:3000`)
- `ROBLOX_OAUTH_CLIENT_ID` — From your Roblox OAuth app (see below)
- `NEXTAUTH_SECRET` — Random secret for session JWTs: `openssl rand -base64 32`

Optional for local: `ROBLOX_OAUTH_CLIENT_SECRET` (confidential client), `ROBLOX_PRIVATE_KEY` (only if you’re testing postbacks). See [Environment variables](#environment-variables) for the full list.

### 4. Database

Create a database, then run migrations and generate the Prisma client:

```bash
npx prisma generate
npx prisma migrate deploy
```

For a fresh dev database you can use:

```bash
npx prisma migrate dev
```

(Optional) Seed initial data (e.g. Houses):

```bash
npm run db:seed
```

### 5. Dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string. |
| `APP_BASE_URL` | Yes | Base URL of the app (no trailing slash). Used for OAuth redirect URI and links. Examples: `http://localhost:3000`, `https://dragonfall.online`. |
| `NEXTAUTH_SECRET` | Yes | Secret for signing session JWTs. Generate with `openssl rand -base64 32`. |
| `ROBLOX_OAUTH_CLIENT_ID` | Yes | OAuth 2.0 Client ID from [create.roblox.com](https://create.roblox.com) (Credentials → OAuth). |
| `ROBLOX_OAUTH_CLIENT_SECRET` | No | Client secret if using a confidential client. Omit for PKCE-only (public client). |
| `ROBLOX_OIDC_ISSUER` | No | OIDC issuer URL. Default: `https://apis.roblox.com/oauth/`. |
| `ROBLOX_PRIVATE_KEY` | For postbacks | Shared secret for game server postbacks (`?key=...`). See [Postback key](#roblox-private-key-and-rotation). |
| `POSTBACK_KEY` | No | Legacy name for `ROBLOX_PRIVATE_KEY`; used if `ROBLOX_PRIVATE_KEY` is not set. |
| `ADMIN_ROBLOX_USER_IDS` | No | Comma-separated Roblox user IDs (superadmins; only they can toggle user role). |
| `ROBLOX_ADMIN_GROUP_ID` | No | Roblox group ID; members with rank ≥ `ROBLOX_ADMIN_MIN_RANK` are admins (cached 5 min). |
| `ROBLOX_ADMIN_MIN_RANK` | No | Minimum group rank for admin. Default `1`. |
| `ROBLOX_ADMIN_USER_IDS` | No | Legacy; same as `ADMIN_ROBLOX_USER_IDS`. |
| `DISCORD_WEBHOOK_URL` | No | Discord webhook for notifications (bounty claimed, large spend, suspicious payloads). |
| `UPSTASH_REDIS_REST_URL` | No | Upstash Redis REST URL for rate limiting. If unset, in-memory limit is used. |
| `UPSTASH_REDIS_REST_TOKEN` | No | Upstash Redis REST token. |
| `BASE_URL` | No | Fallback for `APP_BASE_URL` if unset. |
| `NEXTAUTH_URL` | No | Fallback for `APP_BASE_URL` if unset. |

---

## Roblox OAuth app

1. Go to [create.roblox.com](https://create.roblox.com) → **Credentials** → **OAuth**.
2. Create an OAuth 2.0 application.
3. Set the **Redirect URL** to:
   ```text
   https://<your-domain>/auth/callback
   ```
   Examples:
   - Production: `https://dragonfall.online/auth/callback`
   - Local: `http://localhost:3000/auth/callback`
4. Enable scopes: **openid**, **profile**.
5. Copy **Client ID** into `ROBLOX_OAUTH_CLIENT_ID`. If you use a confidential client, add **Client Secret** to `ROBLOX_OAUTH_CLIENT_SECRET`; otherwise leave it unset (PKCE is used).
6. Ensure `APP_BASE_URL` in your environment matches the domain you used (e.g. `https://dragonfall.online` with no trailing slash). The app will use `APP_BASE_URL + "/auth/callback"` as `redirect_uri` when redirecting to Roblox.

---

## Roblox private key and rotation

Game server postbacks must send a shared secret in the query string: `?key=<secret>`.

### Setting the key

1. Generate a long random value (e.g. 32+ bytes, URL-safe):
   ```bash
   openssl rand -base64 32
   ```
2. Set it in your environment as **`ROBLOX_PRIVATE_KEY`** (or legacy `POSTBACK_KEY`).
3. Configure your Roblox game to send this exact value as the `key` query parameter on every postback request. Do not commit the key to the repo or expose it to the client.

### Rotating the key

1. Generate a new value (same as above).
2. Update **`ROBLOX_PRIVATE_KEY`** in your deployment (Vercel env, Docker env, etc.) to the new value.
3. Deploy or restart the app so the new key is active.
4. Update the game server (or any script that calls the postback URLs) to use the new key in `?key=...`.
5. Old requests using the previous key will receive 401 after the deploy; ensure the game is updated before or immediately after the rotation.

---

## Switching base domain (dragonfall.com vs dragonfall.online)

The app uses a single base URL for OAuth and links. To switch domain:

1. Set **`APP_BASE_URL`** to the full base URL of the environment, with no trailing slash:
   - `https://dragonfall.online`
   - `https://dragonfall.com`
   - `http://localhost:3000` (local)
2. In the [Roblox OAuth app](#roblox-oauth-app), add or update the **Redirect URL** to match:
   ```text
   https://<your-chosen-domain>/auth/callback
   ```
   You can register multiple redirect URLs in the same OAuth app if you run both domains (e.g. staging and production).
3. Redeploy or restart so the new `APP_BASE_URL` is loaded. No code changes are required; the redirect URI is derived from `APP_BASE_URL` at runtime.

---

## Health endpoint

- **`GET /api/health`** — Returns `200` with `{ status: "ok", database?: "connected" }`. If `DATABASE_URL` is set, the handler pings the database; on DB failure it returns `503` with `database: "error"`. Use for liveness/readiness checks and load balancers.

---

## Production deploy

### Vercel + managed Postgres

1. **Database**: Create a Postgres database (Vercel Postgres, Neon, Supabase, etc.) and copy the connection string.
2. **Vercel project**: Connect the repo, set **Root Directory** if needed.
3. **Environment variables**: In Vercel → Settings → Environment Variables, set at least:
   - `DATABASE_URL`
   - `APP_BASE_URL` (e.g. `https://dragonfall.online`)
   - `NEXTAUTH_SECRET`
   - `ROBLOX_OAUTH_CLIENT_ID`
   - `ROBLOX_OAUTH_CLIENT_SECRET` (if used)
   - `ROBLOX_PRIVATE_KEY` (for postbacks)
   - Optionally: `ADMIN_ROBLOX_USER_IDS`, `ROBLOX_ADMIN_GROUP_ID`, `ROBLOX_ADMIN_MIN_RANK`, `DISCORD_WEBHOOK_URL`, Upstash Redis vars.
4. **Build**: Vercel runs `npm run build`. Ensure migrations are applied to the DB before or after first deploy (e.g. run `npx prisma migrate deploy` from a one-off job or locally against the production DB).
5. **Roblox OAuth**: Set the redirect URL to `https://<your-vercel-domain>/auth/callback` (or your custom domain).
6. **Health**: Use `GET /api/health` for checks; point your load balancer or monitoring at it if needed.

### Docker

There is no Dockerfile in the repo; you can add one and run the app in a container. Typical steps:

1. **Image**: Use a Node image, copy app files, run `npm ci`, `npx prisma generate`, and `npm run build`. Start with `npm start` (or `node .next/standalone/server.js` if using Next.js standalone output).
2. **Database**: Run Postgres (e.g. separate container or managed service). Run migrations before or when the app starts, e.g. `npx prisma migrate deploy`.
3. **Env**: Pass all required env vars (see [Environment variables](#environment-variables)) into the container. Never bake secrets into the image.
4. **Base URL**: Set `APP_BASE_URL` to the public URL of the app (e.g. `https://dragonfall.online`).
5. **Health**: Expose the app port and use `GET /api/health` for readiness/liveness.

---

## Postback endpoints (game server)

The Roblox game calls these with **`?key=<ROBLOX_PRIVATE_KEY>`** in the URL. All postback routes require this key and are rate-limited.

| Method | Path | Body / response |
|--------|------|-----------------|
| POST | `/api/postbacks/activity-points/postback` | `{ groupName, activityPoints }` |
| POST | `/api/postbacks/spend-drogons/postback` | `{ roblox_userid, amount, reason? }` |
| POST | `/api/postbacks/loot-chests/postback` | `{ roblox_userid, amount, position? }` |
| POST | `/api/postbacks/collect-bounty/postback` | `{ target_roblox_userid, claimed_roblox_username, claimed_roblox_userid }` |
| GET | `/api/postbacks/bounties/fetch` | Returns list of active bounties |
| POST | `/api/postbacks/player-count/postback` | `{ playerCount }` |
| POST | `/api/postbacks/fort-loot-chests/postback` | `{ roblox_userid, amount }` |
| POST | `/api/postbacks/farm-chest/postback` | `{ roblox_userid, amount }` |

Path prefix can include a suffix (e.g. `activity-points-v1`); the same handler runs.

**Example (Lua):**

```lua
local key = "YOUR_ROBLOX_PRIVATE_KEY"
local url = "https://dragonfall.online/api/postbacks/player-count/postback?key=" .. key
local body = game:GetService("HttpService"):JSONEncode({ playerCount = #game.Players:GetPlayers() })
local response = game:GetService("HttpService"):PostAsync(url, body, Enum.HttpContentType.ApplicationJson)
```

---

## Public API (no key)

- `GET /api/health` — Health check
- `GET /api/houses` — Houses leaderboard
- `GET /api/players` — Players leaderboard
- `GET /api/players/[robloxUserId]` — Player profile
- `GET /api/players/[robloxUserId]/events` — Player recent events
- `GET /api/bounties` — Active bounties
- `GET /api/player-count` — Latest player count

---

## Discord webhooks

If `DISCORD_WEBHOOK_URL` is set, the app sends embeds for:

- **Bounty claimed** — target, claimer, amount
- **Large purchase** — user, amount (≥ 5000 Drogons), reason
- **Suspicious** — postback errors, rejected payloads (suspicion score), handler errors

---

## Admin

Admins can use `/admin` (dashboard, users, bounties, logs). Access is granted if:

- The user’s Roblox ID is in **`ADMIN_ROBLOX_USER_IDS`** (superadmins; only they can toggle another user’s role), or
- The user is in the Roblox group **`ROBLOX_ADMIN_GROUP_ID`** with rank ≥ **`ROBLOX_ADMIN_MIN_RANK`** (cached 5 min).

---

## Project structure

```
├── app/
│   ├── (public)/           # Public pages: /, /houses, /players, /bounties, /profile
│   ├── (auth)/             # Auth: /error, /callback
│   ├── (admin)/            # Admin: /admin, /admin/users, /admin/bounties, /admin/logs
│   ├── api/                # API routes (auth, postbacks, admin, health, etc.)
│   ├── login/              # GET /login → redirect to Roblox OAuth
│   ├── auth/callback/     # GET /auth/callback → OAuth callback
│   ├── layout.tsx
│   └── globals.css
├── components/
├── hooks/
├── lib/                    # db, auth, admin-auth, validations, suspicion, discord, rate-limit, etc.
└── prisma/
    └── schema.prisma
```
