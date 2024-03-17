#!/bin/bash

# Iniciar o script sendMessage.js com pm2
pm2 start sendMessage.js

# Iniciar o script typeListener.js com pm2
pm2 start typeListener.js
