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

    // ---- BACKGROUND WORKER (COMPILED) ----
    {
      name: 'partsfinda-worker',
      script: './dist-worker/start_worker.js', // ✅ COMPILED JS
      cwd: '/var/www/partsfinda',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
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