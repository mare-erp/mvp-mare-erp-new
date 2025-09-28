
'use client';

import { useState, useEffect } from 'react';
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

export default function FinanceiroPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTransacaoModal, setShowTransacaoModal] = useState(false);
  const [editingTransacaoId, setEditingTransacaoId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [dashboardRes, transacoesRes] = await Promise.all([
        fetch('/api/financeiro/dashboard-data'),
        fetch('/api/financeiro/transacoes')
      ]);

      if (dashboardRes.ok && transacoesRes.ok) {
        const dashboardData = await dashboardRes.json();
        const transacoesData = await transacoesRes.json();
        setDashboardData(dashboardData);
        setTransacoes(transacoesData);
      } else {
        setError('Erro ao carregar dados financeiros');
      }
    } catch (err) {
      setError('Erro ao carregar dados financeiros');
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleDeleteTransacao = async (transacaoId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return;

    try {
      const response = await fetch(`/api/financeiro/transacoes/${transacaoId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchData(); // Recarregar dados
      } else {
        alert('Erro ao excluir transação.');
      }
    } catch (err) {
      console.error('Erro ao excluir transação:', err);
      alert('Erro ao excluir transação.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Carregando dados financeiros...</div>
      </div>
    );
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

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financeiro</h1>
          <p className="mt-2 text-gray-600">Controle de fluxo de caixa e gestão financeira.</p>
        </div>
        <button 
          onClick={handleAddTransacao}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nova Transação</span>
        </button>
      </div>

      {dashboardData && (
        <>
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg border">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Entradas do Mês</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboardData.entradas.mes)}</p>
                  <p className="text-xs text-gray-500">Pendentes: {formatCurrency(dashboardData.entradas.pendentes)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-100">
                  <TrendingDown className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Saídas do Mês</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboardData.saidas.mes)}</p>
                  <p className="text-xs text-gray-500">Pendentes: {formatCurrency(dashboardData.saidas.pendentes)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Saldo Atual</p>
                  <p className={`text-2xl font-bold ${dashboardData.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(dashboardData.saldo)}
                  </p>
                  <p className="text-xs text-gray-500">Resultado do período</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Contas Vencendo</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.contasVencendo}</p>
                  <p className="text-xs text-gray-500">Próximos 7 dias</p>
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico de Fluxo de Caixa */}
          <div className="bg-white p-6 rounded-lg border mb-8">
            <h2 className="text-lg font-semibold mb-4">Fluxo de Caixa Mensal</h2>
            <div className="h-64 flex items-end justify-between space-x-2">
              {dashboardData.fluxoMensal.map((item, index) => {
                const maxValue = Math.max(...dashboardData.fluxoMensal.map(i => Math.max(i.entradas, i.saidas)));
                const entradaHeight = (item.entradas / maxValue) * 200;
                const saidaHeight = (item.saidas / maxValue) * 200;
                
                return (
                  <div key={index} className="flex flex-col items-center space-y-2">
                    <div className="flex items-end space-x-1">
                      <div 
                        className="bg-green-500 w-6 rounded-t"
                        style={{ height: `${entradaHeight}px` }}
                        title={`Entradas: ${formatCurrency(item.entradas)}`}
                      />
                      <div 
                        className="bg-red-500 w-6 rounded-t"
                        style={{ height: `${saidaHeight}px` }}
                        title={`Saídas: ${formatCurrency(item.saidas)}`}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{item.mes}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-center mt-4 space-x-6">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                <span className="text-sm text-gray-600">Entradas</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                <span className="text-sm text-gray-600">Saídas</span>
              </div>
            </div>
          </div>

          {/* Tabela de Transações */}
          <div className="bg-white rounded-lg border">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">Últimas Transações</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="th-style">Descrição</th>
                    <th className="th-style">Tipo</th>
                    <th className="th-style">Status</th>
                    <th className="th-style text-right">Valor</th>
                    <th className="th-style">Vencimento</th>
                    <th className="th-style">Pagamento</th>
                    <th className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transacoes.length > 0 ? transacoes.map((transacao) => (
                    <tr key={transacao.id}>
                      <td className="td-style font-medium text-gray-900">{transacao.descricao}</td>
                      <td className="td-style">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          transacao.tipo === 'RECEITA' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {transacao.tipo === 'RECEITA' ? 'Receita' : 'Despesa'}
                        </span>
                      </td>
                      <td className="td-style">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          transacao.status === 'PAGA' ? 'bg-green-100 text-green-800' :
                          transacao.status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {transacao.status}
                        </span>
                      </td>
                      <td className="td-style text-right">{formatCurrency(transacao.valor)}</td>
                      <td className="td-style">{formatDate(transacao.dataVencimento)}</td>
                      <td className="td-style">{transacao.dataPagamento ? formatDate(transacao.dataPagamento) : 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2 justify-end">
                          <button
                            onClick={() => handleEditTransacao(transacao.id)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Editar Transação"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTransacao(transacao.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Excluir Transação"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                        Nenhuma transação encontrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

