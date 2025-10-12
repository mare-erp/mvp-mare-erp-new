
'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
import { Dropdown } from '@/app/components/ui/Dropdown';


import { useData } from '@/app/contexts/DataContexts';

interface TransacaoModalProps {
  onClose: () => void;
  onSave: () => void;
  editingTransacaoId?: string | null;
}

interface Cliente {
  id: string;
  nome: string;
}

export default function TransacaoModal({ onClose, onSave, editingTransacaoId }: TransacaoModalProps) {
  const [formData, setFormData] = useState({
    descricao: '',
    valor: 0,
    tipo: 'RECEITA',
    status: 'PENDENTE',
    dataVencimento: '',
    dataPagamento: '',
    clienteId: '',
    observacoes: '',
  });
  const { clientes, fetchClientes } = useData();

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (editingTransacaoId) {
      const fetchTransacao = async () => {
        try {
          const response = await fetch(`/api/financeiro/transacoes/${editingTransacaoId}`);
          if (response.ok) {
            const transacao = await response.json();
            setFormData({
              descricao: transacao.descricao,
              valor: transacao.valor,
              tipo: transacao.tipo,
              status: transacao.status,
              dataVencimento: transacao.dataVencimento ? new Date(transacao.dataVencimento).toISOString().split('T')[0] : '',
              dataPagamento: transacao.dataPagamento ? new Date(transacao.dataPagamento).toISOString().split('T')[0] : '',
              clienteId: transacao.clienteId || '',
              observacoes: transacao.observacoes || '',
            });
          } else {
            setError('Erro ao carregar dados da transação.');
          }
        } catch (err) {
          setError('Erro ao carregar dados da transação.');
        }
      };
      fetchTransacao();
    } else {
      setFormData({
        descricao: '',
        valor: 0,
        tipo: 'RECEITA',
        status: 'PENDENTE',
        dataVencimento: '',
        dataPagamento: '',
        clienteId: '',
        observacoes: '',
      });
    }
  }, [editingTransacaoId]);

  const tipoTransacaoOptions = [
    { label: 'Receita', value: 'RECEITA' },
    { label: 'Despesa', value: 'DESPESA' },
  ];

  const statusTransacaoOptions = [
    { label: 'Pendente', value: 'PENDENTE' },
    { label: 'Paga', value: 'PAGA' },
    { label: 'Atrasada', value: 'ATRASADA' },
    { label: 'Cancelada', value: 'CANCELADA' },
  ];

  const clienteOptions = clientes.map(cliente => ({ label: cliente.nome, value: cliente.id }));
  clienteOptions.unshift({ label: 'Nenhum', value: '' }); // Opção para não selecionar cliente

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      const url = editingTransacaoId ? `/api/financeiro/transacoes/${editingTransacaoId}` : '/api/financeiro/transacoes';
      const method = editingTransacaoId ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        valor: parseFloat(formData.valor.toString()),
        dataVencimento: formData.dataVencimento ? new Date(formData.dataVencimento).toISOString() : null,
        dataPagamento: formData.dataPagamento ? new Date(formData.dataPagamento).toISOString() : null,
        clienteId: formData.clienteId || null,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Falha ao salvar transação.');
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl z-50 w-full max-w-xl h-auto flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {editingTransacaoId ? 'Editar Transação' : 'Nova Transação'}
          </h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>

        <main className="p-6 overflow-y-auto flex-grow">
          <div className="space-y-4">
            <div>
              <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <Input id="descricao" name="descricao" type="text" required value={formData.descricao} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Dropdown
                label="Tipo"
                options={tipoTransacaoOptions}
                value={formData.tipo}
                onChange={(value) => handleDropdownChange('tipo', value)}
              />
              <Dropdown
                label="Status"
                options={statusTransacaoOptions}
                value={formData.status}
                onChange={(value) => handleDropdownChange('status', value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="dataVencimento" className="block text-sm font-medium text-gray-700 mb-1">Data de Vencimento</label>
                <Input id="dataVencimento" name="dataVencimento" type="date" required value={formData.dataVencimento} onChange={handleChange} />
              </div>
              <div>
                <label htmlFor="dataPagamento" className="block text-sm font-medium text-gray-700 mb-1">Data de Pagamento (opcional)</label>
                <Input id="dataPagamento" name="dataPagamento" type="date" value={formData.dataPagamento} onChange={handleChange} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="valor" className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                <Input id="valor" name="valor" type="number" step="0.01" required value={formData.valor} onChange={handleChange} />
              </div>
              <Dropdown
                label="Parte Envolvida (opcional)"
                options={clienteOptions}
                value={formData.clienteId}
                onChange={(value) => handleDropdownChange('clienteId', value)}
              />
            </div>
            <div>
              <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 mb-1">Observações (opcional)</label>
              <textarea
                id="observacoes" name="observacoes"
                value={formData.observacoes}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A2F5B] focus:border-transparent"
              ></textarea>
            </div>
            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          </div>
        </main>

        <div className="p-6 border-t flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} isLoading={isLoading}>Salvar Transação</Button>
        </div>
      </div>
    </div>
  );
}
