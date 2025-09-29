-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('GESTOR', 'OPERADOR', 'VISUALIZADOR');

-- CreateEnum
CREATE TYPE "public"."RoleOrganizacao" AS ENUM ('ADMIN', 'GESTOR', 'OPERADOR', 'VISUALIZADOR');

-- CreateEnum
CREATE TYPE "public"."TipoPessoa" AS ENUM ('FISICA', 'JURIDICA');

-- CreateEnum
CREATE TYPE "public"."StatusPedido" AS ENUM ('ORCAMENTO', 'VENDIDO', 'RECUSADO', 'PENDENTE');

-- CreateEnum
CREATE TYPE "public"."TipoTransacao" AS ENUM ('RECEITA', 'DESPESA');

-- CreateEnum
CREATE TYPE "public"."StatusTransacao" AS ENUM ('PENDENTE', 'PAGA', 'ATRASADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "public"."TipoItem" AS ENUM ('PRODUTO', 'SERVICO');

-- CreateEnum
CREATE TYPE "public"."PeriodoRecorrencia" AS ENUM ('DIARIO', 'SEMANAL', 'QUINZENAL', 'MENSAL', 'BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL');

-- CreateEnum
CREATE TYPE "public"."StatusParcela" AS ENUM ('PENDENTE', 'PAGA', 'ATRASADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "public"."TipoMovimentacaoEstoque" AS ENUM ('ENTRADA', 'SAIDA', 'AJUSTE', 'TRANSFERENCIA', 'INVENTARIO');

-- CreateEnum
CREATE TYPE "public"."TipoComissao" AS ENUM ('FIXO', 'PERCENTUAL');

-- CreateEnum
CREATE TYPE "public"."TipoAcaoAuditoria" AS ENUM ('CRIACAO', 'EDICAO', 'EXCLUSAO', 'LOGIN', 'LOGOUT');

-- CreateTable
CREATE TABLE "public"."Organizacao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organizacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MembroOrganizacao" (
    "id" TEXT NOT NULL,
    "organizacaoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "role" "public"."RoleOrganizacao" NOT NULL DEFAULT 'VISUALIZADOR',
    "permissoes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MembroOrganizacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Empresa" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "cep" TEXT,
    "rua" TEXT,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "uf" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizacaoId" TEXT NOT NULL,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'VISUALIZADOR',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimoLogin" TIMESTAMP(3),
    "fotoPerfil" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Cliente" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipoPessoa" "public"."TipoPessoa" NOT NULL,
    "cpfCnpj" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "cep" TEXT,
    "rua" TEXT,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "uf" TEXT,
    "primeiraCompraConcluida" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "empresaId" TEXT NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Produto" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "public"."TipoItem" NOT NULL DEFAULT 'PRODUTO',
    "sku" TEXT,
    "descricao" TEXT,
    "preco" DECIMAL(65,30) NOT NULL,
    "quantidadeEstoque" INTEGER DEFAULT 0,
    "custo" DECIMAL(65,30) DEFAULT 0,
    "estoqueMinimo" INTEGER DEFAULT 0,
    "estoqueMaximo" INTEGER DEFAULT 0,
    "unidadeMedida" TEXT DEFAULT 'UN',
    "codigoBarras" TEXT,
    "ncm" TEXT,
    "peso" DECIMAL(65,30),
    "altura" DECIMAL(65,30),
    "largura" DECIMAL(65,30),
    "comprimento" DECIMAL(65,30),
    "forcarControleEstoque" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "empresaId" TEXT NOT NULL,

    CONSTRAINT "Produto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ComponenteProduto" (
    "id" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "componenteId" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,

    CONSTRAINT "ComponenteProduto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Pedido" (
    "id" TEXT NOT NULL,
    "numeroPedido" INTEGER NOT NULL,
    "status" "public"."StatusPedido" NOT NULL,
    "valorTotal" DECIMAL(65,30) NOT NULL,
    "dataPedido" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validadeOrcamento" TIMESTAMP(3),
    "dataEntrega" TIMESTAMP(3),
    "frete" DECIMAL(65,30) DEFAULT 0,
    "desconto" DECIMAL(65,30) DEFAULT 0,
    "informacoesNegociacao" TEXT,
    "observacoesNF" TEXT,
    "recorrencia" "public"."PeriodoRecorrencia",
    "dataFimRecorrencia" TIMESTAMP(3),
    "formaPagamento" TEXT,
    "banco" TEXT,
    "parcelas" INTEGER DEFAULT 1,
    "dataVencimento" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "empresaId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ItemPedido" (
    "id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "precoUnitario" DECIMAL(65,30) NOT NULL,
    "subtotal" DECIMAL(65,30) NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "produtoId" TEXT,

    CONSTRAINT "ItemPedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HistoricoPedido" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "descricao" TEXT NOT NULL,

    CONSTRAINT "HistoricoPedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Parcela" (
    "id" TEXT NOT NULL,
    "numeroParcela" INTEGER NOT NULL,
    "valor" DECIMAL(65,30) NOT NULL,
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "status" "public"."StatusParcela" NOT NULL DEFAULT 'PENDENTE',
    "pedidoId" TEXT,
    "transacaoId" TEXT,
    "contaPagarReceberId" TEXT,

    CONSTRAINT "Parcela_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TransacaoFinanceira" (
    "id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(65,30) NOT NULL,
    "tipo" "public"."TipoTransacao" NOT NULL,
    "status" "public"."StatusTransacao" NOT NULL DEFAULT 'PENDENTE',
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "dataPagamento" TIMESTAMP(3),
    "observacoes" TEXT,
    "categoria" TEXT,
    "empresaId" TEXT NOT NULL,
    "pedidoId" TEXT,
    "clienteId" TEXT,
    "contaBancariaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransacaoFinanceira_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContaPagarReceber" (
    "id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valorTotal" DECIMAL(65,30) NOT NULL,
    "tipo" "public"."TipoTransacao" NOT NULL,
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "status" "public"."StatusParcela" NOT NULL DEFAULT 'PENDENTE',
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContaPagarReceber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContaBancaria" (
    "id" TEXT NOT NULL,
    "nomeBanco" TEXT NOT NULL,
    "agencia" TEXT,
    "conta" TEXT,
    "tipoConta" TEXT DEFAULT 'CORRENTE',
    "saldo" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContaBancaria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FormaPagamento" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "custoFixo" DECIMAL(65,30) DEFAULT 0,
    "custoPercentual" DECIMAL(65,30) DEFAULT 0,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormaPagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MovimentacaoEstoque" (
    "id" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "tipo" "public"."TipoMovimentacaoEstoque" NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacao" TEXT,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MovimentacaoEstoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Imposto" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "aliquota" DECIMAL(65,30) NOT NULL,
    "dataVigencia" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Imposto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ConfiguracaoSistema" (
    "id" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "descricao" TEXT,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracaoSistema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Comissao" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "valor" DECIMAL(65,30) NOT NULL,
    "tipo" "public"."TipoComissao" NOT NULL,
    "paga" BOOLEAN NOT NULL DEFAULT false,
    "dataPagamento" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comissao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LogAuditoria" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "acao" "public"."TipoAcaoAuditoria" NOT NULL,
    "tabela" TEXT,
    "registroId" TEXT,
    "dadosAntigos" TEXT,
    "dadosNovos" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogAuditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MembroOrganizacao_organizacaoId_usuarioId_key" ON "public"."MembroOrganizacao"("organizacaoId", "usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_cnpj_key" ON "public"."Empresa"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "public"."Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_empresaId_cpfCnpj_key" ON "public"."Cliente"("empresaId", "cpfCnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Produto_empresaId_sku_key" ON "public"."Produto"("empresaId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "ComponenteProduto_produtoId_componenteId_key" ON "public"."ComponenteProduto"("produtoId", "componenteId");

-- CreateIndex
CREATE UNIQUE INDEX "Pedido_empresaId_numeroPedido_key" ON "public"."Pedido"("empresaId", "numeroPedido");

-- CreateIndex
CREATE UNIQUE INDEX "Parcela_transacaoId_key" ON "public"."Parcela"("transacaoId");

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracaoSistema_empresaId_chave_key" ON "public"."ConfiguracaoSistema"("empresaId", "chave");

-- AddForeignKey
ALTER TABLE "public"."MembroOrganizacao" ADD CONSTRAINT "MembroOrganizacao_organizacaoId_fkey" FOREIGN KEY ("organizacaoId") REFERENCES "public"."Organizacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MembroOrganizacao" ADD CONSTRAINT "MembroOrganizacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Empresa" ADD CONSTRAINT "Empresa_organizacaoId_fkey" FOREIGN KEY ("organizacaoId") REFERENCES "public"."Organizacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Cliente" ADD CONSTRAINT "Cliente_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Produto" ADD CONSTRAINT "Produto_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComponenteProduto" ADD CONSTRAINT "ComponenteProduto_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "public"."Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComponenteProduto" ADD CONSTRAINT "ComponenteProduto_componenteId_fkey" FOREIGN KEY ("componenteId") REFERENCES "public"."Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Pedido" ADD CONSTRAINT "Pedido_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Pedido" ADD CONSTRAINT "Pedido_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Pedido" ADD CONSTRAINT "Pedido_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ItemPedido" ADD CONSTRAINT "ItemPedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "public"."Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ItemPedido" ADD CONSTRAINT "ItemPedido_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "public"."Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HistoricoPedido" ADD CONSTRAINT "HistoricoPedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "public"."Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Parcela" ADD CONSTRAINT "Parcela_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "public"."Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Parcela" ADD CONSTRAINT "Parcela_transacaoId_fkey" FOREIGN KEY ("transacaoId") REFERENCES "public"."TransacaoFinanceira"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Parcela" ADD CONSTRAINT "Parcela_contaPagarReceberId_fkey" FOREIGN KEY ("contaPagarReceberId") REFERENCES "public"."ContaPagarReceber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TransacaoFinanceira" ADD CONSTRAINT "TransacaoFinanceira_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TransacaoFinanceira" ADD CONSTRAINT "TransacaoFinanceira_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "public"."Pedido"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TransacaoFinanceira" ADD CONSTRAINT "TransacaoFinanceira_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TransacaoFinanceira" ADD CONSTRAINT "TransacaoFinanceira_contaBancariaId_fkey" FOREIGN KEY ("contaBancariaId") REFERENCES "public"."ContaBancaria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContaPagarReceber" ADD CONSTRAINT "ContaPagarReceber_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContaBancaria" ADD CONSTRAINT "ContaBancaria_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FormaPagamento" ADD CONSTRAINT "FormaPagamento_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MovimentacaoEstoque" ADD CONSTRAINT "MovimentacaoEstoque_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "public"."Produto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MovimentacaoEstoque" ADD CONSTRAINT "MovimentacaoEstoque_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Imposto" ADD CONSTRAINT "Imposto_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConfiguracaoSistema" ADD CONSTRAINT "ConfiguracaoSistema_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comissao" ADD CONSTRAINT "Comissao_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "public"."Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LogAuditoria" ADD CONSTRAINT "LogAuditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LogAuditoria" ADD CONSTRAINT "LogAuditoria_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
