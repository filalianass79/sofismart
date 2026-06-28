# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl wget
COPY package.json package-lock.json* ./
# postinstall (prisma generate) needs prisma/schema — run in builder stage instead
RUN npm config set fetch-retries 5 \
  && npm config set fetch-retry-mintimeout 20000 \
  && npm config set fetch-retry-maxtimeout 120000 \
  && npm config set fetch-timeout 300000 \
  && (npm ci --ignore-scripts || npm ci --ignore-scripts || npm ci --ignore-scripts)

FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl wget
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Middleware Next.js lit AUTH_SECRET au build — requis pour valider les cookies JWT
ARG AUTH_SECRET
ARG NEXTAUTH_SECRET
ARG NEXTAUTH_URL
ARG APP_URL
ENV AUTH_SECRET=$AUTH_SECRET
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV APP_URL=$APP_URL
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache libc6-compat openssl wget
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/src/generated ./src/generated
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pg ./node_modules/pg
# OCR / PDF (serverExternalPackages — requis en runtime hors bundle Next)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/tesseract.js ./node_modules/tesseract.js
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/tesseract.js-core ./node_modules/tesseract.js-core
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pdf-parse ./node_modules/pdf-parse
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pdfjs-dist ./node_modules/pdfjs-dist
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/bmp-js ./node_modules/bmp-js
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/wasm-feature-detect ./node_modules/wasm-feature-detect
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/zlibjs ./node_modules/zlibjs

RUN mkdir -p public/uploads/{documents,pdfs,images,invoice-imports,catalog,delivery-signed,delivery-notes,proformas,company/logo,company/header,company/footer} \
  && chown -R nextjs:nodejs public/uploads

COPY --chown=nextjs:nodejs scripts/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
