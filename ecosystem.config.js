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
    },
    
     {
      name: 'partsfinda-socket',
      script: 'index.js',
      cwd: '/opt/socket-server',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        SOCKET_PORT: 3001,
        JWT_SECRET: 'r9fQqsPeEJP6QbbN82RytCYqt1Dw1cc82AR66IibocE'
      }
    }
  ]
};