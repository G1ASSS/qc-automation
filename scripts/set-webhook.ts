/** Load env then register Telegram webhook. Usage: npm run telegram:set-webhook -- --url https://xxx */
import 'dotenv/config';

async function main(): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const argUrl = process.argv.find((a) => a.startsWith('--url='))?.split('=')[1];
  const base = argUrl ?? process.env.PUBLIC_BASE_URL;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not set');
  if (!base) throw new Error('Provide --url=https://your-host or set PUBLIC_BASE_URL');
  const url = `${base.replace(/\/$/, '')}/webhooks/telegram`;
  const body: Record<string, string> = { url };
  if (secret) body.secret_token = secret;
  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ url, telegram: data }, null, 2));
  if (!res.ok || (data as { ok?: boolean }).ok !== true) process.exit(1);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
