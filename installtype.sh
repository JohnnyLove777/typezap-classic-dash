#!/bin/bash

# Função para solicitar informações ao usuário e armazená-las em variáveis
function solicitar_informacoes {
    read -p "Digite o endereço IP da VPS: " IP_VPS
    read -p "Digite o e-mail do Gmail para cadastro do Typebot: " EMAIL_GMAIL
    read -p "Digite a senha de app do Gmail (sem espaços): " SENHA_APP_GMAIL
}

# Função para orientar o usuário sobre como gerar a senha de app do Gmail
function orientar_senha_app {
    echo "Para gerar a senha de app do Gmail, siga os seguintes passos:"
    echo "1. Acesse sua Conta do Google: myaccount.google.com"
    echo "2. Na página de Segurança, ative o 'Acesso a app menos seguro'."
    echo "3. Se necessário, crie uma senha de app específica para o Typebot."
}

# Função para instalar o Typebot de acordo com os comandos fornecidos
function instalar_typebot {
    # Atualização e upgrade do sistema
    sudo apt update
    sudo apt upgrade -y
    sudo apt-add-repository universe

    # Instalação das dependências
    sudo apt install -y python2-minimal nodejs npm git curl apt-transport-https ca-certificates software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
    sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu bionic stable"
    sudo apt update
    sudo apt install -y docker-ce docker-compose

    # Adiciona usuário ao grupo Docker
    sudo usermod -aG docker ${USER}

    # Solicita informações ao usuário
    solicitar_informacoes

    # Orienta o usuário sobre como gerar a senha de app do Gmail
    orientar_senha_app

    # Criação do arquivo docker-compose.yml com base nas informações fornecidas
    cat <<EOF > docker-compose.yml
# Johnny Typebot Installer Without Domain
# Version 1.0

version: '3.3'
services:
  typebot-db:
    image: postgres:13
    restart: always
    volumes:
      - db_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=typebot
      - POSTGRES_PASSWORD=typebot

  typebot-builder:
    ports:
      - 3001:3000
    image: baptistearno/typebot-builder:latest
    restart: always
    depends_on:
      - typebot-db
    environment: 
      - DATABASE_URL=postgresql://postgres:typebot@typebot-db:5432/typebot
      - NEXTAUTH_URL=http://${IP_VPS}:3001
      - NEXT_PUBLIC_VIEWER_URL=http://${IP_VPS}:3002
      - ENCRYPTION_SECRET=875c916244442f7d89a8f376d9d33cac
      - ADMIN_EMAIL=${EMAIL_GMAIL}
      - SMTP_HOST=smtp.gmail.com
      - SMTP_PORT=465
      - SMTP_USERNAME=${EMAIL_GMAIL}
      - SMTP_PASSWORD=${SENHA_APP_GMAIL}
      - SMTP_SECURE=true
      - NEXT_PUBLIC_SMTP_FROM='Suporte Typebot' <${EMAIL_GMAIL}>
      - S3_ACCESS_KEY=minio
      - S3_SECRET_KEY=minio123
      - S3_BUCKET=typebot
      - S3_ENDPOINT=http://${IP_VPS}:9000

  typebot-viewer:
    ports:
      - 3002:3000
    image: baptistearno/typebot-viewer:latest
    restart: always
    environment:
      - DATABASE_URL=postgresql://postgres:typebot@typebot-db:5432/typebot
      - NEXT_PUBLIC_VIEWER_URL=http://${IP_VPS}:3002
      - NEXTAUTH_URL=http://${IP_VPS}:3001
      - ENCRYPTION_SECRET=875c916244442f7d89a8f376d9d33cac
      - S3_ACCESS_KEY=minio
      - S3_SECRET_KEY=minio123
      - S3_BUCKET=typebot
      - S3_ENDPOINT=http://${IP_VPS}:9000

  mail:
    image: bytemark/smtp
    restart: always

  minio:
    image: minio/minio
    command: server /data
    ports:
      - '9000:9000'
    environment:
      MINIO_ROOT_USER: minio
      MINIO_ROOT_PASSWORD: minio123
    volumes:
      - s3_data:/data

  createbuckets:
    image: minio/mc
    depends_on:
      - minio
    entrypoint: >
      /bin/sh -c "
      sleep 10;
      /usr/bin/mc config host add minio http://minio:9000 minio minio123;
      /usr/bin/mc mb minio/typebot;
      /usr/bin/mc anonymous set public minio/typebot/public;
      exit 0;
      "

volumes:
  db_data:
  s3_data:
EOF

    # Inicia os contêineres
    docker-compose up -d

    echo "Typebot instalado e configurado com sucesso!"
}

# Chamada das funções
instalar_typebot
