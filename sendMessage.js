const http = require('http');
const bodyParser = require('body-parser');
//const qrcode = require('qrcode-terminal');
const socketIo = require('socket.io');
const QRCode = require('qrcode');
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const { Client, Buttons, List, MessageMedia, LocalAuth } = require('whatsapp-web.js');
require('dotenv').config();

// Gere o seu token 32 caracteres
const SECURITY_TOKEN = "a9387747d4069f22fca5903858cdda24";
const KIWIFY_TOKEN = process.env.KIWIFY_TOKEN;

const sessao = "sendMessage";

const app = express();
const server = http.createServer(app);

const port = 3000;

app.use(cors());
app.use(express.static('public'));
//app.use(bodyParser.json());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

const DATABASE_FILE_TYPEBOT_V2 = 'typebotDBV2.json';

function initializeDBTypebotV2() {
  // Verifica se o arquivo do banco de dados já existe
  if (!fs.existsSync(DATABASE_FILE_TYPEBOT_V2)) {
      // Se não existir, inicializa com um objeto vazio
      const db = {};
      writeJSONFileTypebotV2(DATABASE_FILE_TYPEBOT_V2, db);
  } else {
      // Se já existir, mantém os dados existentes
      console.log('Banco de dados V2 pronto no sendMessage.');
  }
}

function listAllFromDBTypebotV2() {
  return readJSONFileTypebotV2(DATABASE_FILE_TYPEBOT_V2);
}

function readJSONFileTypebotV2(filename) {
  try {
      return JSON.parse(fs.readFileSync(filename, 'utf8'));
  } catch (error) {
      return {};
  }
}

initializeDBTypebotV2();

// Configurações para o primeiro cliente (Windows)
/*const client = new Client({
    authStrategy: new LocalAuth({ clientId: sessao }),
    puppeteer: {
      executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    }
});*/
  
  //Kit com os comandos otimizados para nuvem Ubuntu Linux (créditos Pedrinho da Nasa Comunidade ZDG)
  const client = new Client({
    authStrategy: new LocalAuth({ clientId: sessao }),
    puppeteer: {
      headless: true,
      //CAMINHO DO CHROME PARA WINDOWS (REMOVER O COMENTÁRIO ABAIXO)
      //executablePath: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
      //===================================================================================
      // CAMINHO DO CHROME PARA MAC (REMOVER O COMENTÁRIO ABAIXO)
      //executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      //===================================================================================
      // CAMINHO DO CHROME PARA LINUX (REMOVER O COMENTÁRIO ABAIXO)
       executablePath: '/usr/bin/google-chrome-stable',
      //===================================================================================
      args: [
        '--no-sandbox', //Necessário para sistemas Linux
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process', // <- Este não funciona no Windows, apague caso suba numa máquina Windows
        '--disable-gpu'
      ]
    }
  });

  const appQR = express();
  const serverQR = http.createServer(appQR);
  const io = socketIo(serverQR);

  const portQR = 8083;

  appQR.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/sendMessageQR.html');
  });
    
  // Evento 'qr' - já fornecido anteriormente
client.on('qr', qr => {
    console.log('qr gerado');
    QRCode.toDataURL(qr, { errorCorrectionLevel: 'H' }, (err, url) => {
      if (err) {
        console.error('Erro ao gerar QR code', err);
        return;
      }
      io.emit('qr code', url);
    });
  });
  
  // Evento 'ready'
  client.on('ready', () => {
    console.log('API de endpoint sendMessage pronta e conectada.');
    io.emit('connection-ready', 'API pronta e conectada.');
  });
  
  // Evento 'authenticated'
  client.on('authenticated', () => {
    console.log('Autenticação bem-sucedida.');
    io.emit('authenticated', 'Autenticação bem-sucedida.');
  });
  
  client.on('disconnected', (reason) => {
    console.log(`Cliente desconectado: ${reason}`);
    io.emit('disconnected', `Cliente desconectado: ${reason}`);

    if (reason === 'NAVIGATION') {
        console.log('Reconectando instância e gerando novo QR code...');
        client.destroy().then(() => {
            client.initialize(); // Inicia uma nova instância
        });
    } else {
        console.log('Razão de desconexão não requer a geração de um novo QR code.');
    }
  });

  client.initialize();

  io.on('connection', (socket) => {
    console.log('Um usuário se conectou');     
    socket.on('disconnect', () => {
      console.log('Usuário desconectou');
    });
  });
  
  serverQR.listen(portQR, () => {
    console.log(`Servidor rodando em http://localhost:${portQR}`);
  });

