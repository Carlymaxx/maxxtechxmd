module.exports = {
  apps: [
    {
      name: 'maxx-pair-api',
      script: 'node',
      args: '--enable-source-maps artifacts/api-server/dist/index.mjs',
      cwd: '/root/maxxtechxmd',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: '8082',
        BOT_NAME: 'MAXX-XMD',
        APP_URL: 'https://pair.maxxtech.co.ke',
      },
    },
    {
      name: 'maxx-pair-front',
      script: 'node',
      args: 'pair-front.mjs',
      cwd: '/root/maxxtechxmd',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '128M',
      env: {
        NODE_ENV: 'production',
        PORT: '8081',
        BACKEND_PORT: '8082',
      },
    },
  ],
};
