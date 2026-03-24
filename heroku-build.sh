#!/bin/bash
  set -e

  echo "==> Installing pnpm via npm..."
  npm install -g pnpm@9

  echo "==> Copying pnpm workspace config..."
  cp heroku-workspace.yaml pnpm-workspace.yaml
  cat pnpm-workspace.yaml

  echo "==> Installing workspace dependencies..."
  pnpm install --no-frozen-lockfile

  echo "==> Building api-server..."
  pnpm --filter @workspace/api-server run build

  echo "==> Build complete!"
  