app.post('/sendMessage', async (req, res) => {
    const { destinatario, mensagem, tipo, msg, media, token } = req.body;
    
    
    // Nova lógica para permitir mensagens sem token se a mensagem for um "gatilho"
    const dbTriggers = listAllFromDBTypebotV2(); // Obtém todos os registros do banco de dados
    let isTriggerMessage = false;

    // Verifica se a mensagem corresponde a algum "gatilho" no banco de dados
    Object.values(dbTriggers).forEach(trigger => {
        if (tipo === 'text' && mensagem === trigger.gatilho) {
            isTriggerMessage = true;
        }
    });

    // Se não for uma mensagem de gatilho e o token não for válido, retorna erro
    if (!isTriggerMessage && token !== SECURITY_TOKEN) {
        return res.status(401).json({ status: 'falha', mensagem: 'Token inválido' });
    }
    

    if (!client || !client.info) {
        return res.status(402).json({status: 'falha', message: 'Cliente Não Autenticado'});
    }

    if (!destinatario || !tipo) {
        return res.status(400).json({ status: 'falha', mensagem: 'Destinatario e tipo são obrigatórios' });
    }    

    try {
        const chatId = destinatario;

        switch (tipo) {
            case 'text':
                if (!mensagem) {
                    return res.status(400).json({ status: 'falha', mensagem: 'É preciso fornecer uma mensagem' });
                }
                await client.sendMessage(chatId, mensagem);
                break;
            case 'image':
                if (!media) {
                    return res.status(400).json({ status: 'falha', mensagem: 'É preciso fornecer uma midia' });
                }                
                await client.sendMessage(chatId, new MessageMedia(media.mimetype, media.data, media.filename));
                break;
            case 'video':
                if (!media) {
                    return res.status(400).json({ status: 'falha', mensagem: 'É preciso fornecer uma midia' });
                }
                await client.sendMessage(chatId, new MessageMedia(media.mimetype, media.data, media.filename));
                break;
            case 'audio':
                if (!media) {
                    return res.status(400).json({ status: 'falha', mensagem: 'É preciso fornecer uma midia' });
                }
                await client.sendMessage(chatId, new MessageMedia(media.mimetype, media.data, media.filename), {sendAudioAsVoice: true});
                break;
            case 'file':
                if (!media) {
                    return res.status(400).json({ status: 'falha', mensagem: 'É preciso fornecer uma midia' });
                }
                await client.sendMessage(chatId, new MessageMedia(media.mimetype, media.data, media.filename));
                break;
            default:
                return res.status(400).json({ status: 'falha', mensagem: 'Tipo de mensagem inválido' });
        }

        res.status(200).json({ status: 'sucesso', mensagem: 'Mensagem enviada com sucesso'});
    } catch (error) {
        console.error(error);        
        res.status(500).json({ status: 'falha', mensagem: 'Erro ao enviar mensagem' });
    }
});

app.post('/kiwify', bodyParser.raw({type: 'application/json'}), (req, res) => {
  const secret = 'YOUR_SECRET_TOKEN'; // Garanta que isso esteja correto
  const signatureReceived = req.query.signature;

  // `req.body` já é um Buffer devido ao uso de bodyParser.raw({type: 'application/json'})
  // Então, você deve passá-lo diretamente para o Hmac.update() sem conversão.

  const hmac = crypto.createHmac('sha1', secret);
  hmac.update(req.body); // Aqui, req.body é um Buffer e é passado diretamente.

  const calculatedSignature = hmac.digest('hex');

  if (signatureReceived !== calculatedSignature) {
      return res.status(400).send({ error: 'Assinatura incorreta' });
  }

  // Agora que a assinatura foi verificada, converta req.body para um objeto JSON para processamento.
  let eventData;
  try {
      eventData = JSON.parse(req.body.toString()); // Converte Buffer para String, depois para JSON
  } catch (error) {
      return res.status(400).send({ error: 'Erro ao analisar o JSON' });
  }

  // Processamento do evento aqui
  console.log('Evento de Webhook recebido:', eventData);

  // Responda com sucesso
  return res.status(200).send({ status: 'ok' });
});

server.listen(port, () => {
    console.log(`Servidor sendMessage rodando em http://localhost:${port}`);
});