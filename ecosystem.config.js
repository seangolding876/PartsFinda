module.exports = {
  apps: [
    // Next.js App
    {
      name: 'partsfinda',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/partsfinda',
      instances: 'max', 
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },

    // Simple Worker
    {
      name: 'partsfinda-worker',
      script: './dist-worker/start_worker.js', // ✅ YEH FILE
      cwd: '/var/www/partsfinda', 
      instances: 1,
      exec_mode: 'fork'
    }
  ]
};