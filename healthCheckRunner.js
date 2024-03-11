const axios = require('axios');
const { exec } = require('child_process');

async function checkServiceHealth(url, serviceName) {
  try {
    const response = await axios.get(url);
    //console.log(`Health check for ${url} succeeded with status:`, response.data);
  } catch (error) {
    console.error(`Health check for ${url} failed:`, error.message);
    console.log(`Tentando reiniciar ${serviceName}...`);
    exec(`pm2 restart ${serviceName}`, (err, stdout, stderr) => {
      if (err) {
        console.error(`Erro ao reiniciar ${serviceName}:`, err);
        return;
      }
      console.log(`${serviceName} reiniciado com sucesso.`);
    });
  }
}

function runHealthChecks() {
  // URLs dos endpoints de health check para seus serviços
  const services = [
    'http://localhost:8888/healthcheck', // URL para sendMessage
  ];

  services.forEach(serviceUrl => checkServiceHealth(serviceUrl));

  // Agendar a próxima execução
  setTimeout(runHealthChecks, 600000); // Verifica a saúde a cada 600 segundos (10 minutos)
}

// Adicionando latência inicial antes de iniciar as verificações
const initialDelay = 3600000; // 60 minutos em milissegundos

setTimeout(runHealthChecks, initialDelay);
