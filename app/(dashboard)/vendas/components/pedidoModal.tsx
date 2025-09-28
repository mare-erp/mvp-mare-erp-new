
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useData } from '@/app/contexts/DataContexts';
import { StatusPedido, TipoItem } from '@prisma/client';
import { X, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
import { Dropdown } from '@/app/components/ui/Dropdown';

interface PedidoModalProps {
  onClose: () => void;
  onSave: () => void;
  editingPedidoId?: string | null;
}

interface ItemPedido {
  id?: string; // Para itens existentes
  produtoId?: string;
  descricao: string;
  quantidade: number;
  precoUnitario: number;
  tipo: TipoItem;
}

export default function PedidoModal({ onClose, onSave, editingPedidoId }: PedidoModalProps) {
  const { clientes, produtos, membros, fetchData: refreshContextData } = useData();
  const [numeroPedido, setNumeroPedido] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [status, setStatus] = useState<StatusPedido>(StatusPedido.ORCAMENTO);
  const [validadeOrcamento, setValidadeOrcamento] = useState('');
  const [dataEntrega, setDataEntrega] = useState('');
  const [frete, setFrete] = useState(0);
  const [informacoesNegociacao, setInformacoesNegociacao] = useState('');
  const [observacoesNF, setObservacoesNF] = useState('');
  const [itens, setItens] = useState<ItemPedido[]>([]);
  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para cadastro rápido
  const [showClienteQuickCreate, setShowClienteQuickCreate] = useState(false);
  const [showProdutoQuickCreate, setShowProdutoQuickCreate] = useState(false);
  const [novoClienteNome, setNovoClienteNome] = useState('');
  const [novoClienteCpfCnpj, setNovoClienteCpfCnpj] = useState('');
  const [novoProdutoNome, setNovoProdutoNome] = useState('');
  const [novoProdutoDescricao, setNovoProdutoDescricao] = useState('');
  const [novoProdutoPreco, setNovoProdutoPreco] = useState('');
  const [novoProdutoTipo, setNovoProdutoTipo] = useState<TipoItem>(TipoItem.PRODUTO);

  const statusOptions = [
    { label: 'Orçamento', value: StatusPedido.ORCAMENTO },
    { label: 'Vendido', value: StatusPedido.VENDIDO },
    { label: 'Recusado', value: StatusPedido.RECUSADO },
  ];

  const clienteOptions = useMemo(() => {
    return [{ label: 'Selecione um cliente', value: '' }, ...clientes.map(c => ({ label: c.nome, value: c.id }))];
  }, [clientes]);

  const produtoOptions = useMemo(() => {
    return [{ label: 'Selecione um item', value: '' }, ...produtos.map(p => ({ label: `${p.nome} (${p.tipo})`, value: p.id }))];
  }, [produtos]);

  const tipoItemOptions = [
    { label: 'Produto', value: TipoItem.PRODUTO },
    { label: 'Serviço', value: TipoItem.SERVICO },
  ];

  // Carregar próximo número de pedido
  useEffect(() => {
    if (!editingPedidoId) {
      const fetchNextNumber = async () => {
        try {
          const response = await fetch('/api/pedidos/next-number');
          if (response.ok) {
            const data = await response.json();
            setNumeroPedido(data.nextNumber.toString());
          }
        } catch (error) {
          console.error('Erro ao buscar próximo número:', error);
        }
      };
      fetchNextNumber();
    }
  }, [editingPedidoId]);

  // Carregar dados do pedido para edição
  useEffect(() => {
    if (editingPedidoId) {
      const loadPedido = async () => {
        try {
          const response = await fetch(`/api/vendas/${editingPedidoId}`);
          if (response.ok) {
            const pedido = await response.json();
            setNumeroPedido(pedido.numeroPedido.toString());
            setClienteId(pedido.clienteId);
            setStatus(pedido.status);
            setValidadeOrcamento(pedido.validadeOrcamento ? pedido.validadeOrcamento.split('T')[0] : '');
            setDataEntrega(pedido.dataEntrega ? pedido.dataEntrega.split('T')[0] : '');
            setFrete(Number(pedido.frete) || 0);
            setInformacoesNegociacao(pedido.informacoesNegociacao || '');
            setObservacoesNF(pedido.observacoesNF || '');
            setItens(pedido.itens.map((item: any) => ({
              id: item.id,
              produtoId: item.produtoId,
              descricao: item.produto?.nome || item.descricao, // Usar nome do produto se disponível
              quantidade: item.quantidade,
              precoUnitario: Number(item.precoUnitario),
              tipo: item.produto?.tipo || TipoItem.PRODUTO, // Assumir PRODUTO se não especificado
            })));
          } else {
            setFeedback('Erro ao carregar dados do pedido');
          }
        } catch (error) {
          setFeedback('Erro ao carregar dados do pedido');
        }
      };
      loadPedido();
    } else {
      // Resetar formulário ao abrir para novo pedido
      setClienteId('');
      setStatus(StatusPedido.ORCAMENTO);
      setValidadeOrcamento('');
      setDataEntrega('');
      setFrete(0);
      setInformacoesNegociacao('');
      setObservacoesNF('');
      setItens([]);
      setProdutoSelecionadoId('');
      setFeedback('');
    }
  }, [editingPedidoId]);

  const handleCreateCliente = async () => {
    if (!novoClienteNome.trim()) {
      setFeedback('Nome do cliente é obrigatório');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: novoClienteNome,
          cpfCnpj: novoClienteCpfCnpj || null,
          tipoPessoa: 'FISICA', // Default para cadastro rápido
        })
      });

      if (response.ok) {
        const novoCliente = await response.json();
        setClienteId(novoCliente.id);
        setShowClienteQuickCreate(false);
        setNovoClienteNome('');
        setNovoClienteCpfCnpj('');
        refreshContextData(); // Recarregar dados do contexto
      } else {
        const errorData = await response.json();
        setFeedback(errorData.message || 'Erro ao criar cliente');
      }
    } catch (error) {
      setFeedback('Erro ao criar cliente');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProduto = async () => {
    if (!novoProdutoNome.trim() || !novoProdutoPreco) {
      setFeedback('Nome e preço do produto são obrigatórios');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/produtos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: novoProdutoNome,
          descricao: novoProdutoDescricao,
          preco: parseFloat(novoProdutoPreco),
          tipo: novoProdutoTipo,
          quantidadeEstoque: 0, // Default para cadastro rápido
        })
      });

      if (response.ok) {
        const novoProduto = await response.json();
        setProdutoSelecionadoId(novoProduto.id);
        setShowProdutoQuickCreate(false);
        setNovoProdutoNome('');
        setNovoProdutoDescricao('');
        setNovoProdutoPreco('');
        setNovoProdutoTipo(TipoItem.PRODUTO);
        refreshContextData(); // Recarregar dados do contexto
      } else {
        const errorData = await response.json();
        setFeedback(errorData.message || 'Erro ao criar produto');
      }
    } catch (error) {
      setFeedback('Erro ao criar produto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = () => {
    const produto = produtos.find(p => p.id === produtoSelecionadoId);
    if (!produto) {
      setFeedback('Selecione um produto/serviço válido.');
      return;
    }

    setItens([...itens, {
      produtoId: produto.id,
      descricao: produto.nome,
      quantidade: 1,
      precoUnitario: Number(produto.preco),
      tipo: produto.tipo as TipoItem,
    }]);
    setProdutoSelecionadoId('');
    setFeedback('');
  };

  const handleRemoveItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    const updatedItens = [...itens];
    updatedItens[index] = { ...updatedItens[index], [field]: value };
    setItens(updatedItens);
  };
  
  const calcularSubtotalItem = (item: ItemPedido) => {
    return item.quantidade * item.precoUnitario;
  };

  const calcularSubtotal = useMemo(() => {
    return itens.reduce((acc, item) => acc + calcularSubtotalItem(item), 0);
  }, [itens]);

  const calcularTotal = useMemo(() => {
    return calcularSubtotal + frete;
  }, [calcularSubtotal, frete]);

  const handleSubmit = async () => {
    setFeedback('');
    if (!clienteId || itens.length === 0 || !numeroPedido) {
      setFeedback('Cliente, número do pedido e pelo menos um item são obrigatórios.');
      return;
    }
    
    try {
      setIsLoading(true);
      const url = editingPedidoId ? `/api/vendas/${editingPedidoId}` : '/api/vendas';
      const method = editingPedidoId ? 'PUT' : 'POST';
      
      const payload = {
        numeroPedido: parseInt(numeroPedido),
        clienteId,
        status,
        validadeOrcamento: validadeOrcamento ? new Date(validadeOrcamento).toISOString() : null,
        dataEntrega: dataEntrega ? new Date(dataEntrega).toISOString() : null,
        frete: parseFloat(frete.toString()),
        informacoesNegociacao: informacoesNegociacao || null,
        observacoesNF: observacoesNF || null,
        itens: itens.map(item => ({
          id: item.id, // Incluir ID para PUT
          produtoId: item.produtoId,
          descricao: item.descricao,
          quantidade: item.quantidade,
          precoUnitario: item.precoUnitario,
          tipo: item.tipo,
        })),
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao salvar o pedido.');
      }
      
      onSave();
      onClose();
    } catch (error) {
      setFeedback((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl z-50 w-full max-w-6xl h-[95vh] flex flex-col">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">
              {editingPedidoId ? 'Editar Pedido' : 'Novo Pedido'}
            </h2>
            <button onClick={onClose}><X className="w-5 h-5" /></button>
          </div>
        </div>

        <main className="p-6 flex-grow overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium">Número do Pedido *</label>
              <Input
                type="number"
                value={numeroPedido}
                onChange={(e) => setNumeroPedido(e.target.value)}
                placeholder="Ex: 1001"
                disabled={!!editingPedidoId} // Não permite editar o número do pedido em edição
              />
            </div>
            <Dropdown
              label="Status *"
              options={statusOptions}
              value={status}
              onChange={(value) => setStatus(value as StatusPedido)}
            />
            <div>
              <label className="text-sm font-medium">Data de Entrega</label>
              <Input
                type="date"
                value={dataEntrega}
                onChange={(e) => setDataEntrega(e.target.value)}
              />
            </div>
          </div>

          {status === StatusPedido.ORCAMENTO && (
            <div className="mb-4">
              <label className="text-sm font-medium">Validade do Orçamento</label>
              <Input
                type="date"
                value={validadeOrcamento}
                onChange={(e) => setValidadeOrcamento(e.target.value)}
              />
            </div>
          )}

          <div className="mb-4">
            <label className="text-sm font-medium">Cliente *</label>
            <div className="flex gap-2">
              <Dropdown
                options={clienteOptions}
                value={clienteId}
                onChange={setClienteId}
                placeholder="Selecione um cliente"
              />
              <Button 
                onClick={() => setShowClienteQuickCreate(true)}
                variant="secondary"
                className="whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {showClienteQuickCreate && (
            <div className="mb-4 p-4 border rounded-md bg-gray-50">
              <h3 className="font-semibold mb-2">Cadastro Rápido de Cliente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Input
                  type="text"
                  placeholder="Nome/Razão Social *"
                  value={novoClienteNome}
                  onChange={(e) => setNovoClienteNome(e.target.value)}
                />
                <Input
                  type="text"
                  placeholder="CPF/CNPJ"
                  value={novoClienteCpfCnpj}
                  onChange={(e) => setNovoClienteCpfCnpj(e.target.value)}
                />
              </div>
              <div className="flex gap-2 mt-2">
                <Button onClick={handleCreateCliente} isLoading={isLoading}>Criar Cliente</Button>
                <Button onClick={() => setShowClienteQuickCreate(false)} variant="secondary">Cancelar</Button>
              </div>
            </div>
          )}

          <div className="mb-4 p-4 border rounded-md">
            <h3 className="font-semibold mb-2">Adicionar Itens</h3>
            <div className="flex gap-2 items-end">
              <div className="flex-grow">
                <label className="text-sm font-medium">Produto / Serviço</label>
                <Dropdown
                  options={produtoOptions}
                  value={produtoSelecionadoId}
                  onChange={setProdutoSelecionadoId}
                  placeholder="Selecione um item"
                />
              </div>
              <Button 
                onClick={() => setShowProdutoQuickCreate(true)}
                variant="secondary"
              >
                <Plus className="w-4 h-4" />
              </Button>
              <Button onClick={handleAddItem} disabled={!produtoSelecionadoId}>
                Adicionar
              </Button>
            </div>
          </div>

          {showProdutoQuickCreate && (
            <div className="mb-4 p-4 border rounded-md bg-gray-50">
              <h3 className="font-semibold mb-2">Cadastro Rápido de Produto/Serviço</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Input
                  type="text"
                  placeholder="Nome *"
                  value={novoProdutoNome}
                  onChange={(e) => setNovoProdutoNome(e.target.value)}
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Preço *"
                  value={novoProdutoPreco}
                  onChange={(e) => setNovoProdutoPreco(e.target.value)}
                />
                <Input
                  type="text"
                  placeholder="Descrição"
                  value={novoProdutoDescricao}
                  onChange={(e) => setNovoProdutoDescricao(e.target.value)}
                />
                <Dropdown
                  options={tipoItemOptions}
                  value={novoProdutoTipo}
                  onChange={(value) => setNovoProdutoTipo(value as TipoItem)}
                />
              </div>
              <div className="flex gap-2 mt-2">
                <Button onClick={handleCreateProduto} isLoading={isLoading}>Criar Item</Button>
                <Button onClick={() => setShowProdutoQuickCreate(false)} variant="secondary">Cancelar</Button>
              </div>
            </div>
          )}
          
          <div className="space-y-2 mb-4">
            <h3 className="font-semibold">Itens do Pedido</h3>
            {itens.length === 0 && <p className="text-gray-500">Nenhum item adicionado.</p>}
            {itens.map((item, index) => (
              <div key={item.id || index} className="flex items-center gap-2 p-3 bg-gray-50 rounded border">
                <div className="flex-grow">
                  <Input
                    type="text"
                    value={item.descricao}
                    onChange={(e) => handleUpdateItem(index, 'descricao', e.target.value)}
                    placeholder="Descrição"
                  />
                  <div className="flex gap-2 mt-2">
                    <Input
                      type="number"
                      value={item.quantidade}
                      onChange={(e) => handleUpdateItem(index, 'quantidade', parseInt(e.target.value) || 1)}
                      placeholder="Qtd"
                      min="1"
                      className="w-20"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      value={item.precoUnitario}
                      onChange={(e) => handleUpdateItem(index, 'precoUnitario', parseFloat(e.target.value) || 0)}
                      placeholder="Preço Unitário"
                      className="flex-grow"
                    />
                    <span className="flex items-center text-gray-700 font-medium">
                      Total: {calcularSubtotalItem(item).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </div>
                <Button onClick={() => handleRemoveItem(index)} variant="ghost" size="icon">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium">Frete</label>
              <Input
                type="number"
                step="0.01"
                value={frete}
                onChange={(e) => setFrete(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Subtotal</label>
              <Input type="text" value={calcularSubtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} disabled />
            </div>
            <div>
              <label className="text-sm font-medium">Total do Pedido</label>
              <Input type="text" value={calcularTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} disabled />
            </div>
          </div>

          <div className="mb-4">
            <label className="text-sm font-medium">Informações de Negociação</label>
            <textarea
              value={informacoesNegociacao}
              onChange={(e) => setInformacoesNegociacao(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A2F5B] focus:border-transparent"
            ></textarea>
          </div>

          <div className="mb-4">
            <label className="text-sm font-medium">Observações para Nota Fiscal</label>
            <textarea
              value={observacoesNF}
              onChange={(e) => setObservacoesNF(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A2F5B] focus:border-transparent"
            ></textarea>
          </div>

          {feedback && <p className="text-sm text-red-600 text-center">{feedback}</p>}
        </main>

        <div className="p-6 border-t flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} isLoading={isLoading}>Salvar Pedido</Button>
        </div>
      </div>
    </div>
  );
}

