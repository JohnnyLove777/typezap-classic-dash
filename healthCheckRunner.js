const axios = require('axios');

async function checkServiceHealth(url) {
  try {
    const response = await axios.get(url);
    console.log(`Health check for ${url} succeeded with status:`, response.data);
  } catch (error) {
    console.error(`Health check for ${url} failed:`, error.message);
    // Aqui você pode adicionar qualquer lógica adicional para lidar com a falha, como notificar alguém ou reiniciar o serviço.
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

runHealthChecks();
