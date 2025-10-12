'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { View } from 'react-big-calendar';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns';
import { CalendarEvent, KanbanStage, CalendarUser as User, CalendarPedido as Pedido } from '@/app/lib/definitions';
import StatCard from '@/app/components/ui/StatCard';
import { ListChecks, Clock, CheckCircle, Calendar as CalendarIcon } from 'lucide-react';

// Dynamic Imports
const Toolbar = dynamic(() => import('./components/Toolbar'));
const EventDialog = dynamic(() => import('./components/EventDialog'), { ssr: false });
const CalendarView = dynamic(() => import('@/app/(dashboard)/calendario/components/CalendarView'), { ssr: false, loading: () => <p>Carregando Calendário...</p> });
const KanbanView = dynamic(() => import('@/app/(dashboard)/calendario/components/KanbanView'), { ssr: false, loading: () => <p>Carregando Kanban...</p> });
const ListView = dynamic(() => import('@/app/(dashboard)/calendario/components/ListView'), { ssr: false, loading: () => <p>Carregando Lista...</p> });

// Types
type ViewMode = 'calendar' | 'kanban' | 'list';
type EventFiltro = 'todos' | 'pendentes' | 'concluidas';

interface CalendarSummary {
  total: number;
  pendentes: number;
  concluidas: number;
  tempoPrevisto: number;
}

