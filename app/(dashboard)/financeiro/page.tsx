'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Plus, Edit, Trash2, TrendingUp, TrendingDown, DollarSign, AlertCircle, RefreshCw } from 'lucide-react';
import { TipoTransacao, StatusTransacao } from '@prisma/client';
import StatCard from '@/app/components/ui/StatCard';

const TransacaoModal = dynamic(() => import('./components/TransacaoModal'), { ssr: false });

// --- Tipagens ---
interface Transacao { id: string; descricao: string; valor: number; tipo: TipoTransacao; status: StatusTransacao; dataVencimento: string; }
interface FinanceiroSummary { aReceber: number; aPagar: number; saldoMes: number; contasVencendo: number; }
type FinanceiroFiltro = 'todos' | 'a-receber' | 'a-pagar' | 'vencendo';

export default function FinanceiroPage() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [summary, setSummary] = useState<FinanceiroSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTransacaoModal, setShowTransacaoModal] = useState(false);
  const [editingTransacaoId, setEditingTransacaoId] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<FinanceiroFiltro>('todos');

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [summaryRes, transacoesRes] = await Promise.all([
        fetch('/api/financeiro/summary'),
        fetch('/api/financeiro/transacoes')
      ]);

      if (summaryRes.ok && transacoesRes.ok) {
        const summaryData = await summaryRes.json();
        const transacoesData = await transacoesRes.json();
        setSummary(summaryData);
        setTransacoes(transacoesData.transacoes);
      } else {
        setError('Erro ao carregar dados financeiros');
      }
    } catch (err) {
      setError('Erro ao carregar dados financeiros');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleResetFilters = () => {
    setFiltro('todos');
  };

  const filteredTransacoes = useMemo(() => {
    if (filtro === 'todos') return transacoes;
    if (filtro === 'a-receber') return transacoes.filter(t => t.tipo === 'RECEITA' && t.status === 'PENDENTE');
    if (filtro === 'a-pagar') return transacoes.filter(t => t.tipo === 'DESPESA' && t.status === 'PENDENTE');
    if (filtro === 'vencendo') {
        const hoje = new Date();
        const proximaSemana = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000);
        return transacoes.filter(t => t.status === 'PENDENTE' && new Date(t.dataVencimento) >= hoje && new Date(t.dataVencimento) <= proximaSemana);
    }
    return transacoes;
  }, [transacoes, filtro]);

  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR');

  const handleAddTransacao = () => {
    setEditingTransacaoId(null);
    setShowTransacaoModal(true);
  };

  const handleEditTransacao = (transacaoId: string) => {
    setEditingTransacaoId(transacaoId);
    setShowTransacaoModal(true);
  };

  const handleDeleteTransacao = async (transacaoId: string) => {
    if (!confirm('Tem certeza?')) return;
    try {
      const response = await fetch(`/api/financeiro/transacoes/${transacaoId}`, { method: 'DELETE' });
      if (response.ok) fetchData();
      else setError('Erro ao excluir transação.');
    } catch (err) {
      setError('Erro ao excluir transação.');
    }
  };

  if (isLoading) return <div className="p-6">Carregando...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      {showTransacaoModal && <TransacaoModal onClose={() => setShowTransacaoModal(false)} onSave={fetchData} editingTransacaoId={editingTransacaoId} />}

      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Financeiro</h1>
            <div className="flex items-center gap-2">
                <button onClick={handleResetFilters} className="btn-secondary p-2" title="Limpar Filtros"><RefreshCw className="w-4 h-4" /></button>
                <button onClick={handleAddTransacao} className="btn-primary inline-flex items-center gap-2">
                    <Plus className="w-5 h-5" /><span>Nova Transação</span>
                </button>
            </div>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="A Receber" value={formatCurrency(summary.aReceber)} icon={<TrendingUp />} color="green" onClick={() => setFiltro('a-receber')} isActive={filtro === 'a-receber'} />
          <StatCard title="A Pagar" value={formatCurrency(summary.aPagar)} icon={<TrendingDown />} color="red" onClick={() => setFiltro('a-pagar')} isActive={filtro === 'a-pagar'} />
          <StatCard title="Saldo do Mês" value={formatCurrency(summary.saldoMes)} icon={<DollarSign />} color="blue" />
          <StatCard title="Vencendo em 7 dias" value={summary.contasVencendo.toString()} icon={<AlertCircle />} color="yellow" onClick={() => setFiltro('vencendo')} isActive={filtro === 'vencendo'} />
        </div>
      )}

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Transações</h2>
          <span className="text-sm text-gray-500">{filteredTransacoes.length} transações exibidas</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr><th className="th-style">Descrição</th><th className="th-style">Valor</th><th className="th-style">Status</th><th className="th-style">Vencimento</th><th className="th-style text-right">Ações</th></tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransacoes.length > 0 ? filteredTransacoes.map((transacao) => (
                <tr key={transacao.id} className="hover:bg-gray-50">
                  <td className="td-style font-medium">{transacao.descricao}</td>
                  <td className={`td-style font-mono ${transacao.tipo === 'RECEITA' ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(transacao.valor)}</td>
                  <td className="td-style text-center"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${{'PENDENTE':'bg-yellow-100 text-yellow-800','PAGA':'bg-green-100 text-green-800','ATRASADA':'bg-red-100 text-red-800','CANCELADA':'bg-gray-100 text-gray-800'}[transacao.status]}`}>{transacao.status}</span></td>
                  <td className="td-style">{formatDate(transacao.dataVencimento)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right"><div className="flex items-center space-x-2 justify-end"><button onClick={() => handleEditTransacao(transacao.id)} className="p-1 text-blue-600 hover:text-blue-800" title="Editar"><Edit className="w-4 h-4" /></button><button onClick={() => handleDeleteTransacao(transacao.id)} className="p-1 text-red-600 hover:text-red-800" title="Excluir"><Trash2 className="w-4 h-4" /></button></div></td>
                </tr>
              )) : (<tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">Nenhuma transação encontrada.</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}