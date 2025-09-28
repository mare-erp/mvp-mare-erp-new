
'use client';

import { useState, useEffect } from 'react';
import { Package, TrendingUp, TrendingDown, AlertTriangle, Plus, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { TipoItem } from '@prisma/client';
import ProdutoModal from './components/ProdutoModal'; // Importar o ProdutoModal

interface Produto {
  id: string;
  nome: string;
  sku: string;
  tipo: TipoItem;
  quantidadeEstoque: number;
  estoqueMinimo: number;
  estoqueMaximo: number;
  preco: number;
  custo: number;
}

interface EstoqueMetricas {
  totalProdutos: number;
  valorEstoqueCusto: number;
  valorEstoqueVenda: number;
  produtosEstoqueBaixo: number;
  produtosSemEstoque: number;
}

export default function EstoquePage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [metricas, setMetricas] = useState<EstoqueMetricas | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProdutoModal, setShowProdutoModal] = useState(false); // Alterado para showProdutoModal
  const [editingProdutoId, setEditingProdutoId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
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
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getStatusEstoque = (produto: Produto) => {
    if (produto.quantidadeEstoque === 0) return 'sem-estoque';
    if (produto.quantidadeEstoque <= produto.estoqueMinimo) return 'estoque-baixo';
    return 'normal';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sem-estoque': return 'text-red-600 bg-red-100';
      case 'estoque-baixo': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'sem-estoque': return 'Sem Estoque';
      case 'estoque-baixo': return 'Estoque Baixo';
      default: return 'Normal';
    }
  };

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
      const response = await fetch(`/api/estoque/produtos/${produtoId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchData(); // Recarregar dados
      } else {
        setError('Erro ao excluir produto');
      }
    } catch (err) {
      setError('Erro ao excluir produto');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Carregando dados do estoque...</div>
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
      {showProdutoModal && (
        <ProdutoModal
          onClose={() => setShowProdutoModal(false)}
          onSave={fetchData}
          editingProdutoId={editingProdutoId}
        />
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Estoque</h1>
          <p className="mt-2 text-gray-600">Controle de produtos e movimentações de estoque.</p>
        </div>
        <button 
          onClick={handleAddProduto}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Produto</span>
        </button>
      </div>

      {metricas && (
        <>
          {/* Cards de Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg border">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total de Produtos</p>
                  <p className="text-2xl font-bold text-gray-900">{metricas.totalProdutos}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Valor Estoque (Custo)</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(metricas.valorEstoqueCusto)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Valor Estoque (Venda)</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(metricas.valorEstoqueVenda)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Estoque Baixo</p>
                  <p className="text-2xl font-bold text-yellow-600">{metricas.produtosEstoqueBaixo}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-100">
                  <TrendingDown className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Sem Estoque</p>
                  <p className="text-2xl font-bold text-red-600">{metricas.produtosSemEstoque}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabela de Produtos */}
          <div className="bg-white rounded-lg border">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">Produtos em Estoque</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="th-style">SKU</th>
                    <th className="th-style">Nome</th>
                    <th className="th-style">Tipo</th>
                    <th className="th-style text-center">Estoque</th>
                    <th className="th-style text-center">Mín/Máx</th>
                    <th className="th-style text-right">Custo</th>
                    <th className="th-style text-right">Preço</th>
                    <th className="th-style text-center">Status</th>
                    <th className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {produtos.length > 0 ? produtos.map((produto) => {
                    const status = getStatusEstoque(produto);
                    return (
                      <tr key={produto.id}>
                        <td className="td-style font-medium text-gray-900">{produto.sku}</td>
                        <td className="td-style">{produto.nome}</td>
                        <td className="td-style">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            produto.tipo === 'PRODUTO' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {produto.tipo === 'PRODUTO' ? 'Produto' : 'Serviço'}
                          </span>
                        </td>
                        <td className="td-style text-center">
                          {produto.tipo === 'PRODUTO' ? produto.quantidadeEstoque : 'N/A'}
                        </td>
                        <td className="td-style text-center">
                          {produto.tipo === 'PRODUTO' ? `${produto.estoqueMinimo}/${produto.estoqueMaximo}` : 'N/A'}
                        </td>
                        <td className="td-style text-right">{formatCurrency(produto.custo)}</td>
                        <td className="td-style text-right">{formatCurrency(produto.preco)}</td>
                        <td className="td-style text-center">
                          {produto.tipo === 'PRODUTO' ? (
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
                              {getStatusText(status)}
                            </span>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center space-x-2 justify-end">
                            <button
                              onClick={() => handleEditProduto(produto.id)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Editar Produto"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduto(produto.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Excluir Produto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={9} className="px-6 py-4 text-center text-sm text-gray-500">
                        Nenhum produto cadastrado.
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

