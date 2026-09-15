/** Remove the Telegram webhook (drops to polling-safe state). Usage: npm run telegram:delete-webhook */
import 'dotenv/config';

async function main(): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not set');
  const res = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=false`);
  const data = await res.json();
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ telegram: data }, null, 2));
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
