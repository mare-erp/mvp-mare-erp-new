'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, Search, Edit, Trash2, MoreVertical } from 'lucide-react';
import { TipoPessoa } from '@prisma/client';

interface Cliente {
  id: string;
  nome: string;
  tipoPessoa: TipoPessoa;
  cpfCnpj: string | null;
  email: string | null;
  telefone: string | null;
  cidade: string | null;
  uf: string | null;
  ativo: boolean;
  createdAt: string;
}

export default function ClientesPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  const fetchClientes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/clientes');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao carregar clientes.');
      }
      const data = await response.json();
      setClientes(data);
    } catch (err) {
      console.error('Erro ao buscar clientes:', err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const filteredClientes = clientes.filter(cliente =>
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cliente.cpfCnpj && cliente.cpfCnpj.includes(searchTerm)) ||
    (cliente.email && cliente.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatarTipoPessoa = (tipo: TipoPessoa) => {
    return tipo === TipoPessoa.FISICA ? 'Pessoa Física' : 'Pessoa Jurídica';
  };

  const formatarCpfCnpj = (cpfCnpj: string | null) => {
    if (!cpfCnpj) return '-';
    if (cpfCnpj.length === 11) {
      return cpfCnpj.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (cpfCnpj.length === 14) {
      return cpfCnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return cpfCnpj;
  };

  const toggleDropdown = (clienteId: string) => {
    setDropdownOpen(dropdownOpen === clienteId ? null : clienteId);
  };

  const handleEditCliente = (clienteId: string) => {
    router.push(`/clientes/${clienteId}/editar`);
    setDropdownOpen(null);
  };

  const handleDeleteCliente = async (clienteId: string, nomeCliente: string) => {
    if (!confirm(`Tem certeza que deseja excluir o cliente "${nomeCliente}"?`)) return;

    try {
      const response = await fetch(`/api/clientes/${clienteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchClientes(); // Recarregar lista
        setDropdownOpen(null);
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Erro ao excluir cliente.');
      }
    } catch (err) {
      console.error('Erro ao excluir cliente:', err);
      alert('Erro ao excluir cliente.');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="mt-2 text-gray-600">Gerencie sua base de clientes.</p>
        </div>
        <button 
          onClick={() => router.push('/clientes/novo')} 
          className="btn-primary inline-flex items-center gap-2"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Novo Cliente</span>
        </button>
      </div>

      {/* Barra de Pesquisa */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Pesquisar por nome, CPF/CNPJ ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A2F5B] focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A2F5B] mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando clientes...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchClientes}
              className="bg-[#0A2F5B] text-white px-4 py-2 rounded-lg hover:bg-[#00BFA5] transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-gray-200">
              <p className="text-sm text-gray-600">
                {filteredClientes.length} cliente{filteredClientes.length !== 1 ? 's' : ''} encontrado{filteredClientes.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPF / CNPJ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">E-mail</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Localização</th>
                    <th className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredClientes.length > 0 ? filteredClientes.map((cliente) => (
                    <tr key={cliente.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-[#0A2F5B] flex items-center justify-center">
                              <span className="text-sm font-medium text-white">
                                {cliente.nome.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{cliente.nome}</div>
                            <div className="text-sm text-gray-500">
                              {cliente.ativo ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Ativo
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Inativo
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatarTipoPessoa(cliente.tipoPessoa)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatarCpfCnpj(cliente.cpfCnpj)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {cliente.email || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {cliente.telefone || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {cliente.cidade && cliente.uf ? `${cliente.cidade}, ${cliente.uf}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="relative inline-block text-left">
                          <button 
                            onClick={() => toggleDropdown(cliente.id)}
                            className="text-gray-400 hover:text-gray-600 p-1"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          {dropdownOpen === cliente.id && (
                            <div className="absolute right-0 z-10 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
                              <div className="py-1">
                                <button
                                  onClick={() => handleEditCliente(cliente.id)}
                                  className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Editar
                                </button>
                                <button
                                  onClick={() => handleDeleteCliente(cliente.id, cliente.nome)}
                                  className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Excluir
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="text-gray-500">
                          {searchTerm ? (
                            <>
                              <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                              <p className="text-lg font-medium">Nenhum cliente encontrado</p>
                              <p className="text-sm">Tente ajustar os termos de pesquisa</p>
                            </>
                          ) : (
                            <>
                              <PlusCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                              <p className="text-lg font-medium">Nenhum cliente cadastrado</p>
                              <p className="text-sm mb-4">Comece adicionando seu primeiro cliente</p>
                              <button
                                onClick={() => router.push('/clientes/novo')}
                                className="bg-[#0A2F5B] text-white px-4 py-2 rounded-lg hover:bg-[#00BFA5] transition-colors"
                              >
                                Adicionar Cliente
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}