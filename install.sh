#!/bin/bash

# Aviso sobre otimização para Digital Ocean
echo "====================="
echo "AVISO: Este instalador foi otimizado e validado para uso na Digital Ocean."
echo "Certifique-se de acessar a sua VPS com acesso root e ajustar configurações conforme necessário para outros provedores."
echo "====================="

# Marcador de início
echo "Iniciando Instalação do JohnnyZap do Johnny"

# Atualizar os pacotes do sistema
echo "Atualizando pacotes do sistema..."
sudo apt update
sudo apt upgrade -y

# Instalar Python 2
echo "Instalando Python 2..."
sudo apt install python2-minimal -y

# Instalar Node.js e npm
echo "Instalando Node.js e npm..."
sudo apt install -y nodejs npm

# Verificar a versão do Node.js
echo "Verificando a versão do Node.js instalada..."
node -v

# Instalar Curl
echo "Instalando Curl..."
sudo apt install curl -y

# Instalar GDebi para instalar pacotes .deb
echo "Instalando GDebi..."
sudo apt install gdebi -y

# Baixar e instalar o Google Chrome
echo "Baixando e instalando Google Chrome..."
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb

# Instalar PM2 globalmente
echo "Instalando PM2..."
sudo npm install -g pm2

# Configurar o UFW (firewall)
echo "Configurando UFW (firewall)..."
sudo ufw enable
sudo ufw default allow incoming
sudo ufw allow 8080
sudo ufw allow 8081
sudo ufw allow 8083

# Instalar dependências do projeto
echo "Instalando dependências do projeto..."
npm install
npm run install-deps

sudo apt-get install libasound2t64

sudo gdebi google-chrome-stable_current_amd64.deb -n
sudo apt-get -f install -y

# Iniciar a aplicação usando PM2
echo "Iniciando a aplicação com PM2..."

# Iniciar o script sendMessage.js com pm2
pm2 start sendMessage.js

# Iniciar o script typeListener.js com pm2
pm2 start typeListener.js


# Mensagem de conclusão
echo "====================="
echo "JohnnyZap instalado!! =)"
echo "====================="
echo "Agora acesse:"
echo "http://ip_da_sua_vps:8081 - Leia o QRCode"
echo "http://ip_da_sua_vps:8083 - Leia o QRCode"
echo ""
echo "Então vá ao Dashboard do JohnnyZap com:"
echo "http://ip_da_sua_vps:8080"
echo "usuario: aluno"
echo "senha: alunoJohnny"
echo ""
echo "Pra cima deles!!"
