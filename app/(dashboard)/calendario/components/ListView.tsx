'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MoreVertical } from 'lucide-react';
import { CalendarEvent } from '@/app/lib/definitions';

interface ListViewProps {
  events: CalendarEvent[];
  onEdit: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => void;
  onClone: (eventId: string) => void;
}

const ListView: React.FC<ListViewProps> = ({ events, onEdit, onDelete, onClone }) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  if (events.length === 0) {
    return <div className="text-center text-gray-500 py-10">Nenhuma tarefa encontrada.</div>;
  }

  const toggleMenu = (eventId: string) => {
    setOpenMenuId(openMenuId === eventId ? null : eventId);
  };

  return (
    <div className="overflow-y-auto h-full">
      <ul className="divide-y divide-gray-200">
        {events.map(event => (
          <li key={event.id} className="p-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-md font-semibold text-gray-900">{event.title}</p>
                <p className="text-sm text-gray-500">
                  {format(new Date(event.start), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} - {format(new Date(event.end), "HH:mm", { locale: ptBR })}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">{event.user.nome}</span>
                {event.stage && (
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {event.stage.nome}
                  </span>
                )}
                <div className="relative">
                  <button onClick={() => toggleMenu(event.id)} className="p-1 rounded-full hover:bg-gray-200">
                    <MoreVertical size={20} />
                  </button>
                  {openMenuId === event.id && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 ring-1 ring-black ring-opacity-5">
                      <div className="py-1">
                        <button onClick={() => { onEdit(event); setOpenMenuId(null); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          Editar
                        </button>
                        <button onClick={() => { onClone(event.id); setOpenMenuId(null); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          Clonar
                        </button>
                        <button onClick={() => { onDelete(event.id); setOpenMenuId(null); }} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                          Excluir
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default React.memo(ListView);
