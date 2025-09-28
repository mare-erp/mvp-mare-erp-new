
'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
import { Dropdown } from '@/app/components/ui/Dropdown';
import { TipoItem } from '@prisma/client';

interface ProdutoModalProps {
  onClose: () => void;
  onSave: () => void;
  editingProdutoId?: string | null;
}

export default function ProdutoModal({ onClose, onSave, editingProdutoId }: ProdutoModalProps) {
  const [formData, setFormData] = useState({
    nome: '',
    sku: '',
    tipo: TipoItem.PRODUTO,
    quantidadeEstoque: 0,
    estoqueMinimo: 0,
    estoqueMaximo: 0,
    preco: 0,
    custo: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (editingProdutoId) {
      const fetchProduto = async () => {
        try {
          const response = await fetch(`/api/estoque/produtos/${editingProdutoId}`);
          if (response.ok) {
            const produto = await response.json();
            setFormData({
              nome: produto.nome,
              sku: produto.sku,
              tipo: produto.tipo,
              quantidadeEstoque: produto.quantidadeEstoque,
              estoqueMinimo: produto.estoqueMinimo,
              estoqueMaximo: produto.estoqueMaximo,
              preco: produto.preco,
              custo: produto.custo,
            });
          } else {
            setError('Erro ao carregar dados do produto.');
          }
        } catch (err) {
          setError('Erro ao carregar dados do produto.');
        }
      };
      fetchProduto();
    } else {
      setFormData({
        nome: '',
        sku: '',
        tipo: TipoItem.PRODUTO,
        quantidadeEstoque: 0,
        estoqueMinimo: 0,
        estoqueMaximo: 0,
        preco: 0,
        custo: 0,
      });
    }
  }, [editingProdutoId]);

  const tipoItemOptions = [
    { label: 'Produto', value: TipoItem.PRODUTO },
    { label: 'Serviço', value: TipoItem.SERVICO },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleDropdownChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const url = editingProdutoId ? `/api/estoque/produtos/${editingProdutoId}` : '/api/estoque/produtos';
      const method = editingProdutoId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Falha ao salvar produto.');
      }

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl z-50 w-full max-w-md h-auto flex flex-col">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {editingProdutoId ? 'Editar Produto' : 'Novo Produto'}
          </h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>

        <main className="p-6 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <Input id="nome" name="nome" type="text" required value={formData.nome} onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <Input id="sku" name="sku" type="text" value={formData.sku} onChange={handleChange} />
            </div>
            <Dropdown
              label="Tipo"
              options={tipoItemOptions}
              value={formData.tipo}
              onChange={(value) => handleDropdownChange('tipo', value as TipoItem)}
            />
            <div>
              <label htmlFor="quantidadeEstoque" className="block text-sm font-medium text-gray-700 mb-1">Quantidade em Estoque</label>
              <Input id="quantidadeEstoque" name="quantidadeEstoque" type="number" value={formData.quantidadeEstoque} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="estoqueMinimo" className="block text-sm font-medium text-gray-700 mb-1">Estoque Mínimo</label>
                <Input id="estoqueMinimo" name="estoqueMinimo" type="number" value={formData.estoqueMinimo} onChange={handleChange} />
              </div>
              <div>
                <label htmlFor="estoqueMaximo" className="block text-sm font-medium text-gray-700 mb-1">Estoque Máximo</label>
                <Input id="estoqueMaximo" name="estoqueMaximo" type="number" value={formData.estoqueMaximo} onChange={handleChange} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="custo" className="block text-sm font-medium text-gray-700 mb-1">Custo</label>
                <Input id="custo" name="custo" type="number" step="0.01" value={formData.custo} onChange={handleChange} />
              </div>
              <div>
                <label htmlFor="preco" className="block text-sm font-medium text-gray-700 mb-1">Preço de Venda</label>
                <Input id="preco" name="preco" type="number" step="0.01" value={formData.preco} onChange={handleChange} />
              </div>
            </div>
            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          </div>
        </main>

        <div className="p-6 border-t flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} isLoading={isLoading}>Salvar Produto</Button>
        </div>
      </div>
    </div>
  );
}

