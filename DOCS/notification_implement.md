# Notificação – Ideias de Implementação

## 1. Escopo Inicial
- **Alertas de sistema**: erros de integração, falhas de sincronização, expiração de assinatura.
- **Eventos operacionais**: novo pedido, status alterado, estoque baixo, transação financeira vencendo.
- **Comunicações internas**: mensagens entre membros da organização, aprovações pendentes.

## 2. Modelo de Dados
- `Notificacao` (id, titulo, descricao, tipo, lidoEm, criadoEm, usuarioId, empresaId?, payload JSON).
- `PreferenciasNotificacao` por usuário (canais habilitados, frequência, categorias).

## 3. APIs (Next.js /api)
- `GET /api/notificacoes` – listar notificações (filtros: lidas, tipo, data).
- `POST /api/notificacoes` – criar notificação (usado internamente por outros módulos).
- `PATCH /api/notificacoes/:id` – marcar como lida/arquivar.
- `DELETE /api/notificacoes/:id` – remover (opcional).

## 4. Emissão de Notificações
- **Hooks internos**: funções chamadas após eventos (ex.: `onPedidoCriado`, `onEstoqueBaixo`) que criam notificações.
- **Scheduler/cron**: verificar vencimentos ou estoques diariamente.
- **Integrações futuras**: webhooks externos para alimentar o ERP gerando notificações internas.

## 5. Entrega e Exibição
- **Bell no Header**: dropdown com últimos X itens, contador em real-time (via polling, SSE ou websockets).
- **Página dedicada**: `/dashboard/notificacoes` com filtros e paginação.
- **Badges contextuais**: indicadores nos módulos (ex.: Financeiro mostrando “3 contas vencendo”).

## 6. Canais Opcionalmente Suportados
- **In-app (default)**: armazenamento no banco + UI.
- **E-mail**: envio diário ou instantâneo dependendo do tipo.
- **Push/Web Push**: integração futura com FCM ou Web Push API.
- **Integradores externos**: Slack/Teams para alertas críticos (plano avançado).

## 7. UX/Configs
- Preferências por usuário: ativar/desativar categorias, frequência de email, canal preferido.
- Configurações por organização: limites de retenção, regras de notificação de estoque.
- Agrupamento de eventos similares (ex.: “5 pedidos aguardando aprovação”).

## 8. Checklist Técnico
- Criar tabela `Notificacao` e migração Prisma.
- Helpers de criação (ex.: `createNotification({ userId, type, ... })`).
- Guardar contexto multi-tenant (`empresaId`, `organizacaoId`) para isolar dados.
- Middleware para marcar como lida ao visualizar.
- Integração com autenticação existente (usar `context.userId` no `withAuth`).

## 9. Roadmap Sugerido
1. MVP: in-app feed (API + dropdown + página).
2. Preferências do usuário + filtros avançados.
3. Notificações críticas por e-mail.
4. Push/tempo real (SSE/WebSocket) e integrações externas.
