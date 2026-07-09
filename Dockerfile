# ============================================================
#  MAXX-XMD WhatsApp Bot - Docker Image
#  Built by Carlymaxx | https://maxxtech.co.ke
#  Get Session ID: https://pair.maxxtech.co.ke
# ============================================================

FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy workspace config first (for caching)
COPY pnpm-workspace.yaml package.json .npmrc ./
COPY artifacts/carlymaxx-engine/package.json ./artifacts/carlymaxx-engine/

# Install dependencies (production only)
RUN pnpm install --prod --frozen-lockfile 2>/dev/null || pnpm install --prod

# Copy the rest of the bot files
COPY . .

# Environment variables (override at runtime)
ENV SESSION_ID=""
ENV BOT_NAME="MAXX-XMD"
ENV PREFIX="."
ENV WORK_MODE="public"
ENV OWNER_NUMBER=""
ENV NODE_ENV=production
ENV NPM_CONFIG_PRODUCTION=false

# Expose port (for health check / web dyno)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', r => r.statusCode < 500 ? process.exit(0) : process.exit(1)).on('error', () => process.exit(0))"

# Start the bot
CMD ["node", "--enable-source-maps", "./artifacts/carlymaxx-engine/dist/index.mjs"]
