module.exports = {
  apps: [
    {
      name: 'typeListener',
      script: 'typeListener.js',
      instances: 1,
      autorestart: false,
      watch: false,
      max_memory_restart: '500M',
      cron_restart: '0 3 */3 * *'
    },
    {
      name: 'sendMessage',
      script: 'sendMessage.js',
      instances: 1,
      autorestart: false,
      watch: false
    }
  ]
};
