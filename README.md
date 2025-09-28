# Maré ERP - Sistema de Gestão Empresarial

## 🚀 Instalação Rápida (Recomendada)

### Opção 1: Script Automático
```bash
./install.sh
```

### Opção 2: Instalação Manual

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Iniciar PostgreSQL:**
   ```bash
   docker run -d --name postgres-mare \
     -e POSTGRES_USER=mareuser \
     -e POSTGRES_PASSWORD=marepassword \
     -e POSTGRES_DB=mareerp_dev \
     -p 5432:5432 \
     postgres:14
   ```

3. **Executar migrações:**
   ```bash
   npx prisma migrate dev --name init
   ```

4. **Popular banco com dados de teste:**
   ```bash
   npx tsx scripts/seed.ts
   ```

5. **Iniciar aplicação:**
   ```bash
   npm run dev
   ```

## 🔑 Acesso ao Sistema

- **URL:** http://localhost:3000
- **Email:** admin@teste.com
- **Senha:** 123456

## ✅ Funcionalidades Testadas

- ✅ Login e autenticação
- ✅ Dashboard com métricas
- ✅ Módulo de vendas completo
- ✅ Módulo de clientes completo
- ✅ Banco de dados PostgreSQL
- ✅ APIs funcionais

## 🛠️ Comandos Úteis

```bash
# Parar PostgreSQL
docker stop postgres-mare

# Ver logs do banco
docker logs postgres-mare

# Resetar banco (CUIDADO: apaga dados)
npx prisma migrate reset

# Visualizar banco
npx prisma studio
```

## 📋 Pré-requisitos

- Node.js 18+
- Docker
- 2GB RAM livre
- Porta 3000 e 5432 disponíveis

---

**Sistema testado e funcionando em Ubuntu 22.04**