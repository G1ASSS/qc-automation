# Telegram QC Report → Excel Automation

Production-ready automation: Telegram bot receives QC inspection reports → robust parsing → Zod validation → PostgreSQL (Prisma) → Google Sheets sync (idempotent + retry) → ExcelJS `.xlsx` export. Runs 24/7 in the cloud via webhook (no polling, no MacBook required).

## How it works

1. Telegram sends `POST /webhooks/telegram` (HTTPS + secret-token header).
2. Group/DM allowlist checked (`ALLOWED_TELEGRAM_CHAT_IDS`).
3. Duplicate gate on `(telegram_chat_id, telegram_message_id)` — retries never double-insert.
4. `parseQCMessage()` extracts structured fields; Zod validates.
5. Record saved to PostgreSQL with the **original message preserved**.
6. Google Sheets append enqueued (exponential backoff; `PENDING → SYNCED / FAILED`, retry worker resumes after restarts).
7. Bot replies with a short confirmation (or a non-technical ⚠️ message listing the missing field).

Sample input → one DB row + one sheet row:

```text
IPQC Random Inspection 15/09/2026
Factory 2 Row hole
Job Number: TD-HM-014
Number: 4
Machine No: 23
⏰Time: 15:03
📌QC check 100%=1pc.
✅QC check Ok.
❌unfinished
```

## Quick start (local)

```bash
npm install
cp .env.example .env   # fill DATABASE_URL etc.
docker compose up -d db
npm run db:generate
npm run db:migrate
npm run dev
```

Run tests: `npm test`. Typecheck: `npm run lint`. Build: `npm run build`.

## Environment

| Var | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `TELEGRAM_BOT_TOKEN` | yes (prod) | BotFather token — never commit |
| `TELEGRAM_WEBHOOK_SECRET` | yes (prod) | `X-Telegram-Bot-Api-Secret-Token` check |
| `PUBLIC_BASE_URL` | yes (prod) | e.g. `https://qc.example.com` for webhook registration |
| `GOOGLE_SHEET_ID` | yes (sheets) | Target spreadsheet ID |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | yes (sheets) | Raw JSON (or base64) of service-account key; or set `GOOGLE_SERVICE_ACCOUNT_KEY_FILE` |
| `GOOGLE_SHEET_TAB` | no | Tab name (default `QC Reports`) |
| `ALLOWED_TELEGRAM_CHAT_IDS` | recommended | Comma-separated chat IDs; empty = open mode |
| `PORT`, `NODE_ENV`, `LOG_LEVEL` | no | Server tuning |

## API

- `GET /` — admin dashboard (today stats, search/filters, export button, sync health)
- `GET /health` — `{ status, database, telegram, sheets }`
- `GET /ready` — readiness probe (503 when DB down)
- `POST /webhooks/telegram` — Telegram webhook (secret-token verified)
- `GET /api/qc?date=2026-09-15&factory=Factory%202&status=Unfinished&jobNumber=TD-HM-014&machineNumber=23` — filtered list
- `GET /api/qc/export.xlsx?...same filters` — real `.xlsx` (frozen header, filters, borders, auto widths), `QC_Report_YYYY-MM-DD.xlsx`
- `POST /api/admin/telegram/set-webhook` — body `{ "url": "https://host" }` or uses `PUBLIC_BASE_URL`
- `POST /api/admin/telegram/delete-webhook`
- `GET /api/admin/stats` / `/api/admin/failed` / `/api/admin/pending-sync`

Telegram commands: `/start /help /status /today /export`.

## Telegram setup

1. Talk to `@BotFather` → `/newbot` → copy token → `TELEGRAM_BOT_TOKEN`.
2. Generate a random secret: `openssl rand -hex 32` → `TELEGRAM_WEBHOOK_SECRET`.
3. Deploy this app to HTTPS (see below), then:
   ```bash
   npm run telegram:set-webhook -- --url=https://your-host
   ```
   Add the bot to your QC group as admin (Privacy Mode: allow group messages), send the sample report, verify the confirmation reply + DB + sheet row.
4. Restrict senders: set `ALLOWED_TELEGRAM_CHAT_IDS` to your group/chat IDs (message the bot or check logs for the numeric chat ID).
5. Remove anytime: `npm run telegram:delete-webhook`.

## Google Sheets setup

1. Google Cloud Console → new project → enable **Google Sheets API**.
2. **IAM & Admin → Service Accounts** → create account → **Keys → Add key (JSON)** → download.
3. Share your spreadsheet with the service-account email (`...@....iam.gserviceaccount.com`) as **Editor**.
4. Set `GOOGLE_SHEET_ID` (the long ID in the sheet URL) and `GOOGLE_SERVICE_ACCOUNT_JSON` (paste the whole JSON, or base64 it). First sync auto-creates the header row (columns A–M per spec).

## Cloud deploy (example: any Docker host / Render / Fly / Railway)

The app is stateless + webhook-based; only Postgres persists.

```bash
docker build -t qc-automation .
docker run -p 3000:3000 --env-file .env qc-automation
# container runs: prisma migrate deploy && node dist/server.js
```

With docker compose: `docker compose up -d --build`. Then register the webhook (above) pointing at your HTTPS domain. The container auto-runs migrations and resumes pending sheet syncs on restart.

Minimal production checklist: HTTPS domain → env vars set → `docker compose up` → `/health` = ok → set webhook → send sample → check `/` dashboard + sheet.

## Project layout

```text
src/app.ts src/server.ts
src/config/ src/middleware/ src/routes/ src/controllers/
src/parsers/qcParser.ts  src/validators/  src/types/
src/database/  src/services/  src/integrations/telegram/  src/integrations/google-sheets/
src/jobs/  src/utils/
tests/parser/ tests/api/ tests/integrations/
prisma/schema.prisma  prisma/migrations/  scripts/  Dockerfile  docker-compose.yml
```

## Reliability notes

- At-least-once webhooks: unique `(chat, message)` + `P2002` handling + pre-check → exactly one logical record.
- Sheets failures never lose DB data: status stays `PENDING/FAILED` with `retry_count` + `sheet_sync_error`, retried with exponential backoff by the worker.
- Parser never throws; invalid messages go to `failed_messages` and get a friendly Telegram reply (no stack traces).
- Timezone: app displays in `Asia/Bangkok`; timestamps stored as UTC.
