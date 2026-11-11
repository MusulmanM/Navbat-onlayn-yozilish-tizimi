# Backup deployment option (spec 6, 19): run the app on any VPS (e.g. in Uzbekistan) with Docker.
#
# Build (NEXT_PUBLIC_* values are baked into the browser code at build time):
#   docker build -t navbat \
#     --build-arg NEXT_PUBLIC_APP_URL=https://navbat.uz \
#     --build-arg NEXT_PUBLIC_BRAND_NAME=Navbat \
#     --build-arg NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=navbat_bot \
#     --build-arg NEXT_PUBLIC_SUPPORT_TELEGRAM=navbat_support .
# Run (secrets only at runtime, never inside the image):
#   docker run -d --name navbat -p 3000:3000 --env-file .env.production.local --restart unless-stopped navbat
# Database migrations are applied from your computer: npm run db:deploy:prod

FROM node:26-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# 1) Dependencies (cached while package files do not change).
FROM base AS deps
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci --no-audit --no-fund

# 2) Build the standalone server.
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_BRAND_NAME
ARG NEXT_PUBLIC_TELEGRAM_BOT_USERNAME
ARG NEXT_PUBLIC_SUPPORT_TELEGRAM
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_BRAND_NAME=$NEXT_PUBLIC_BRAND_NAME \
    NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=$NEXT_PUBLIC_TELEGRAM_BOT_USERNAME \
    NEXT_PUBLIC_SUPPORT_TELEGRAM=$NEXT_PUBLIC_SUPPORT_TELEGRAM \
    NEXT_OUTPUT=standalone
RUN mkdir -p public && npx prisma generate && npx next build

# 3) Small runtime image, non-root user.
FROM base AS runner
# Keep HOSTNAME=0.0.0.0: binding to a specific address (e.g. 127.0.0.1) makes Next.js treat the
# locale rewrites as external and the Uzbek pages redirect in a loop (checked with server.js).
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
