module.exports = {
    apps: [
        {
            name: 'smarthandel-backend',
            script: 'dist/server.js',
            instances: 'max', // Run in cluster mode
            exec_mode: 'cluster',
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'production',
                PORT: 3001
            },
            env_production: {
                NODE_ENV: 'production'
            },
            error_file: 'logs/err.log',
            out_file: 'logs/out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss'
        }
    ]
};

/**
 * Instructions:
 * 1. Build the project: npm run build
 * 2. Start with PM2: pm2 start ecosystem.config.js
 * 3. Monitor: pm2 monit
 */
