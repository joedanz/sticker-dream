# ABOUTME: Docker image for Sticker Dream - voice-activated sticker generator.
# ABOUTME: Includes CUPS for printing and openssl for certificate generation.

FROM node:22-slim

# Install system dependencies for printing and certificates
RUN apt-get update && apt-get install -y --no-install-recommends \
    cups \
    cups-client \
    cups-bsd \
    openssl \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@9.10.0 --activate

# Copy package files first for layer caching
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY . .

# Build the frontend
RUN pnpm build

# Create directories for runtime
RUN mkdir -p certs dist

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD curl -fk https://localhost:3000/api/qr || exit 1

CMD ["node", "--env-file=.env", "src/server.ts"]
