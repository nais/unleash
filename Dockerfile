# Build Stage
FROM node:24-alpine AS builder

# Version argument - defaults to v5, can be overridden for v6, v7, etc.
ARG UNLEASH_VERSION=v5

# Keep builds reproducible across pull requests and releases.
RUN npm install -g pnpm@11.20.0

WORKDIR /workspace

# Copy workspace and npm configuration first (better caching)
COPY pnpm-workspace.yaml .npmrc package.json pnpm-lock.yaml ./

# Copy package manifests for dependency installation (cached layer)
COPY packages/shared/package.json ./packages/shared/
COPY packages/unleash-${UNLEASH_VERSION}/package.json ./packages/unleash-${UNLEASH_VERSION}/

# Install dependencies (this layer is cached unless dependencies change)
RUN pnpm install --frozen-lockfile

# Copy TypeScript config (needed for builds)
COPY tsconfig.json ./

# Copy source code (changes frequently, so done after dependency install)
COPY packages/shared ./packages/shared
COPY packages/unleash-${UNLEASH_VERSION} ./packages/unleash-${UNLEASH_VERSION}

# Build both packages (shared first as it's a dependency)
RUN pnpm --filter @nais/unleash-shared build && \
    pnpm --filter unleash-${UNLEASH_VERSION} build

# Deploy the target and its injected workspace dependencies as a standalone app.
RUN pnpm deploy --filter=unleash-${UNLEASH_VERSION} --prod /prod/unleash

# Fail if the package escapes the deploy root or cannot load with production deps.
RUN cd /prod/unleash && \
    node -e "const fs = require('node:fs'); const root = process.cwd() + '/'; const dependency = fs.realpathSync('node_modules/@nais/unleash-shared'); if (!dependency.startsWith(root)) throw new Error('@nais/unleash-shared points outside the deploy root'); require('@nais/unleash-shared')"

# Production Stage
# Using Node.js 24 distroless for minimal attack surface
FROM gcr.io/distroless/nodejs24-debian13:nonroot

# Re-declare ARG for this stage
ARG UNLEASH_VERSION=v5

LABEL org.opencontainers.image.source=https://github.com/nais/unleash
LABEL org.opencontainers.image.description="NAIS Unleash ${UNLEASH_VERSION} server with custom authentication"
LABEL org.opencontainers.image.licenses=MIT
LABEL org.opencontainers.image.version=${UNLEASH_VERSION}

WORKDIR /app

# Copy the deployed production build from builder
COPY --from=builder /prod/unleash ./

CMD ["dist/index.js"]
