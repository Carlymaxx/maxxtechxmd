#!/bin/bash
  set -e

  echo "==> Installing pnpm via npm..."
  npm install -g pnpm@9

  echo "==> Creating minimal pnpm workspace config..."
  cat > pnpm-workspace.yaml << 'WORKSPACE_EOF'
  packages:
    - 'artifacts/*'
    - 'lib/*'
    - 'scripts'

  catalog:
    '@types/node': ^25.3.3
    drizzle-orm: ^0.45.1
  WORKSPACE_EOF

  echo "==> Installing workspace dependencies..."
  pnpm install --no-frozen-lockfile

  echo "==> Building api-server..."
  pnpm --filter @workspace/api-server run build

  echo "==> Build complete!"
  