'use client';

import { PlusCircle, MoreVertical, Filter } from 'lucide-react';
import { StatusPedido } from '@prisma/client';
import { useEffect, useState, useMemo, useCallback } from 'react';
import PedidoModal from './components/pedidoModal';
import { useData } from '@/app/contexts/DataContexts';
import { Dropdown } from '@/app/components/ui/Dropdown';

// --- Tipagens ---
interface Pedido {
  id: string;
  numeroPedido: number;
  dataPedido: string;
  valorTotal: number;
  status: StatusPedido;
  cliente: {
    nome: string;
  };
  vendedor: {
    nome: string;
  };
}

interface SummaryData {
  count: number;
  total: number;
}
interface Summary {
  VENDIDO: SummaryData;
  ORCAMENTO: SummaryData;
  RECUSADO: SummaryData;
}

// --- Funções Auxiliares de Formatação ---
const formatarValor = (valor: number) => 
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatarTicketMedio = (valor: number) => {
  if (valor >= 1000) {
    return `R$ ${(valor / 1000).toFixed(2)}k`.replace('.', ',');
  }
  return formatarValor(valor);
};

// --- Componente do Card de Resumo ---
const StatCard = ({ title, count, total }: { title: string; count: number; total: number }) => {
  const ticketMedio = count > 0 ? total / count : 0;
  return (
    <div className="bg-white p-5 rounded-lg border">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <span className="text-xs font-semibold text-gray-400">({count})</span>
      </div>
      <div className="mt-2 text-xl font-bold text-gray-900">{formatarValor(total)}</div>
      <div className="text-xs text-gray-500">Ticket Médio: {formatarTicketMedio(ticketMedio)}</div>
    </div>
  );
};


