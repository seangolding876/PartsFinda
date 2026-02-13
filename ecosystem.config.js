module.exports = {
  apps: [
    // Next.js Main App - FIXED VERSION
    {
      name: 'partsfinda',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/partsfinda',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '1G',
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0'
      },
      error_file: '/home/seanroot/.pm2/logs/partsfinda-error.log',
      out_file: '/home/seanroot/.pm2/logs/partsfinda-out.log',
      time: true
    },

    // Background Worker
    {
      name: 'partsfinda-worker',
      script: './dist-worker/start_worker.js',
      cwd: '/var/www/partsfinda',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://postgres:C5%2Ay%24gRPGFiNuVveagleEye7%24@97.74.85.166:5432/myprojectdb'
      }
    },
    {
      name: 'partsfinda-sms-worker', // 📱 SMS worker
      script: './dist-worker/sms-worker.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://postgres:C5%2Ay%24gRPGFiNuVveagleEye7%24@97.74.85.166:5432/myprojectdb'
      }
    },
    
    // Socket Server
    {
      name: 'partsfinda-socket',
      script: 'index.js',
      cwd: '/var/www/partsfinda/opt/socket-server',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        SOCKET_PORT: 3001,
        JWT_SECRET: 'r9fQqsPeEJP6QbbN82RytCYqt1Dw1cc82AR66IibocE',
        DATABASE_URL: 'postgresql://postgres:C5%2Ay%24gRPGFiNuVveagleEye7%24@97.74.85.166:5432/myprojectdb',
        REDIS_URL: 'redis://localhost:6379',
        REDIS_PASSWORD: '123@123',
        SMTP_HOST: 'smtp.office365.com',
        SMTP_PORT: 587,
        SMTP_USER: 'support@partsfinda.com',
        SMTP_PASS: 'Partsfinda@123',
        SMTP_FROM: '"PartsFinda Support" <support@partsfinda.com>',
        NEXTAUTH_URL: 'https://partsfinda.com'
      }
    }
  ]
};