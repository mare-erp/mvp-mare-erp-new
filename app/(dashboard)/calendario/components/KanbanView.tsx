'use client';

import React, { useState, useMemo } from 'react';
import { DndContext, DragEndEvent, DragOverEvent, DragOverlay, DropAnimation, defaultDropAnimation, KeyboardSensor, MouseSensor, TouchSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CalendarEvent, KanbanStage } from '@/app/lib/definitions';
import { Clock, Inbox } from 'lucide-react';

// --- Task Card Component ---
const TaskCard = ({ event }: { event: CalendarEvent }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: event.id, data: { type: 'card', event } });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="bg-white p-3 mb-3 rounded-md shadow-sm border">
      <p className="font-medium text-sm text-gray-800">{event.title}</p>
    </div>
  );
};

// --- Kanban Column Component ---
const KanbanColumn = ({ stage, events, onStageUpdate, onStageDelete, isVirtual = false }: { stage: KanbanStage; events: CalendarEvent[]; onStageUpdate?: (id: string, data: Partial<KanbanStage>) => void; onStageDelete?: (id: string) => void; isVirtual?: boolean; }) => {
  const { setNodeRef } = useSortable({ id: stage.id, data: { type: 'column' } });
  const [isEditing, setIsEditing] = useState(false);
  const [stageName, setStageName] = useState(stage.nome);
  const [stageCapacity, setStageCapacity] = useState(stage.capacidade);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const usedCapacity = useMemo(() => events.reduce((acc, event) => acc + ((new Date(event.end).getTime() - new Date(event.start).getTime()) / (1000 * 60 * 60)), 0), [events]);

  const handleUpdate = () => {
    if (!isVirtual && onStageUpdate && (stageName.trim() !== stage.nome || stageCapacity !== stage.capacidade)) {
      onStageUpdate(stage.id, { nome: stageName.trim(), capacidade: Number(stageCapacity) });
    }
    setIsEditing(false);
  };

  return (
    <div ref={setNodeRef} className="bg-gray-50 rounded-lg p-3 w-80 flex-shrink-0 border">
      <div className="flex justify-between items-center mb-2 px-1">
        {!isEditing ? (
          <h3 className={`font-semibold text-gray-700 ${!isVirtual && 'cursor-pointer'}`} onClick={() => !isVirtual && setIsEditing(true)}>{stage.nome}</h3>
        ) : (
          <input type="text" value={stageName} onChange={(e) => setStageName(e.target.value)} onBlur={handleUpdate} onKeyDown={(e) => e.key === 'Enter' && handleUpdate()} className="font-semibold bg-white border border-blue-500 rounded px-1 w-full" autoFocus />
        )}
        {!isVirtual && (
          <div className="relative">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1 rounded-full hover:bg-gray-200">...</button>
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10 ring-1 ring-black ring-opacity-5">
                <a href="#" onClick={(e) => { e.preventDefault(); setIsEditing(true); setIsMenuOpen(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Editar</a>
                <a href="#" onClick={(e) => { e.preventDefault(); onStageDelete?.(stage.id); }} className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Excluir</a>
              </div>
            )}
          </div>
        )}
      </div>
      {isEditing && (
          <div className="mb-2"><label className="text-xs text-gray-500">Capacidade (horas)</label><input type="number" value={stageCapacity} onChange={(e) => setStageCapacity(Number(e.target.value))} onBlur={handleUpdate} onKeyDown={(e) => e.key === 'Enter' && handleUpdate()} className="text-sm bg-white border rounded px-1 w-full mt-1" /></div>
      )}
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3 px-1">
        <Clock className="w-4 h-4" />
        <span>{usedCapacity.toFixed(1)}h / {stage.capacidade}h</span>
        <div className="w-full bg-gray-200 rounded-full h-1.5"><div className="h-1.5 rounded-full" style={{ width: `${Math.min((usedCapacity / stage.capacidade) * 100, 100)}%`, backgroundColor: usedCapacity > stage.capacidade ? '#ef4444' : '#3b82f6' }}></div></div>
      </div>
      <SortableContext items={events.map(e => e.id)}><div className="flex flex-col min-h-[100px]">{events.map(event => <TaskCard key={event.id} event={event} />)}</div></SortableContext>
    </div>
  );
};

// --- Main Kanban View Component ---
interface KanbanViewProps { events: CalendarEvent[]; stages: KanbanStage[]; onEventUpdate: (eventId: string, updates: Partial<CalendarEvent>) => void; onStageCreate: (stageName: string) => void; onStageUpdate: (stageId: string, data: Partial<KanbanStage>) => void; onStageDelete: (stageId: string) => void; }

const KanbanView: React.FC<KanbanViewProps> = ({ events, stages, onEventUpdate, onStageCreate, onStageUpdate, onStageDelete }) => {
  const [newStageName, setNewStageName] = useState('');
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);

  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 5 } }), useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }), useSensor(KeyboardSensor));

  const { eventsByStage, uncategorizedEvents } = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    stages.forEach(stage => map.set(stage.id, []));
    const uncategorized: CalendarEvent[] = [];
    events.forEach(event => {
      if (event.stageId && map.has(event.stageId)) map.get(event.stageId)!.push(event);
      else uncategorized.push(event);
    });
    return { eventsByStage: map, uncategorizedEvents: uncategorized };
  }, [events, stages]);

  const handleDragStart = (event: any) => { if (event.active.data.current?.type === 'card') setActiveEvent(event.active.data.current.event); };
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    if (active.data.current?.type !== 'card') return;
    const overIsColumn = over.data.current?.type === 'column';
    const overIsCard = over.data.current?.type === 'card';
    if (!overIsColumn && !overIsCard) return;
    const overStageId = overIsColumn ? over.id as string : over.data.current?.event.stageId;
    const activeStageId = active.data.current?.event.stageId;
    if (activeStageId !== overStageId) onEventUpdate(active.id as string, { stageId: overStageId });
  };
  const handleDragEnd = () => setActiveEvent(null);

  const uncategorizedStage: KanbanStage = { id: 'uncategorized', nome: 'Sem Categoria', capacidade: uncategorizedEvents.reduce((acc, event) => acc + ((new Date(event.end).getTime() - new Date(event.start).getTime()) / (1000 * 60 * 60)), 0), createdAt: new Date(), updatedAt: new Date(), ordem: -1, organizacaoId: '' };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className="flex space-x-4 overflow-x-auto pb-4 h-full">
        {uncategorizedEvents.length > 0 && <KanbanColumn key="uncategorized" stage={uncategorizedStage} events={uncategorizedEvents} isVirtual={true} />}
        {stages.map(stage => <KanbanColumn key={stage.id} stage={stage} events={eventsByStage.get(stage.id) || []} onStageUpdate={onStageUpdate} onStageDelete={onStageDelete} />)}
        <div className="bg-gray-100 rounded-lg p-3 w-72 flex-shrink-0 h-fit"><input type="text" value={newStageName} onChange={(e) => setNewStageName(e.target.value)} placeholder="+ Adicionar nova etapa" className="w-full p-2 border-2 border-dashed rounded-md" onKeyDown={(e) => e.key === 'Enter' && onStageCreate(newStageName)} /><button onClick={() => onStageCreate(newStageName)} className="mt-2 w-full btn-primary">Criar Etapa</button></div>
      </div>
      <DragOverlay dropAnimation={defaultDropAnimation}>{activeEvent ? <TaskCard event={activeEvent} /> : null}</DragOverlay>
    </DndContext>
  );
};

export default React.memo(KanbanView);