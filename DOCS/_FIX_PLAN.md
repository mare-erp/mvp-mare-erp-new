# Maré ERP — Plano Imediato de Correções

Este plano consolida os problemas críticos identificados na aplicação e na documentação. As etapas abaixo devem ser executadas em sequência para estabilizar o ambiente multi-tenant, restaurar o fluxo de autenticação e alinhar o backlog.

## 1. Corrigir Autenticação e Guardião de Rotas

- **Unificar helpers de auth:** substituir todas as importações de `@/app/lib/verifyAuth` por `@/app/lib/auth` ou recriar o helper faltante; hoje os imports quebram o build.
- **Resolver o conflito no middleware:** em `app/lib/auth.ts:247` o identificador `hasPermission` chama a própria função de escopo, gerando `ReferenceError`. Renomear para algo como `const allowed = checkPermission(...)` e usar a função correta.
- **Restaurar `/api/auth/me`:** importar o Prisma client (`import { prisma } from '@/app/lib/prisma'`) e garantir que a rota esteja coberta pelo middleware corrigido.

## 2. Alinhar `Pedido.validadeOrcamento`

- **Tomar decisão:** remover a coluna (como diz `docs/CORREÇÕES_IMPLEMENTADAS.md:15`) ou mantê-la oficialmente.
- **Se remover:** criar nova migração Prisma que dropa o campo, atualizar schema, seed, rotas (`app/api/pedidos*.ts`) e componentes (`pedidoModal.tsx`).
- **Se manter:** atualizar toda a documentação citada, garantir migração consistente, e revisar endpoints/pdfs para evitar que consultas falhem quando o campo estiver ausente.

## 3. Reintegrar Contexto de Autenticação e Seletor de Empresa

- **Envolver o dashboard com `AuthProvider`:** aplicar o provider em `app/layout.tsx` e passar `usuario/organizacao` reais para `Header`.
- **Sincronizar empresa selecionada:** adaptar `Header` e `CompanySelector` para chamar um endpoint de “switch company” que reemite o JWT; remover a dependência exclusiva de `localStorage`.
- **Remover IDs fixos:** nas rotas `app/api/clientes/quick-create/route.ts` e `app/api/produtos/quick-create/route.ts` usar `context.empresaId` proveniente do token.

## 4. Ajustes Complementares

- **Deleção de membros:** corrigir `app/api/membros/route.ts` para não tentar deletar via `/api/membros` raiz; delegar ao handler `[id]`.
- **Documentação:** atualizar `docs/CORREÇÕES_IMPLEMENTADAS.md` e `docs/FUNCIONALIDADES_E_PROBLEMAS.md` conforme as decisões acima, mantendo a “fonte da verdade”.
- **Testes e regressões:** após as correções, criar smoke tests para login, troca de empresa e criação rápida de clientes/produtos para evitar novas divergências.

> Assim que estes itens forem concluídos, revisar `PRIORITY_FIXES.md` e mover tarefas resolvidas para uma seção de concluídos, mantendo o backlog limpo.

## Perguntas em Aberto

- **`Pedido.validadeOrcamento`:** manter ou remover de vez? Se manter, quais regras de negócio/documentação precisam refletir o campo?
- **Troca de empresa:** o seletor deve provocar reload completo ou basta invalidar caches? Como garantir que consultas client-side respeitam o novo tenant?
- **Transporte do token:** seguimos apenas com cookies `HttpOnly` ou suportamos cabeçalho `Authorization`? Como evitar ambiguidades em ambientes híbridos?
- **Permissões do `OPERADOR`:** onde versionamos a matriz de permissões granular (banco, JSON, código)? Existe necessidade de UI para edição?
- **Contas e transferências no Financeiro:** modelamos saldo derivado ou armazenado? Há suporte a múltiplas moedas?
- **Headers de segurança e CSP:** quais terceiros (fonts, scripts) precisam ser liberados antes de travar política estrita?
- **Retenção de dados e logs:** quais campos precisam anonimização/mascara? Qual o tempo máximo de retenção previsto contratualmente?
- **Template de PDF e numeração de pedidos:** o layout atual é definitivo? A sequência `numeroPedido` é global ou por empresa?
- **Helpers de autenticação:** padronizamos tudo em `app/lib/auth.ts` ou reintroduzimos um `verifyAuth` separado? Há cenários onde um helper simplificado faz sentido?
- **Endpoints “quick-create”:** permanecem como atalhos? Se sim, qual fluxo deve alimentar o `empresaId` e quais validações mínimas são aceitáveis?

## Achados recentes (2025-??-??)

- `app/api/auth/me/route.ts:2` e `app/api/organizacoes/route.ts:3` continuam importando `@/app/lib/verifyAuth`, arquivo inexistente, derrubando build/runtime; `DOCS/CORREÇÕES_IMPLEMENTADAS.md:27-32` e `README.md:48-55` afirmam que autenticação e APIs estão “corrigidas”, então a documentação precisa refletir o bloqueio enquanto o helper não for recriado ou substituído por `app/lib/auth.ts`.
- `DOCS/CORREÇÕES_IMPLEMENTADAS.md:15` registra a remoção de `Pedido.validadeOrcamento`, porém o campo segue em `prisma/schema.prisma:256` e é usado por endpoints como `app/api/pedidos/[id]/pdf/route.ts:53-79`. Ajustar docs ou remover o campo/migração conforme a decisão do item 2.
- `app/api/auth/signup/route.ts:40-67` ainda referencia `Organizacao.adminId`, coluna ausente no schema atual (`prisma/schema.prisma:97-108`), impedindo o cadastro; esse gap não aparece em nenhuma documentação.
- `DOCS/FUNCIONALIDADES_E_PROBLEMAS.md:14-21` lista clonagem/PDF na página de vendas, mas `app/(dashboard)/vendas/page.tsx:69-133` só renderiza tabela estática sem ações – alinhar release notes com a UI entregue ou completar a funcionalidade.
- `DOCS/INSTALACAO.md:81-88` garante login e métricas no dashboard, porém o fluxo quebra pelos pontos acima e o dashboard segue com cards estáticos (`app/(dashboard)/page.tsx:31-57`). Documentar os blockers até que as correções sejam aplicadas.
