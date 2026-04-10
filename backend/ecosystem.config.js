// PM2 Ecosystem Config — Production Process Manager
// Usage: pm2 start ecosystem.config.js
// Install PM2:  npm install -g pm2

module.exports = {
    apps: [
        {
            name: 'student-portal-api',
            script: 'server.js',

            // Cluster mode: one process per CPU core
            instances: 'max',
            exec_mode: 'cluster',

            // Auto-restart policy
            watch: false,
            max_memory_restart: '500M',
            restart_delay: 3000,
            max_restarts: 10,

            // Environment
            env: {
                NODE_ENV: 'development',
            },
            env_production: {
                NODE_ENV: 'production',
            },

            // Logs
            out_file: './logs/pm2-out.log',
            error_file: './logs/pm2-error.log',
            merge_logs: true,
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
        },
    ],
};
