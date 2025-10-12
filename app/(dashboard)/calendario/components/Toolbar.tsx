'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';

// Tipos
interface User { id: string; nome: string; }
type ViewMode = 'calendar' | 'kanban' | 'list';

interface ToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  users: User[];
  selectedUserId: string;
  onSelectedUserIdChange: (userId: string) => void;
  onAddTask: () => void;
  onResetFilters: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ 
  viewMode, 
  onViewModeChange, 
  users, 
  selectedUserId, 
  onSelectedUserIdChange,
  onAddTask,
  onResetFilters
}) => {

  const viewOptions: { id: ViewMode; label: string }[] = [
    { id: 'calendar', label: 'Calendário' },
    { id: 'kanban', label: 'Kanban' },
    { id: 'list', label: 'Lista' },
  ];

  return (
    <div className="flex items-center justify-between mb-4 p-2 bg-gray-50 border rounded-lg">
      <div className="flex items-center space-x-2 bg-gray-200 p-1 rounded-md">
        {viewOptions.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => onViewModeChange(id)}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              viewMode === id 
                ? 'bg-white text-gray-800 shadow-sm' 
                : 'bg-transparent text-gray-600 hover:bg-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex items-center space-x-4">
        <div>
          <select
            id="user-filter"
            value={selectedUserId}
            onChange={(e) => onSelectedUserIdChange(e.target.value)}
            className="input-style text-sm p-2"
          >
            <option value="all">Todos os Usuários</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.nome}
              </option>
            ))}
          </select>
        </div>
        <button onClick={onResetFilters} className="btn-secondary p-2" title="Limpar Filtros"><RefreshCw className="w-4 h-4" /></button>
        <button
          onClick={onAddTask}
          className="btn-primary inline-flex items-center gap-2"
        >
          + Adicionar Tarefa
        </button>
      </div>
    </div>
  );
};

export default React.memo(Toolbar);