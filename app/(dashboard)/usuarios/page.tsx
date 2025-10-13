
'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, Shield, Users, Eye, Settings } from 'lucide-react';
import { useAuth } from '@/app/hooks/useAuth';
import UserModal from './components/UserModal'; // Importar o UserModal

interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
  ultimoLogin?: string;
  createdAt: string;
}

interface PermissaoModulo {
  [acao: string]: boolean;
}

interface Permissoes {
  [modulo: string]: PermissaoModulo;
}

const ROLES = {
  ADMIN: { label: 'Administrador', color: 'bg-red-100 text-red-800' },
  GESTOR: { label: 'Gestor', color: 'bg-blue-100 text-blue-800' },
  OPERADOR: { label: 'Operador', color: 'bg-green-100 text-green-800' },
  VISUALIZADOR: { label: 'Visualizador', color: 'bg-gray-100 text-gray-800' }
};

const MODULOS_PERMISSOES = {
  vendas: {
    label: 'Vendas',
    acoes: {
      acessar: 'Acessar módulo',
      criar_pedido: 'Criar pedidos',
      editar_pedido: 'Editar pedidos',
      excluir_pedido: 'Excluir pedidos',
      visualizar_relatorios: 'Ver relatórios',
      exportar_dados: 'Exportar dados',
      imprimir: 'Imprimir pedidos'
    }
  },
  financeiro: {
    label: 'Financeiro',
    acoes: {
      acessar: 'Acessar módulo',
      contas_receber: 'Contas a receber',
      contas_pagar: 'Contas a pagar',
      criar_transacao: 'Criar transações',
      editar_transacao: 'Editar transações',
      visualizar_relatorios: 'Ver relatórios',
      exportar_dados: 'Exportar dados'
    }
  },
  estoque: {
    label: 'Estoque',
    acoes: {
      acessar: 'Acessar módulo',
      criar_produto: 'Criar produtos',
      editar_produto: 'Editar produtos',
      movimentar_estoque: 'Movimentar estoque',
      visualizar_relatorios: 'Ver relatórios',
      exportar_dados: 'Exportar dados'
    }
  },
  clientes: {
    label: 'Clientes',
    acoes: {
      acessar: 'Acessar módulo',
      criar_cliente: 'Criar clientes',
      editar_cliente: 'Editar clientes',
      excluir_cliente: 'Excluir clientes',
      exportar_dados: 'Exportar dados'
    }
  },
  configuracoes: {
    label: 'Configurações',
    acoes: {
      empresa: 'Configurações da empresa',
      usuarios: 'Gestão de usuários',
      sistema: 'Configurações do sistema'
    }
  }
};

export default function UsuariosPage() {
  const { hasPermission, organizacao } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserModal, setShowUserModal] = useState(false); // Alterado para showUserModal
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedUserPermissions, setSelectedUserPermissions] = useState<Permissoes>({});

  const canView = hasPermission('usuarios', 'visualizar');

  const fetchUsuarios = useCallback(async () => {
    if (!organizacao?.id) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/organizacoes/${organizacao.id}/membros`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setUsuarios(data);
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    } finally {
      setLoading(false);
    }
  }, [organizacao?.id]);

  useEffect(() => {
    if (!canView) return;
    fetchUsuarios();
  }, [canView, fetchUsuarios]);

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Acesso Negado</h3>
          <p className="text-gray-500">Você não tem permissão para acessar a gestão de usuários.</p>
        </div>
      </div>
    );
  }

  const handleAddUser = () => {
    setEditingUser(null);
    setShowUserModal(true); // Usar showUserModal
  };

  const handleEditUser = (usuario: Usuario) => {
    setEditingUser(usuario);
    setShowUserModal(true); // Usar showUserModal
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      const response = await fetch(`/api/usuarios/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchUsuarios(); // Recarregar dados
      } else {
        alert('Erro ao excluir usuário.');
      }
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      alert('Erro ao excluir usuário.');
    }
  };

  const handleEditPermissions = (usuario: Usuario) => {
    // Buscar permissões do usuário
    setSelectedUserPermissions({}); // TODO: Implementar busca de permissões
    setEditingUser(usuario);
    setShowPermissionsModal(true);
  };

  const filteredUsuarios = usuarios.filter(usuario =>
    usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A202C]">Gestão de Usuários</h1>
          <p className="text-[#718096] mt-1">
            Gerencie membros da organização e suas permissões
          </p>
        </div>
        
        {hasPermission('usuarios', 'criar') && (
          <button
            onClick={handleAddUser}
            className="bg-[#0A2F5B] text-white px-4 py-2 rounded-lg hover:bg-[#00BFA5] transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Usuário
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A2F5B] focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Lista de Usuários */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A2F5B]"></div>
          </div>
        ) : filteredUsuarios.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum usuário encontrado</h3>
              <p className="text-gray-500">
                {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Adicione o primeiro usuário à organização.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Função
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Último Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsuarios.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {usuario.nome}
                        </div>
                        <div className="text-sm text-gray-500">
                          {usuario.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${ROLES[usuario.role as keyof typeof ROLES]?.color || 'bg-gray-100 text-gray-800'}`}>
                        {ROLES[usuario.role as keyof typeof ROLES]?.label || usuario.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        usuario.ativo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {usuario.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {usuario.ultimoLogin ? formatDate(usuario.ultimoLogin) : 'Nunca'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {hasPermission('usuarios', 'visualizar') && (
                          <button
                            onClick={() => handleEditPermissions(usuario)}
                            className="text-[#0A2F5B] hover:text-[#00BFA5] transition-colors"
                            title="Gerenciar Permissões"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                        )}
                        
                        {hasPermission('usuarios', 'editar') && (
                          <button
                            onClick={() => handleEditUser(usuario)}
                            className="text-[#0A2F5B] hover:text-[#00BFA5] transition-colors"
                            title="Editar Usuário"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        
                        {hasPermission('usuarios', 'excluir') && usuario.role !== 'ADMIN' && (
                          <button
                            onClick={() => handleDeleteUser(usuario.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Remover Usuário"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Adicionar/Editar Usuário */}
      {showUserModal && (
        <UserModal
          onClose={() => setShowUserModal(false)}
          onSave={fetchUsuarios}
          editingUser={editingUser}
        />
      )}

      {/* Modal de Permissões */}
      {showPermissionsModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#1A202C]">
                Permissões - {editingUser.nome}
              </h2>
              <button
                onClick={() => setShowPermissionsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {Object.entries(MODULOS_PERMISSOES).map(([modulo, config]) => (
                <div key={modulo} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-[#1A202C] mb-4 flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-[#0A2F5B]" />
                    {config.label}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(config.acoes).map(([acao, label]) => (
                      <label key={acao} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedUserPermissions[modulo]?.[acao] || false}
                          onChange={(e) => {
                            setSelectedUserPermissions(prev => ({
                              ...prev,
                              [modulo]: {
                                ...prev[modulo],
                                [acao]: e.target.checked
                              }
                            }));
                          }}
                          className="rounded border-gray-300 text-[#0A2F5B] focus:ring-[#0A2F5B]"
                        />
                        <span className="text-sm text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowPermissionsModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 bg-[#0A2F5B] text-white rounded-lg hover:bg-[#00BFA5] transition-colors"
              >
                Salvar Permissões
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
