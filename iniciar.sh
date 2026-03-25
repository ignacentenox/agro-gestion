#!/bin/bash
# Script para iniciar el servidor Next.js de Agro Gestión

# Salir si ocurre un error
set -e

# Activar entorno si es necesario (descomentar si usas pyenv, nvm, etc)
# source ~/.nvm/nvm.sh
# nvm use 18

# Instalar dependencias si faltan
if [ ! -d "node_modules" ]; then
  echo "Instalando dependencias..."
  npm install
fi

# Iniciar el servidor de desarrollo
npm run dev
