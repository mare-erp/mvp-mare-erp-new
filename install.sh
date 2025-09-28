#!/bin/bash

# Script de Instalação Automática do Maré ERP
# Testado em Ubuntu 22.04

set -e

echo "🚀 Iniciando instalação do Maré ERP..."

# Verificar se está rodando como root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Não execute este script como root (sudo)"
    exit 1
fi

# Função para verificar se um comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verificar Node.js
if ! command_exists node; then
    echo "❌ Node.js não encontrado. Instale Node.js 18+ primeiro."
    echo "   Visite: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js versão $NODE_VERSION encontrada. Versão 18+ necessária."
    exit 1
fi

echo "✅ Node.js $(node -v) encontrado"

# Verificar Docker
if ! command_exists docker; then
    echo "📦 Instalando Docker..."
    sudo apt update
    sudo apt install -y docker.io docker-compose
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker $USER
    echo "⚠️  Docker instalado. Você precisa fazer logout/login para usar Docker sem sudo."
    echo "   Ou execute: newgrp docker"
fi

echo "✅ Docker encontrado"

# Verificar se o Docker está rodando
if ! docker info >/dev/null 2>&1; then
    echo "🔄 Iniciando Docker..."
    sudo systemctl start docker
fi

# Instalar dependências do Node.js
echo "📦 Instalando dependências..."
npm install

# Verificar se PostgreSQL já está rodando
if docker ps | grep -q postgres; then
    echo "✅ PostgreSQL já está rodando"
else
    echo "🐘 Iniciando PostgreSQL..."
    docker run -d --name postgres-mare \
        -e POSTGRES_USER=mareuser \
        -e POSTGRES_PASSWORD=marepassword \
        -e POSTGRES_DB=mareerp_dev \
        -p 5432:5432 \
        postgres:14
    
    echo "⏳ Aguardando PostgreSQL inicializar..."
    sleep 10
fi

# Executar migrações
echo "🔄 Executando migrações do banco..."
npx prisma migrate dev --name init

# Popular banco com dados de teste
echo "🌱 Populando banco com dados de teste..."
npx tsx scripts/seed.ts

echo ""
echo "🎉 Instalação concluída com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Execute: npm run dev"
echo "   2. Acesse: http://localhost:3000"
echo "   3. Login: admin@teste.com / 123456"
echo ""
echo "🛑 Para parar:"
echo "   - Aplicação: Ctrl+C"
echo "   - PostgreSQL: docker stop postgres-mare"
echo ""
