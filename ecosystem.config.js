module.exports = {
  apps: [
    {
      name: 'typeListener',
      script: 'typeListener.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      cron_restart: '0 3 */4 * *', // Às 03:00 UTC a cada 4 dias, que será 00:00 em UTC-3 (BRT)
      exp_backoff_restart_delay: 60000
    },
    {
      name: 'sendMessage',
      script: 'sendMessage.js',
      instances: 1,
      autorestart: true,
      watch: false,       
      max_memory_restart: '200M',
      cron_restart: '0 3 */4 * *', // Às 03:00 UTC a cada 4 dias, que será 00:00 em UTC-3 (BRT)
      exp_backoff_restart_delay: 60000
    },
    {
      name: 'healthCheckRunner',
      script: 'healthCheckRunner.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '100M',
    }
  ]
};
