'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Package, TrendingUp, TrendingDown, AlertTriangle, Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import { TipoItem } from '@prisma/client';
import StatCard from '@/app/components/ui/StatCard';

const ProdutoModal = dynamic(() => import('./components/ProdutoModal'), { ssr: false });

// --- Tipagens ---
interface Produto { id: string; nome: string; sku: string; tipo: TipoItem; quantidadeEstoque: number; estoqueMinimo: number; estoqueMaximo: number; preco: number; custo: number; }
interface EstoqueMetricas { totalProdutos: number; valorEstoqueCusto: number; valorEstoqueVenda: number; produtosEstoqueBaixo: number; produtosSemEstoque: number; }
type EstoqueFiltro = 'todos' | 'baixo' | 'sem';

export default function EstoquePage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [metricas, setMetricas] = useState<EstoqueMetricas | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProdutoModal, setShowProdutoModal] = useState(false);
  const [editingProdutoId, setEditingProdutoId] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<EstoqueFiltro>('todos');

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [produtosRes, metricasRes] = await Promise.all([
        fetch('/api/estoque/produtos'),
        fetch('/api/estoque/metricas')
      ]);

      if (produtosRes.ok && metricasRes.ok) {
        const produtosData = await produtosRes.json();
        const metricasData = await metricasRes.json();
        setProdutos(produtosData);
        setMetricas(metricasData);
      } else {
        setError('Erro ao carregar dados do estoque');
      }
    } catch (err) {
      setError('Erro ao carregar dados do estoque');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const filteredProdutos = useMemo(() => {
    if (filtro === 'todos') return produtos;
    if (filtro === 'baixo') return produtos.filter(p => p.tipo === 'PRODUTO' && p.quantidadeEstoque > 0 && p.estoqueMinimo > 0 && p.quantidadeEstoque <= p.estoqueMinimo);
    if (filtro === 'sem') return produtos.filter(p => p.tipo === 'PRODUTO' && p.quantidadeEstoque <= 0);
    return produtos;
  }, [produtos, filtro]);

  const handleAddProduto = () => {
    setEditingProdutoId(null);
    setShowProdutoModal(true);
  };

  const handleEditProduto = (produtoId: string) => {
    setEditingProdutoId(produtoId);
    setShowProdutoModal(true);
  };

  const handleDeleteProduto = async (produtoId: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    try {
      const response = await fetch(`/api/estoque/produtos/${produtoId}`, { method: 'DELETE' });
      if (response.ok) fetchData();
      else setError('Erro ao excluir produto');
    } catch (err) {
      setError('Erro ao excluir produto');
    }
  };

  if (isLoading) return <div className="p-6">Carregando...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      {showProdutoModal && <ProdutoModal onClose={() => setShowProdutoModal(false)} onSave={fetchData} editingProdutoId={editingProdutoId} />}

      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Estoque</h1>
            <div className="flex items-center gap-2">
                <button onClick={() => setFiltro('todos')} className="btn-secondary p-2" title="Limpar Filtros"><RefreshCw className="w-4 h-4" /></button>
                <button onClick={handleAddProduto} className="btn-primary inline-flex items-center gap-2">
                    <Plus className="w-5 h-5" /><span>Novo Produto</span>
                </button>
            </div>
        </div>
      </div>

      {metricas && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard title="Todos os Itens" value={metricas.totalProdutos.toString()} icon={<Package />} color="blue" onClick={() => setFiltro('todos')} isActive={filtro === 'todos'} />
          <StatCard title="Valor (Custo)" value={formatCurrency(metricas.valorEstoqueCusto)} icon={<TrendingUp />} color="green" />
          <StatCard title="Valor (Venda)" value={formatCurrency(metricas.valorEstoqueVenda)} icon={<TrendingUp />} color="purple" />
          <StatCard title="Estoque Baixo" value={metricas.produtosEstoqueBaixo.toString()} icon={<AlertTriangle />} color="yellow" onClick={() => setFiltro('baixo')} isActive={filtro === 'baixo'} />
          <StatCard title="Sem Estoque" value={metricas.produtosSemEstoque.toString()} icon={<TrendingDown />} color="red" onClick={() => setFiltro('sem')} isActive={filtro === 'sem'} />
        </div>
      )}

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Produtos em Estoque</h2>
          <span className="text-sm text-gray-500">{filteredProdutos.length} itens exibidos</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr><th className="th-style">SKU</th><th className="th-style">Nome</th><th className="th-style text-center">Estoque</th><th className="th-style text-right">Custo</th><th className="th-style text-right">Preço</th><th className="relative px-6 py-3"><span className="sr-only">Ações</span></th></tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProdutos.length > 0 ? filteredProdutos.map((produto) => (
                <tr key={produto.id} className="hover:bg-gray-50">
                  <td className="td-style font-medium text-gray-900">{produto.sku || '-'}</td>
                  <td className="td-style">{produto.nome}</td>
                  <td className="td-style text-center font-mono">{produto.tipo === 'PRODUTO' ? produto.quantidadeEstoque : 'N/A'}</td>
                  <td className="td-style text-right font-mono">{formatCurrency(produto.custo)}</td>
                  <td className="td-style text-right font-mono">{formatCurrency(produto.preco)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2 justify-end">
                      <button onClick={() => handleEditProduto(produto.id)} className="p-1 text-blue-600 hover:text-blue-800" title="Editar"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteProduto(produto.id)} className="p-1 text-red-600 hover:text-red-800" title="Excluir"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              )) : ( <tr><td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">Nenhum produto encontrado.</td></tr> )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}