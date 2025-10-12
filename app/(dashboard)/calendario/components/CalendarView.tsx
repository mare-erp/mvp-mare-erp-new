'use client';

import React from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { CalendarEvent } from '@/app/lib/definitions';

// 1. Definição das Props do Componente
interface CalendarViewProps {
  events: CalendarEvent[];
  onEventUpdate: (eventId: string, updates: { start: Date, end: Date }) => void;
  onSelectSlot: (slotInfo: { start: Date, end: Date }) => void;
  onSelectEvent: (event: CalendarEvent) => void;
  date: Date;
  view: View;
  onNavigate: (newDate: Date) => void;
  onView: (newView: View) => void;
}

// 2. O Componente Principal
const CalendarView: React.FC<CalendarViewProps> = ({ 
  events, 
  onEventUpdate, 
  onSelectSlot, 
  onSelectEvent, 
  date, 
  view, 
  onNavigate, 
  onView 
}) => {

  // 3. Configuração do Localizer para date-fns em Português (movido para dentro do componente)
  const locales = { 'pt-BR': ptBR };
  const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { locale: ptBR }),
    getDay,
    locales,
  });

  // 4. Função Auxiliar para formatar os eventos (movido para dentro do componente)
  const formatEventsForCalendar = (events: CalendarEvent[]) => {
    if (!events) return [];
    return events.map(event => ({
      ...event,
      start: new Date(event.start),
      end: new Date(event.end),
    }));
  };

  const formattedEvents = formatEventsForCalendar(events);

  const handleEventDrop = (data: any) => {
    const { event, start, end } = data;
    onEventUpdate(event.id, { start, end });
  };

  const handleSelectEvent = (event: any) => {
    onSelectEvent(event as CalendarEvent);
  }

  return (
    <div className="h-[70vh]">
      <Calendar
        localizer={localizer}
        events={formattedEvents}
        startAccessor="start"
        endAccessor="end"
        culture="pt-BR"
        style={{ flex: 1 }}
        date={date}
        view={view}
        onNavigate={onNavigate}
        onView={onView}
        onEventDrop={handleEventDrop}
        onEventResize={handleEventDrop}
        selectable
        onSelectSlot={onSelectSlot}
        onSelectEvent={handleSelectEvent}
        messages={{
          next: "Próximo",
          previous: "Anterior",
          today: "Hoje",
          month: "Mês",
          week: "Semana",
          day: "Dia",
          agenda: "Agenda",
          date: "Data",
          time: "Hora",
          event: "Evento",
          noEventsInRange: "Não há eventos neste período.",
          showMore: total => `+ Ver mais (${total})`
        }}
      />
    </div>
  );
};

export default React.memo(CalendarView);