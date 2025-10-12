'use client';

import React, { useState, useEffect } from 'react';

import { CalendarEvent, KanbanStage, CalendarPedido as Pedido } from '@/app/lib/definitions';

interface EventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: Partial<CalendarEvent>) => void;
  eventData: Partial<CalendarEvent> | null;
  stages: KanbanStage[];
  pedidos: Pedido[];
}

const EventDialog: React.FC<EventDialogProps> = ({ isOpen, onClose, onSave, eventData, stages, pedidos }) => {
  const [formData, setFormData] = useState<Partial<CalendarEvent>>({ title: '', start: '', end: '' });

  useEffect(() => {
    if (eventData) {
      setFormData({
        id: eventData.id,
        title: eventData.title || '',
        start: eventData.start ? new Date(eventData.start).toISOString().substring(0, 16) : '',
        end: eventData.end ? new Date(eventData.end).toISOString().substring(0, 16) : '',
        description: eventData.description || '',
        stageId: eventData.stageId || null,
        pedidoId: eventData.pedidoId || null,
      });
    } else {
      setFormData({ title: '', start: '', end: '' }); // Reset for new event
    }
  }, [eventData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
        <form onSubmit={handleSubmit}>
          <h2 className="text-xl font-bold mb-4">{formData.id ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
          
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Título</label>
            <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="start" className="block text-sm font-medium text-gray-700">Início</label>
              <input type="datetime-local" name="start" id="start" value={formData.start} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
            </div>
            <div>
              <label htmlFor="end" className="block text-sm font-medium text-gray-700">Fim</label>
              <input type="datetime-local" name="end" id="end" value={formData.end} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="stageId" className="block text-sm font-medium text-gray-700">Status</label>
            <select name="stageId" id="stageId" value={formData.stageId || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
              <option value="">Sem status</option>
              {stages.map(stage => <option key={stage.id} value={stage.id}>{stage.nome}</option>)}
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="pedidoId" className="block text-sm font-medium text-gray-700">Pedido de Venda</label>
            <select name="pedidoId" id="pedidoId" value={formData.pedidoId || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
              <option value="">Nenhum</option>
              {pedidos.map(pedido => <option key={pedido.id} value={pedido.id}>#{pedido.numeroPedido}</option>)}
            </select>
          </div>

          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrição</label>
            <textarea name="description" id="description" value={formData.description || ''} onChange={handleChange} rows={3} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"></textarea>
          </div>

          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Cancelar</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default React.memo(EventDialog);
