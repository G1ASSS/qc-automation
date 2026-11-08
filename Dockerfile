FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat

FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci --ignore-scripts || npm install --ignore-scripts

FROM base AS builder
ARG DATABASE_URL=postgresql://qc_user:dummy@localhost:5432/qc_reports?schema=public
ENV DATABASE_URL=$DATABASE_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci --omit=dev --ignore-scripts || npm install --omit=dev --ignore-scripts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY scripts ./scripts
EXPOSE 3000
# Run migrations with a 30-second timeout so a suspended Neon DB never
# hangs the container forever. If migrate fails, start the server anyway
# (the app handles DB-down gracefully) so the health endpoint stays up.
CMD ["sh", "-c", "timeout 30 npx prisma migrate deploy || echo 'Migration skipped (DB not ready)'; node dist/server.js"]