export default function VendasPage() {
  const { membros } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPedidoId, setEditingPedidoId] = useState<string | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  
  const [statusFiltro, setStatusFiltro] = useState<StatusPedido>(StatusPedido.ORCAMENTO);
  const [vendedorFiltro, setVendedorFiltro] = useState<string>('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const abas = [
    { label: 'Orçamentos', status: StatusPedido.ORCAMENTO },
    { label: 'Vendido', status: StatusPedido.VENDIDO },
    { label: 'Recusado', status: StatusPedido.RECUSADO },
  ];

  const fetchData = useCallback(async () => {
    if (!dataInicio || !dataFim) return;
    setIsLoading(true);
    setError(null);
    const params = new URLSearchParams({ dataInicio, dataFim });
    if (vendedorFiltro) params.append('vendedorId', vendedorFiltro);
    
    const summaryUrl = `/api/vendas/summary?${params.toString()}`;
    const pedidosUrl = `/api/vendas?status=${statusFiltro}&${params.toString()}`;
    
    try {
      const [summaryRes, pedidosRes] = await Promise.all([
        fetch(summaryUrl),
        fetch(pedidosUrl),
      ]);

      if (!summaryRes.ok) throw new Error('Falha ao carregar resumo.');
      if (!pedidosRes.ok) throw new Error('Falha ao carregar os pedidos.');

      setSummary(await summaryRes.json());
      setPedidos(await pedidosRes.json());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [statusFiltro, vendedorFiltro, dataInicio, dataFim]);

  useEffect(() => {
    const hoje = new Date();
    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    setDataInicio(primeiroDia.toISOString().split('T')[0]);
    setDataFim(ultimoDia.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const vendedoresOptions = useMemo(() => {
    return [{ label: 'Todos', value: '' }, ...membros.map(m => ({ label: m.usuario.nome, value: m.usuarioId }))];
  }, [membros]);

  const previsao = useMemo(() => {
    if (!summary) return { count: 0, total: 0 };
    return {
      count: summary.ORCAMENTO.count + summary.VENDIDO.count,
      total: summary.ORCAMENTO.total + summary.VENDIDO.total,
    }
  }, [summary]);

  const formatarData = (dataISO: string) => new Date(dataISO).toLocaleDateString('pt-BR');

  const toggleDropdown = (pedidoId: string) => {
    setDropdownOpen(dropdownOpen === pedidoId ? null : pedidoId);
  };

  const handleEditPedido = (pedidoId: string) => {
    setEditingPedidoId(pedidoId);
    setIsModalOpen(true);
    setDropdownOpen(null);
  };

  const handleClonePedido = async (pedidoId: string) => {
    try {
      const response = await fetch(`/api/vendas/${pedidoId}/clone`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchData(); // Recarregar dados
        setDropdownOpen(null);
      } else {
        setError('Erro ao clonar pedido');
      }
    } catch (err) {
      setError('Erro ao clonar pedido');
    }
  };

  const handleGeneratePDF = async (pedidoId: string, numeroPedido: number) => {
    try {
      const response = await fetch(`/api/vendas/${pedidoId}/pdf`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pedido-${numeroPedido}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setDropdownOpen(null);
      } else {
        setError('Erro ao gerar PDF');
      }
    } catch (err) {
      setError('Erro ao gerar PDF');
    }
  };

  const handleDeletePedido = async (pedidoId: string) => {
    if (!confirm('Tem certeza que deseja excluir este pedido?')) return;

    try {
      const response = await fetch(`/api/vendas/${pedidoId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchData(); // Recarregar dados
        setDropdownOpen(null);
      } else {
        alert('Erro ao excluir pedido.');
      }
    } catch (err) {
      console.error('Erro ao excluir pedido:', err);
      alert('Erro ao excluir pedido.');
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingPedidoId(null);
  };

  const handleOpenModal = () => {
    setEditingPedidoId(null); // Garante que está abrindo para um novo pedido
    setIsModalOpen(true);
  };

  return (
    <div>
      {isModalOpen && (
        <PedidoModal 
          onClose={handleModalClose} 
          onSave={fetchData} 
          editingPedidoId={editingPedidoId}
        />
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vendas</h1>
          <p className="mt-2 text-gray-600">Gerencie seus orçamentos e vendas.</p>
        </div>
        <button 
          onClick={handleOpenModal}
          className="btn-primary inline-flex items-center gap-2"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Novo Pedido</span>
        </button>
      </div>
      
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Previsão" count={previsao.count} total={previsao.total} />
          <StatCard title="Vendas" count={summary.VENDIDO.count} total={summary.VENDIDO.total} />
          <StatCard title="Orçamentos" count={summary.ORCAMENTO.count} total={summary.ORCAMENTO.total} />
          <StatCard title="Recusados" count={summary.RECUSADO.count} total={summary.RECUSADO.total} />
        </div>
      )}

      <div className="p-4 bg-white border rounded-lg mb-6 flex items-center gap-4 flex-wrap">
        <Filter className="w-5 h-5 text-gray-500" />
        <div>
          <label htmlFor="dataInicio" className="text-xs font-medium text-gray-600">Data Início</label>
          <input type="date" id="dataInicio" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="mt-1 input-style text-sm p-1.5" />
        </div>
        <div>
          <label htmlFor="dataFim" className="text-xs font-medium text-gray-600">Data Fim</label>
          <input type="date" id="dataFim" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="mt-1 input-style text-sm p-1.5" />
        </div>
        <Dropdown
          label="Vendedor"
          options={vendedoresOptions}
          value={vendedorFiltro}
          onChange={(value) => setVendedorFiltro(value)}
          className="w-48"
        />
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {abas.map((aba) => (
            <button
              key={aba.label}
              onClick={() => setStatusFiltro(aba.status)}
              className={`${ aba.status === statusFiltro ? 'border-[#003846] text-[#003846]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300' } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {aba.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-8 bg-white p-6 rounded-lg border">
        {isLoading ? ( <p>Carregando...</p> ) : error ? ( <p className="text-red-600">{error}</p> ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="th-style">Nº Pedido</th>
                <th className="th-style">Cliente</th>
                <th className="th-style">Vendedor</th>
                <th className="th-style">Data</th>
                <th className="th-style text-right">Valor Total</th>
                <th className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pedidos.length > 0 ? pedidos.map((pedido) => (
                <tr key={pedido.id}>
                  <td className="td-style font-medium text-gray-900">#{pedido.numeroPedido}</td>
                  <td className="td-style">{pedido.cliente.nome}</td>
                  <td className="td-style">{pedido.vendedor.nome}</td>
                  <td className="td-style">{formatarData(pedido.dataPedido)}</td>
                  <td className="td-style text-right">{formatarValor(pedido.valorTotal)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="relative inline-block text-left">
                      <button 
                        onClick={() => toggleDropdown(pedido.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      {dropdownOpen === pedido.id && (
                        <div className="absolute right-0 z-10 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
                          <div className="py-1">
                            <button
                              onClick={() => handleEditPedido(pedido.id)}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleClonePedido(pedido.id)}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Clonar
                            </button>
                            <button
                              onClick={() => handleGeneratePDF(pedido.id, pedido.numeroPedido)}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Gerar PDF
                            </button>
                            <button
                              onClick={() => handleDeletePedido(pedido.id)}
                              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                            >
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
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    Nenhum pedido encontrado para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

