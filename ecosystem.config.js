module.exports = {
  apps: [
    // ---- MAIN NEXT.JS APP ----
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
      },
      error_file: '/var/log/partsfinda/partsfinda-error.log',
      out_file: '/var/log/partsfinda/partsfinda-out.log',
      log_file: '/var/log/partsfinda/partsfinda-combined.log',
      time: true
    },

    // ---- BACKGROUND WORKER ----
    {
      name: 'partsfinda-worker',
       script: 'src/workers/requestProcessor.ts',
      instances: 1,
      cwd: '/var/www/partsfinda',
      watch: false,
      autorestart: true,
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/var/log/partsfinda/partsfinda-worker-error.log',
      out_file: '/var/log/partsfinda/partsfinda-worker-out.log',
      log_file: '/var/log/partsfinda/partsfinda-worker-combined.log',
      time: true
    }
  ]
};
