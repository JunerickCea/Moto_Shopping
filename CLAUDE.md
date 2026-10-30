# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

Two packages plus a thin root `package.json` used only by the Render deployment:

- `vue-client/` — Vue 3 + Vuetify + Tailwind SPA (Vite 5)
- `vue-server/` — Express 5 API backed by Postgres (Neon in production). In production it also serves the built client from `vue-client/dist`, so the page and API share one origin.

## Commands

- Root: `npm run build` (installs + builds client, installs server), `npm start` (runs migrations, then the server), `npm test` (server tests). These are what Render runs.
- `vue-server/`: `npm run dev` (nodemon), `npm run migrate`, `npm test`.
- `vue-client/`: `npm run dev` (port 5173, proxies `/api` to `localhost:4444`), `npm run build`.
- Run one server test file: `node --test tests/auth.test.js` from `vue-server/`.

Server tests need a **throwaway** Postgres: set `TEST_DATABASE_URL` (tests truncate every table; the helper refuses to run if it equals `DATABASE_URL` in `vue-server/.env`). Without it the suites are skipped. Config comes from env vars — copy `vue-server/.env.example` to `.env`; `config.js` fails fast if `DATABASE_URL` or `SESSION_SECRET` is missing. `VITE_GOOGLE_CLIENT_ID` (see `vue-client/.env.example`) is read by Vite at **build** time.

## Architecture

### Auth and sessions (the part that spans files)
- Login state lives only in a server-side session: `express-session` + `connect-pg-simple` (table `session`), cookie `sid` (`httpOnly`, `SameSite=Lax`, `Secure` in production, 7-day rolling). The client stores no tokens or user data; `stores/mainStore.js` calls `GET /api/auth/me` on first navigation and the router guard (`router/index.js`) enforces `meta.requiresAuth` and `meta.roles`.
- The dashboard (`/`, `views/Home.vue`) is public: guests browse the catalog, reviews and shop map. Buying actions go through `store.requireLogin(action)`, which opens the login pop-up in `App.vue` (shared `components/LoginForm.vue`) and runs the action after login. Public API reads: `GET /api/motorcycles`, `/api/feedback`, `/api/shop`.
- `routes/auth.js`: bcrypt password login/registration and Google sign-in (ID token verified server-side by `lib/google.js`; tests inject a fake verifier through `createApp({ verifyGoogleToken })`). Logging in calls `req.session.regenerate` (`lib/session.js`).
- `ADMIN_EMAILS` promotes an address to Admin **only on Google sign-in** (verified email). Password registrations are never auto-promoted, because their email is unverified. When a Google user links to an existing unverified password account, that account's password and sessions are wiped (pre-hijack protection).
- Admin changes to a user (role, disable) delete that user's rows in `session` so they take effect immediately. Admins cannot change themselves.
- Rate limits (`express-rate-limit`) are created inside `authRoutes()`, so tests build a fresh app per test to reset counters.
- CSRF defence: `SameSite=Lax` plus `middleware/security.js` `sameOriginOnly` (rejects cross-site `Origin`/`Sec-Fetch-Site` on non-GET). CSP is configured in the same file and must allow Google's `accounts.google.com/gsi/*` plus `https:` images (motorcycle images are arbitrary admin-supplied URLs).

### Server (`vue-server/`)
- `app.js` exports `createApp({ config, db, pool, verifyGoogleToken, limits })` (used by `index.js` and tests); everything under `/api`, then static client + SPA fallback.
- Routes use `req.app.locals.db` (knex). All queries use the query builder; keep it that way.
- `routes/orders.js` places orders inside one transaction: locks motorcycle rows (`forUpdate`), checks stock, prices from DB (client-sent prices/totals are ignored), snapshots name/price/image into `order_items`. Only `Pending` orders can change status; cancelling restocks.
- `routes/feedback.js`: one review per order (unique `order_id`), only for the buyer's own `Shipped` orders. Public list shortens names ("Juan D.") and never returns emails; admins can hide (`is_hidden`) or delete. `routes/shop.js` reads/writes the single-row `shop_info` table (id = 1) whose address drives the key-less Google Maps embed (`frame-src` in the CSP).
- `lib/serializers.js` maps DB rows to the field names the Vue components use (`_id`, `Brand`, `MotorcycleName`, `Price`, `Stock`, `Image`, ...). Keep that mapping in one place rather than renaming fields in the large components.
- Schema is in `db/migrations/`; Render runs `knex migrate:latest` on every start.

### Client (`vue-client/`)
- All API calls go through `services/api.js` (`baseURL: '/api'`, same-origin). A 401 anywhere except `/auth/*` triggers the unauthorized handler wired in `main.js` (clears the user, goes to login). `errorMessage(err)` extracts the server's `error` text.
- Roles: `Admin` sees Motorcycle Master (`MotorShop.vue`, tabs Inventory / Orders / Feedback / Shop Info — the last two are `FeedbackAdmin.vue` and `ShopInfoAdmin.vue`) and Users Master; logged-in users also get My Orders (where shipped orders can be reviewed). Admin-only API routes enforce this server-side too.
- Prices are pesos: format with `peso()` from `utils/format.js`. Screens must work at phone width: dialogs use `:fullscreen="$vuetify.display.xs"`, form columns `cols="12" sm="6"`, tables `:mobile="$vuetify.display.xs"`.
- Vuetify is the main UI library; Tailwind classes are used for layout. `About.vue`, `Blank.vue`, `BackBtn.vue`, `Pill.vue` and a few `src/views/*View.vue` files are unrouted scaffold leftovers.