export default function CalendarioPage() {
  // States
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [summary, setSummary] = useState<CalendarSummary | null>(null);
  const [stages, setStages] = useState<KanbanStage[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Partial<CalendarEvent> | null>(null);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<View>('month');
  const [filtro, setFiltro] = useState<EventFiltro>('todos');

  // Data Fetching
  const getVisibleDateRange = useCallback((date: Date, view: View) => {
    switch (view) {
      case 'month': return { start: startOfMonth(date), end: endOfMonth(date) };
      case 'week': return { start: startOfWeek(date), end: endOfWeek(date) };
      default: return { start: startOfDay(date), end: endOfDay(date) };
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    const { start, end } = getVisibleDateRange(calendarDate, calendarView);
    let apiUrl = `/api/calendario?start=${start.toISOString()}&end=${end.toISOString()}`;
    if (selectedUserId !== 'all') apiUrl += `&userId=${selectedUserId}`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Falha ao buscar eventos.');
      const eventsData = await response.json();
      setEvents(eventsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar eventos');
    }
  }, [calendarDate, calendarView, selectedUserId, getVisibleDateRange]);

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [stagesRes, usersRes, pedidosRes, summaryRes] = await Promise.all([
        fetch('/api/kanban/stages'),
        fetch('/api/usuarios'),
        fetch('/api/pedidos'),
        fetch('/api/calendario/summary'),
      ]);
      if (!stagesRes.ok || !usersRes.ok || !pedidosRes.ok || !summaryRes.ok) throw new Error('Falha ao buscar dados iniciais.');
      
      const stagesData = await stagesRes.json();
      setStages(stagesData.sort((a: KanbanStage, b: KanbanStage) => a.ordem - b.ordem));
      setUsers(await usersRes.json());
      setPedidos(await pedidosRes.json());
      setSummary(await summaryRes.json());
      
      await fetchEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro');
    } finally {
      setLoading(false);
    }
  }, [fetchEvents]);

  useEffect(() => { fetchInitialData(); }, [fetchInitialData]);

  useEffect(() => { if (!loading) fetchEvents(); }, [loading, fetchEvents]);

  const handleResetFilters = () => {
    setFiltro('todos');
    setSelectedUserId('all');
  };

  const completedStageId = useMemo(() => stages.length > 0 ? stages[stages.length - 1].id : null, [stages]);

  const filteredEvents = useMemo(() => {
    if (filtro === 'todos') return events;
    if (filtro === 'pendentes') return events.filter(e => e.stageId !== completedStageId);
    if (filtro === 'concluidas') return events.filter(e => e.stageId === completedStageId);
    return events;
  }, [events, filtro, completedStageId]);

  // Handlers
  const handleEventUpdate = async (eventId: string, updates: Partial<CalendarEvent>) => {
    setEvents(prev => prev.map(e => (e.id === eventId ? { ...e, ...updates } : e)));
    try {
      await fetch(`/api/calendario/${eventId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar evento.');
      fetchEvents();
    }
  };

  const handleSaveEvent = async (eventData: Partial<CalendarEvent>) => {
    const isNew = !eventData.id;
    const url = isNew ? '/api/calendario' : `/api/calendario/${eventData.id}`;
    const method = isNew ? 'POST' : 'PUT';
    try {
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(eventData) });
      if (!response.ok) throw new Error('Falha ao salvar o evento.');
      await fetchInitialData();
      setIsDialogOpen(false);
      setEditingEvent(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar evento.');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm('Tem certeza?')) return;
    try {
      await fetch(`/api/calendario/${eventId}`, { method: 'DELETE' });
      await fetchInitialData();
    } catch (err) { setError(err instanceof Error ? err.message : 'Erro ao excluir'); }
  };

  const handleCloneEvent = async (eventId: string) => {
    try {
      await fetch(`/api/calendario/${eventId}/clone`, { method: 'POST' });
      await fetchInitialData();
    } catch (err) { setError(err instanceof Error ? err.message : 'Erro ao clonar'); }
  };

  if (isLoading) return <div className="p-6">Carregando...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      <Toolbar viewMode={viewMode} onViewModeChange={setViewMode} users={users} selectedUserId={selectedUserId} onSelectedUserIdChange={setSelectedUserId} onAddTask={() => setIsDialogOpen(true)} onResetFilters={handleResetFilters} />

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total de Tarefas" value={summary.total.toString()} icon={<ListChecks />} color="blue" onClick={() => setFiltro('todos')} isActive={filtro === 'todos'} />
          <StatCard title="Pendentes" value={summary.pendentes.toString()} icon={<CalendarIcon />} color="yellow" onClick={() => setFiltro('pendentes')} isActive={filtro === 'pendentes'} />
          <StatCard title="Concluídas" value={summary.concluidas.toString()} icon={<CheckCircle />} color="green" onClick={() => setFiltro('concluidas')} isActive={filtro === 'concluidas'} />
          <StatCard title="Tempo Previsto (h)" value={summary.tempoPrevisto.toFixed(2)} icon={<Clock />} color="purple" />
        </div>
      )}

      <div className="bg-white p-4 rounded-lg shadow-inner border">
        {viewMode === 'calendar' && <CalendarView events={filteredEvents} onEventUpdate={handleEventUpdate} onSelectEvent={(e) => { setEditingEvent(e); setIsDialogOpen(true); }} onSelectSlot={(slot) => { setEditingEvent({ start: slot.start.toISOString(), end: slot.end.toISOString() }); setIsDialogOpen(true); }} date={calendarDate} view={calendarView} onNavigate={setCalendarDate} onView={setCalendarView} />} 
        {viewMode === 'kanban' && <KanbanView events={filteredEvents} stages={stages} onEventUpdate={handleEventUpdate} onStageCreate={async (name) => { await fetch('/api/kanban/stages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: name, ordem: stages.length }) }); await fetchInitialData(); }} onStageUpdate={async (id, data) => { await fetch(`/api/kanban/stages/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); await fetchInitialData(); }} onStageDelete={async (id) => { if(confirm('Certeza?')) { await fetch(`/api/kanban/stages/${id}`, { method: 'DELETE' }); await fetchInitialData(); } }} />} 
        {viewMode === 'list' && <ListView events={filteredEvents} onEdit={(e) => { setEditingEvent(e); setIsDialogOpen(true); }} onDelete={handleDeleteEvent} onClone={handleCloneEvent} />} 
      </div>

      {isDialogOpen && <EventDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} onSave={handleSaveEvent} eventData={editingEvent} stages={stages} pedidos={pedidos} />} 
    </div>
  );
}