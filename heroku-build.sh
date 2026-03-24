#!/bin/bash
  set -e

  echo "==> Installing pnpm via npm..."
  npm install -g pnpm@9

  echo "==> Creating minimal pnpm workspace config..."
  node -e "
  const fs = require('fs');
  const yaml = [
    'packages:',
    "  - 'artifacts/*'",
    "  - 'lib/*'",
    "  - 'scripts'",
    '',
    'catalog:',
    "  '@types/node': ^25.3.3",
    '  drizzle-orm: ^0.45.1',
    '  zod: ^3.25.76'
  ].join('\n') + '\n';
  fs.writeFileSync('pnpm-workspace.yaml', yaml);
  console.log('pnpm-workspace.yaml written');
  "

  echo "==> Installing workspace dependencies..."
  pnpm install --no-frozen-lockfile

  echo "==> Building api-server..."
  pnpm --filter @workspace/api-server run build

  echo "==> Build complete!"
  