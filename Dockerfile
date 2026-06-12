FROM node:22-bookworm-slim AS base
RUN corepack enable && corepack prepare pnpm@11.5.1 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY services/api/package.json ./services/api/
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
ARG NEXT_PUBLIC_API_BASE_URL=
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
RUN pnpm --filter web build && pnpm --filter api build
RUN pnpm --filter api deploy --prod --legacy /app/api
RUN cd /app/api && node --input-type=module -e "import('@livekit/rtc-node').then(() => console.log('rtc-node native binding ok'))"

FROM node:22-bookworm-slim AS runner
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    libglib2.0-0 \
    libnss3 \
    libnspr4 \
    nginx \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public
COPY --from=build /app/api ./api
COPY deploy/nginx.conf /app/nginx.conf
COPY deploy/start.sh /app/start.sh
RUN chmod +x /app/start.sh

ENV NODE_ENV=production
EXPOSE 80
CMD ["/app/start.sh"]
