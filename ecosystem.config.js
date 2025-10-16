module.exports = {
  apps: [
    // Next.js Main App
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

    // Background Worker - WITH ENV
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
    
    // Socket Server
     // ✅ Socket Server - FIXED
    {
      name: 'partsfinda-socket',
      script: 'index.js',
      cwd: '/var/www/partsfinda/opt/socket-server',
      instances: 1,
      exec_mode: 'fork', // ✅ YEH ADD KARO
      env: {
        NODE_ENV: 'production',
        SOCKET_PORT: 3001,
        JWT_SECRET: 'r9fQqsPeEJP6QbbN82RytCYqt1Dw1cc82AR66IibocE'
      }
  ]
};