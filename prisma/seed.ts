import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // Seed is intentionally minimal — production data comes from Telegram.
  // Creates nothing by default; placeholder for `npm run db:seed`.
  // eslint-disable-next-line no-console
  console.log('db:seed — nothing to seed (QC data arrives via Telegram webhook).');
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
