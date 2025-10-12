'use client';

'use client';

import { PlusCircle, Filter, TrendingUp, FileText, XCircle, ListChecks, RefreshCw } from 'lucide-react';
import { StatusPedido } from '@prisma/client';
import { useEffect, useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useData } from '@/app/contexts/DataContexts';
import { Dropdown } from '@/app/components/ui/Dropdown';
import StatCard from '@/app/components/ui/StatCard';

const PedidoModal = dynamic(() => import('./components/pedidoModal'), { ssr: false });

// --- Tipagens ---
interface Pedido { id: string; numeroPedido: number; dataPedido: string; valorTotal: number; status: StatusPedido; cliente: { nome: string }; usuario: { nome: string }; }
interface SummaryData { count: number; total: number; }
interface VendasSummary {
  summary: { VENDIDO: SummaryData; ORCAMENTO: SummaryData; RECUSADO: SummaryData; ALL: SummaryData; };
}

// --- Funções Auxiliares ---
const formatarValor = (valor: number) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const calcularTicketMedio = (total: number, count: number) => count === 0 ? 'R$ 0,00' : formatarValor(total / count);

export default function VendasPage() {
  const { membros, fetchMembros } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPedidoId, setEditingPedidoId] = useState<string | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [vendasSummary, setVendasSummary] = useState<VendasSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFiltro, setStatusFiltro] = useState<StatusPedido | 'ALL'>('ALL');
  const [vendedorFiltro, setVendedorFiltro] = useState<string>('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  useEffect(() => { fetchMembros(); }, [fetchMembros]);

  const setDefaultDates = useCallback(() => {
    const hoje = new Date();
    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    setDataInicio(primeiroDia.toISOString().split('T')[0]);
    setDataFim(ultimoDia.toISOString().split('T')[0]);
  }, []);

  const handleResetFilters = () => {
    setDefaultDates();
    setVendedorFiltro('');
    setStatusFiltro('ALL');
  };

  const fetchData = useCallback(async () => {
    if (!dataInicio || !dataFim) return;
    setIsLoading(true);
    setError(null);
    const params = new URLSearchParams({ dataInicio, dataFim });
    if (vendedorFiltro) params.append('usuarioId', vendedorFiltro);
    
    const summaryUrl = `/api/vendas/summary?${params.toString()}`;
    const pedidosUrl = `/api/vendas?${params.toString()}${statusFiltro !== 'ALL' ? `&status=${statusFiltro}` : ''}`;
    
    try {
      const [summaryRes, pedidosRes] = await Promise.all([ fetch(summaryUrl), fetch(pedidosUrl) ]);
      if (!summaryRes.ok) throw new Error('Falha ao carregar métricas de vendas.');
      if (!pedidosRes.ok) throw new Error('Falha ao carregar pedidos.');
      
      setVendasSummary(await summaryRes.json());
      setPedidos(await pedidosRes.json());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [statusFiltro, vendedorFiltro, dataInicio, dataFim]);

  useEffect(() => { setDefaultDates(); }, [setDefaultDates]);

  useEffect(() => { if (dataInicio && dataFim) fetchData(); }, [dataInicio, dataFim, fetchData]);

  const vendedoresOptions = useMemo(() => ([{ label: 'Todos Vendedores', value: '' }, ...membros.map(m => ({ label: m.usuario.nome, value: m.usuarioId }))]), [membros]);

  return (
    <div className="space-y-6">
      {isModalOpen && <PedidoModal onClose={() => setIsModalOpen(false)} onSave={fetchData} editingPedidoId={editingPedidoId} />}

      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex justify-between items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-800">Vendas</h1>
            <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-500" />
                <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="input-style text-sm p-1.5" />
                <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="input-style text-sm p-1.5" />
                <Dropdown options={vendedoresOptions} value={vendedorFiltro} onChange={setVendedorFiltro} className="w-48" />
                <button onClick={handleResetFilters} className="btn-secondary p-2" title="Limpar Filtros"><RefreshCw className="w-4 h-4" /></button>
                <button onClick={() => setIsModalOpen(true)} className="btn-primary inline-flex items-center gap-2">
                    <PlusCircle className="w-5 h-5" /><span>Novo Pedido</span>
                </button>
            </div>
        </div>
      </div>

      {vendasSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Todos" value={formatarValor(vendasSummary.summary.ALL.total)} subValue={`${vendasSummary.summary.ALL.count} pedidos`} description={`Ticket Médio: ${calcularTicketMedio(vendasSummary.summary.ALL.total, vendasSummary.summary.ALL.count)}`} icon={<ListChecks />} color="blue" onClick={() => setStatusFiltro('ALL')} isActive={statusFiltro === 'ALL'} />
          <StatCard title="Vendido" value={formatarValor(vendasSummary.summary.VENDIDO.total)} subValue={`${vendasSummary.summary.VENDIDO.count} pedidos`} description={`Ticket Médio: ${calcularTicketMedio(vendasSummary.summary.VENDIDO.total, vendasSummary.summary.VENDIDO.count)}`} icon={<TrendingUp />} color="green" onClick={() => setStatusFiltro(StatusPedido.VENDIDO)} isActive={statusFiltro === StatusPedido.VENDIDO} />
          <StatCard title="Orçamentos" value={formatarValor(vendasSummary.summary.ORCAMENTO.total)} subValue={`${vendasSummary.summary.ORCAMENTO.count} pedidos`} description={`Ticket Médio: ${calcularTicketMedio(vendasSummary.summary.ORCAMENTO.total, vendasSummary.summary.ORCAMENTO.count)}`} icon={<FileText />} color="yellow" onClick={() => setStatusFiltro(StatusPedido.ORCAMENTO)} isActive={statusFiltro === StatusPedido.ORCAMENTO} />
          <StatCard title="Recusados" value={formatarValor(vendasSummary.summary.RECUSADO.total)} subValue={`${vendasSummary.summary.RECUSADO.count} pedidos`} description={`Ticket Médio: ${calcularTicketMedio(vendasSummary.summary.RECUSADO.total, vendasSummary.summary.RECUSADO.count)}`} icon={<XCircle />} color="red" onClick={() => setStatusFiltro(StatusPedido.RECUSADO)} isActive={statusFiltro === StatusPedido.RECUSADO} />
        </div>
      )}

      <div className="bg-white rounded-lg border shadow-sm">
            {isLoading ? <p className="p-6">Carregando...</p> : error ? <p className="p-6 text-red-600">{error}</p> : (
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50"><th className="th-style">Nº</th><th className="th-style">Cliente</th><th className="th-style">Vendedor</th><th className="th-style">Data</th><th className="th-style text-right">Valor</th><th className="th-style text-center">Status</th></thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {pedidos.length > 0 ? pedidos.map((p) => (<tr key={p.id} className="hover:bg-gray-50"><td className="td-style font-medium">#{p.numeroPedido}</td><td className="td-style">{p.cliente.nome}</td><td className="td-style">{p.usuario.nome}</td><td className="td-style">{new Date(p.dataPedido).toLocaleDateString('pt-BR')}</td><td className="td-style text-right font-mono">{formatarValor(p.valorTotal)}</td><td className="td-style text-center"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${{'VENDIDO':'bg-green-100 text-green-800','ORCAMENTO':'bg-yellow-100 text-yellow-800','RECUSADO':'bg-red-100 text-red-800','PENDENTE':'bg-gray-100 text-gray-800'}[p.status]}`}>{p.status}</span></td></tr>)) : <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">Nenhum pedido encontrado.</td></tr>}
                </tbody>
            </table>
            )}
        </div>
    </div>
  );
}