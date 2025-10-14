module.exports = {
  apps: [
    // Main Next.js Application
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
      error_file: '/var/log/partsfinda-error.log',
      out_file: '/var/log/partsfinda-out.log',
      log_file: '/var/log/partsfinda-combined.log',
      time: true
    },
    
    // Worker Process - Yeh naya add karein
    {
      name: 'partsfinda-worker',
      script: './scripts/start-worker.js',
      cwd: '/var/www/partsfinda',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      },
      env_production: {
        NODE_ENV: 'production'
      },
      error_file: '/var/log/partsfinda-worker-error.log',
      out_file: '/var/log/partsfinda-worker-out.log',
      log_file: '/var/log/partsfinda-worker-combined.log',
      time: true
    }
  ]
};