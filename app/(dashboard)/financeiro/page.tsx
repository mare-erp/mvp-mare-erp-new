'use client';

import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Calendar, CreditCard, AlertCircle, Plus, Edit, Trash2 } from 'lucide-react';
import TransacaoModal from './components/TransacaoModal'; // Importar o TransacaoModal
import { TipoTransacao, StatusTransacao } from '@prisma/client';

interface DashboardData {
  entradas: {
    total: number;
    mes: number;
    pendentes: number;
  };
  saidas: {
    total: number;
    mes: number;
    pendentes: number;
  };
  saldo: number;
  contasVencendo: number;
  fluxoMensal: Array<{
    mes: string;
    entradas: number;
    saidas: number;
  }>;
}

interface Transacao {
  id: string;
  descricao: string;
  valor: number;
  tipo: TipoTransacao;
  status: StatusTransacao;
  dataVencimento: string;
  dataPagamento?: string | null;
  clienteId?: string | null;
  observacoes?: string | null;
}

const statusOptions: StatusTransacao[] = ['PENDENTE', 'PAGA', 'ATRASADA', 'CANCELADA'];
const tipoOptions: TipoTransacao[] = ['RECEITA', 'DESPESA'];

const statusColors: Record<StatusTransacao, string> = { PENDENTE: 'bg-yellow-100 text-yellow-800', PAGA: 'bg-green-100 text-green-800', ATRASADA: 'bg-red-100 text-red-800', CANCELADA: 'bg-gray-100 text-gray-800' };
const tipoColors: Record<TipoTransacao, string> = { RECEITA: 'text-green-600', DESPESA: 'text-red-600' };

// Componente para o Skeleton da página
const FinanceiroSkeleton = () => {
  const SkeletonCard = () => (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
    </div>
  );

  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-20"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-6 bg-gray-200 rounded-full w-24"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="flex justify-end space-x-2">
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
        </div>
      </td>
    </tr>
  );

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      {/* Adicione aqui o esqueleto da tabela se desejar */}
    </div>
  );
};

export default function FinanceiroPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTransacaoModal, setShowTransacaoModal] = useState(false);
  const [editingTransacaoId, setEditingTransacaoId] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);

      const dashboardUrl = '/api/financeiro/dashboard-data';
      
      const transacoesParams = new URLSearchParams();
      if (filtroTipo) transacoesParams.append('tipo', filtroTipo);
      if (filtroStatus) transacoesParams.append('status', filtroStatus);
      const transacoesUrl = `/api/financeiro/transacoes?${transacoesParams.toString()}`;

      const [dashboardRes, transacoesRes] = await Promise.all([
        fetch(dashboardUrl),
        fetch(transacoesUrl)
      ]);

      if (dashboardRes.ok && transacoesRes.ok) {
        const dashboardData = await dashboardRes.json();
        const transacoesData = await transacoesRes.json();
        setDashboardData(dashboardData);
        setTransacoes(transacoesData.transacoes); // Corrigido para pegar o array de transações
      } else {
        setError('Erro ao carregar dados financeiros');
      }
    } catch (err) {
      setError('Erro ao carregar dados financeiros');
    } finally {
      setIsLoading(false);
    }
  }, [filtroTipo, filtroStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(dateString));
  };

  const handleAddTransacao = () => {
    setEditingTransacaoId(null);
    setShowTransacaoModal(true);
  };

  const handleEditTransacao = (transacaoId: string) => {
    setEditingTransacaoId(transacaoId);
    setShowTransacaoModal(true);
  };

  const handleDeleteTransacao = (transacaoId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return;

    fetch(`/api/financeiro/transacoes/${transacaoId}`, {
      method: 'DELETE',
    })
    .then(response => {
      if (response.ok) {
        fetchData(); // Recarregar dados
      } else {
        alert('Erro ao excluir transação.');
      }
    })
    .catch(err => {
      console.error('Erro ao excluir transação:', err);
      alert('Erro ao excluir transação.');
    });
  };

  if (isLoading) {
    return <FinanceiroSkeleton />;
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div>
      {showTransacaoModal && (
        <TransacaoModal
          onClose={() => setShowTransacaoModal(false)}
          onSave={fetchData}
          editingTransacaoId={editingTransacaoId}
        />
      )}

      {/* Header e Cards de Resumo */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Visão Financeira</h1>
            <p className="text-gray-500">Resumo das suas atividades financeiras.</p>
          </div>
          <button
            onClick={handleAddTransacao}
            className="bg-[#0A2F5B] text-white px-4 py-2 rounded-lg hover:bg-[#00BFA5] transition-colors flex items-center shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Transação
          </button>
        </div>
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={TrendingUp} title="Entradas do Mês" value={formatCurrency(dashboardData.entradas.mes)} subtext={`${formatCurrency(dashboardData.entradas.pendentes)} pendente`} />
            <StatCard icon={TrendingDown} title="Saídas do Mês" value={formatCurrency(dashboardData.saidas.mes)} subtext={`${formatCurrency(dashboardData.saidas.pendentes)} pendente`} />
            <StatCard icon={DollarSign} title="Saldo do Mês" value={formatCurrency(dashboardData.saldo)} subtext="Entradas - Saídas" />
            <StatCard icon={AlertCircle} title="Contas Vencendo" value={dashboardData.contasVencendo.toString()} subtext="Nos próximos 7 dias" />
          </div>
        )}
      </div>

      {/* Filtros e Tabela de Transações */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-700 flex-shrink-0">Últimas Transações</h3>
          <div className="flex-grow w-full sm:w-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A2F5B] focus:border-transparent text-sm"
            >
              <option value="">Todos os Tipos</option>
              {tipoOptions.map(tipo => <option key={tipo} value={tipo}>{tipo === 'RECEITA' ? 'Receita' : 'Despesa'}</option>)}
            </select>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A2F5B] focus:border-transparent text-sm"
            >
              <option value="">Todos os Status</option>
              {statusOptions.map(status => <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}</option>)}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Descrição</th>
                <th scope="col" className="px-6 py-3">Valor</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3">Vencimento</th>
                <th scope="col" className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {/* Renderização das transações aqui */}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
