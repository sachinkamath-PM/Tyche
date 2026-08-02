FROM node:22-alpine AS dependencies
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 tyche
COPY --from=builder --chown=tyche:nodejs /app/public ./public
COPY --from=builder --chown=tyche:nodejs /app/.next/standalone ./
COPY --from=builder --chown=tyche:nodejs /app/.next/static ./.next/static
RUN mkdir -p /app/.data && chown tyche:nodejs /app/.data
USER tyche
EXPOSE 3000
VOLUME ["/app/.data"]
CMD ["node", "server.js"]
