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
      env: { NODE_ENV: 'production', PORT: 3000 }
    },

    // Worker
    {
      name: 'partsfinda-worker', 
      script: './dist-worker/start_worker.js',
      cwd: '/var/www/partsfinda',
      instances: 1,
      exec_mode: 'fork'
    },
    
    // Socket Server (from your existing /opt/socket-server)
    {
      name: 'partsfinda-socket',
      script: 'index.js', 
      cwd: '/opt/socket-server',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        SOCKET_PORT: 3001,
        JWT_SECRET: 'r9fQqsPeEJP6QbbN82RytCYqt1Dw1cc82AR66IibocE'
      }
    }
  ]
};