'use client';

import React, { useMemo } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import withDragAndDrop, { EventInteractionArgs } from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { CalendarEvent } from '@/app/lib/definitions';

type CalendarDisplayEvent = Omit<CalendarEvent, 'start' | 'end'> & {
  start: Date;
  end: Date;
};

// 1. Definição das Props do Componente
interface CalendarViewProps {
  events: CalendarEvent[];
  onEventUpdate: (eventId: string, updates: { start: string; end: string }) => void;
  onSelectSlot: (slotInfo: { start: Date, end: Date }) => void;
  onSelectEvent: (event: CalendarEvent) => void;
  date: Date;
  view: View;
  onNavigate: (newDate: Date) => void;
  onView: (newView: View) => void;
}

// 2. O Componente Principal
const DnDCalendar = withDragAndDrop<CalendarDisplayEvent>(Calendar);

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
  const formattedEvents = useMemo<CalendarDisplayEvent[]>(() => {
    if (!events) return [];
    return events.map(event => ({
      ...event,
      start: new Date(event.start),
      end: new Date(event.end),
    }));
  }, [events]);

  const handleEventDrop = ({ event, start, end }: EventInteractionArgs<CalendarDisplayEvent>) => {
    const normalizedStart = typeof start === 'string' ? new Date(start) : start;
    const normalizedEnd = typeof end === 'string' ? new Date(end) : end;
    onEventUpdate(event.id, { start: normalizedStart.toISOString(), end: normalizedEnd.toISOString() });
  };

  const handleSelectEvent = (event: CalendarDisplayEvent) => {
    onSelectEvent({
      ...event,
      start: event.start.toISOString(),
      end: event.end.toISOString(),
    });
  };

  return (
    <div className="h-[70vh]">
      <DnDCalendar
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
