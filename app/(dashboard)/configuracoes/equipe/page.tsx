'use client';

import { useEffect, useState, FormEvent } from 'react';
import { Role } from '@prisma/client'; // Importa os tipos do Prisma para consistência
import { Trash2 } from 'lucide-react'; // Ícone de lixeira

// Tipagem para os membros da equipe que serão listados
interface Membro {
  id: string;
  role: Role;
  usuario: {
    nome: string;
    email: string;
  };
}

export default function EquipePage() {
  // Estados para gerenciar a UI
  const [membros, setMembros] = useState<Membro[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState({ message: '', type: '' });

  // Estado para o formulário de convite, agora com o campo de senha
  const [novoMembro, setNovoMembro] = useState({ nome: '', email: '', role: 'OPERADOR', senha: '' });
  
  // Estado para controlar o modal de confirmação de exclusão
  const [membroParaDeletar, setMembroParaDeletar] = useState<Membro | null>(null);

  // Função para buscar a lista de membros da API
  const fetchMembros = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/membros');
      if (!response.ok) throw new Error('Falha ao carregar a equipe. Tente recarregar a página.');
      const data = await response.json();
      setMembros(data);
    } catch (err) {
      setFeedback({ message: (err as Error).message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Busca os membros assim que a página é carregada
  useEffect(() => {
    fetchMembros();
  }, []);

  // Manipulador para atualizar o estado do formulário
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNovoMembro(prev => ({ ...prev, [name]: value }));
  };

  // Manipulador para enviar o convite de um novo membro
  const handleInviteSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback({ message: '', type: '' });
    try {
      const response = await fetch('/api/membros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoMembro),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Falha ao convidar membro.');
      
      setMembros(prev => [...prev, data]); // Adiciona o novo membro à lista na tela
      setNovoMembro({ nome: '', email: '', role: 'OPERADOR', senha: '' }); // Limpa o formulário
      setFeedback({ message: `Usuário ${data.usuario.nome} convidado com sucesso!`, type: 'success' });

    } catch (err) {
      setFeedback({ message: (err as Error).message, type: 'error' });
    }
  };

  // Manipulador para deletar um membro
  const handleDeleteMember = async () => {
    if (!membroParaDeletar) return;

    try {
      const response = await fetch(`/api/membros/${membroParaDeletar.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Falha ao remover membro.');

      setMembros(prev => prev.filter(m => m.id !== membroParaDeletar.id));
      setFeedback({ message: 'Membro removido com sucesso!', type: 'success' });
    } catch (err) {
      setFeedback({ message: (err as Error).message, type: 'error' });
    } finally {
      setMembroParaDeletar(null); // Fecha o modal de confirmação
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Gerenciar Equipe</h1>
      <p className="mt-2 text-gray-600">
        Convide novos membros e gerencie as permissões de acesso da sua equipe.
      </p>

      {/* Formulário para Convidar Novo Membro */}
      <div className="mt-8 bg-white p-6 rounded-lg border">
        <h2 className="text-lg font-semibold">Convidar Novo Membro</h2>
        <form onSubmit={handleInviteSubmit} className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="lg:col-span-1">
            <label htmlFor="nome" className="text-sm font-medium">Nome</label>
            <input type="text" name="nome" id="nome" value={novoMembro.nome} onChange={handleInputChange} required className="mt-1 block w-full input-style" />
          </div>
          <div className="lg:col-span-1">
            <label htmlFor="email" className="text-sm font-medium">E-mail</label>
            <input type="email" name="email" id="email" value={novoMembro.email} onChange={handleInputChange} required className="mt-1 block w-full input-style" />
          </div>
          <div className="lg:col-span-1">
            <label htmlFor="senha" className="text-sm font-medium">Senha (opcional)</label>
            <input type="password" name="senha" id="senha" value={novoMembro.senha} onChange={handleInputChange} className="mt-1 block w-full input-style" />
          </div>
          <div className="lg:col-span-1">
            <label htmlFor="role" className="text-sm font-medium">Permissão</label>
            <select name="role" id="role" value={novoMembro.role} onChange={handleInputChange} className="mt-1 block w-full input-style">
              <option value="OPERADOR">Operador</option>
              <option value="VISUALIZADOR">Visualizador</option>
            </select>
          </div>
          <button type="submit" className="lg:col-span-1 btn-primary">Convidar</button>
        </form>
        <p className="text-xs text-gray-500 mt-2">Se nenhuma senha for definida, uma senha temporária será gerada no console do servidor.</p>
      </div>
      
      {feedback.message && (
        <div className={`mt-4 p-4 rounded-md ${feedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {feedback.message}
        </div>
      )}

      {/* Lista de Membros Atuais */}
      <div className="mt-8 bg-white p-6 rounded-lg border">
        <h2 className="text-lg font-semibold">Membros da Equipe</h2>
        <div className="mt-4 flow-root">
          {isLoading ? (
            <p>Carregando equipe...</p>
          ) : (
            <ul role="list" className="divide-y divide-gray-200">
              {membros.length > 0 ? membros.map((membro) => (
                <li key={membro.id} className="py-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{membro.usuario.nome}</p>
                    <p className="text-sm text-gray-500">{membro.usuario.email}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      membro.role === 'GESTOR' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {membro.role}
                    </span>
                    {membro.role !== 'GESTOR' && (
                      <button onClick={() => setMembroParaDeletar(membro)} className="text-red-500 hover:text-red-700" title="Remover membro">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </li>
              )) : (
                <p className="text-sm text-gray-500">Nenhum membro na equipe ainda. Convide o primeiro!</p>
              )}
            </ul>
          )}
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {membroParaDeletar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center" onClick={() => setMembroParaDeletar(null)}>
          <div className="bg-white p-6 rounded-lg shadow-xl z-50 max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">Confirmar Exclusão</h3>
            <p className="mt-2 text-sm text-gray-600">
              Você tem certeza que deseja remover <strong>{membroParaDeletar.usuario.nome}</strong> da equipe? Esta ação não pode ser desfeita.
            </p>
            <div className="mt-6 flex justify-end gap-4">
              <button onClick={() => setMembroParaDeletar(null)} className="btn-secondary">Cancelar</button>
              <button onClick={handleDeleteMember} className="btn-danger">Sim, Remover</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
