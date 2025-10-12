// Este arquivo conterá tipos de dados que usamos em várias partes do sistema.

export type User = {
    id: string;
    nome: string | null;
    email: string;
};

export type Cliente = {
    id: string;
    nome: string;
    tipoPessoa: 'FISICA' | 'JURIDICA';
    cpfCnpj: string;
    email: string | null;
    telefone: string | null;
    endereco: string | null;
    empresaId: string;
};

// --- Tipos para o Módulo de Calendário ---

export type KanbanStage = {
  id: string;
  nome: string;
  ordem: number;
};

export type CalendarUser = {
  id: string;
  nome: string;
};

export type CalendarPedido = {
  id: string;
  numeroPedido: number;
};

export type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay?: boolean;
  description?: string | null;
  stageId: string | null;
  pedidoId: string | null;
  userId: string;
  // Relacionamentos aninhados que vêm da API
  user: { nome: string };
  stage: { nome: string } | null;
};

 