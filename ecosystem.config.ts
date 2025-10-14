module.exports = {
  apps: [{
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
  }]
};