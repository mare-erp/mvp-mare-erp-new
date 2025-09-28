# 🚀 Guia de Instalação - Maré ERP

## ⚡ Instalação Rápida (Recomendada)

### 1. Pré-requisitos
- Node.js 18+ instalado
- Docker instalado
- VSCode (recomendado)

### 2. Comandos de Instalação

```bash
# 1. Extrair o projeto
unzip mare-erp-completo.zip
cd mare-erp-completo

# 2. Instalar dependências
npm install

# 3. Iniciar PostgreSQL com Docker
docker run -d --name postgres-mare -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres123 -e POSTGRES_DB=mareerp_dev -p 5432:5432 postgres:15

# 4. Aguardar 10 segundos para o banco inicializar
sleep 10

# 5. Aplicar migrações
npx prisma migrate dev --name init

# 6. Popular banco com dados iniciais
npx tsx scripts/seed.ts

# 7. Iniciar a aplicação
npm run dev
```

### 3. Acessar o Sistema
- URL: http://localhost:3000
- Email: admin@teste.com
- Senha: 123456

## 🔧 Configuração no VSCode

### Abrir o Projeto
```bash
# Abrir no VSCode
code .
```

### Extensões Recomendadas
Instale estas extensões no VSCode:
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- Prisma
- TypeScript Importer

## 🐛 Solução de Problemas

### Se o banco não conectar:
```bash
# Verificar se está rodando
docker ps

# Se não estiver, iniciar novamente
docker start postgres-mare
```

### Se der erro de migração:
```bash
# Reset completo (apaga dados)
npx prisma migrate reset
npx tsx scripts/seed.ts
```

### Se der erro de dependências:
```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

## ✅ Verificação Final

Após a instalação, você deve conseguir:
1. ✅ Acessar http://localhost:3000
2. ✅ Fazer login com admin@teste.com / 123456
3. ✅ Ver o dashboard com métricas
4. ✅ Navegar pelos módulos: Vendas, Clientes, Financeiro, Estoque
5. ✅ Acessar Configurações e ver as abas

## 🎯 Próximos Passos

1. **Personalizar a empresa** - Vá em Configurações > Empresa
2. **Adicionar usuários** - Vá em Configurações > Equipe
3. **Cadastrar produtos** - Vá em Estoque > Novo Produto
4. **Cadastrar clientes** - Vá em Clientes > Novo Cliente
5. **Criar pedidos** - Vá em Vendas > Novo Pedido

## 📞 Suporte

Se tiver problemas, verifique:
1. Node.js versão 18+: `node --version`
2. Docker funcionando: `docker --version`
3. PostgreSQL rodando: `docker ps | grep postgres`
4. Porta 3000 livre: `lsof -i :3000`

---

**Sistema pronto para uso! 🎉**
