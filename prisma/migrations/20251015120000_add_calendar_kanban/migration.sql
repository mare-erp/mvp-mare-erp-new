-- CreateTable for KanbanStage
CREATE TABLE "public"."KanbanStage" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "capacidade" INTEGER NOT NULL DEFAULT 40,
    "organizacaoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "KanbanStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable for CalendarEvent
CREATE TABLE "public"."CalendarEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "recurrence" "public"."PeriodoRecorrencia",
    "organizacaoId" TEXT NOT NULL,
    "stageId" TEXT,
    "pedidoId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- Indexes for KanbanStage
CREATE UNIQUE INDEX "KanbanStage_organizacaoId_nome_key" ON "public"."KanbanStage"("organizacaoId", "nome");
CREATE INDEX "KanbanStage_organizacaoId_ordem_idx" ON "public"."KanbanStage"("organizacaoId", "ordem");

-- Indexes for CalendarEvent
CREATE INDEX "CalendarEvent_organizacaoId_start_end_idx" ON "public"."CalendarEvent"("organizacaoId", "start", "end");
CREATE INDEX "CalendarEvent_stageId_idx" ON "public"."CalendarEvent"("stageId");
CREATE INDEX "CalendarEvent_pedidoId_idx" ON "public"."CalendarEvent"("pedidoId");
CREATE INDEX "CalendarEvent_userId_idx" ON "public"."CalendarEvent"("userId");

-- Foreign keys
ALTER TABLE "public"."KanbanStage"
ADD CONSTRAINT "KanbanStage_organizacaoId_fkey"
FOREIGN KEY ("organizacaoId") REFERENCES "public"."Organizacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."CalendarEvent"
ADD CONSTRAINT "CalendarEvent_organizacaoId_fkey"
FOREIGN KEY ("organizacaoId") REFERENCES "public"."Organizacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."CalendarEvent"
ADD CONSTRAINT "CalendarEvent_stageId_fkey"
FOREIGN KEY ("stageId") REFERENCES "public"."KanbanStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."CalendarEvent"
ADD CONSTRAINT "CalendarEvent_pedidoId_fkey"
FOREIGN KEY ("pedidoId") REFERENCES "public"."Pedido"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."CalendarEvent"
ADD CONSTRAINT "CalendarEvent_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "public"."Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
