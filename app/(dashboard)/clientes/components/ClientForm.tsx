"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';

export default function ClientForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nome: '',
    tipoPessoa: 'FISICA',
    cpfCnpj: '',
    email: '',
    telefone: '',
    endereco: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        // Trata erros de validação da API
        if (Array.isArray(data.error)) {
          const firstError = data.error[0];
          throw new Error(`${firstError.path.join('.')}: ${firstError.message}`);
        }
        throw new Error(data.error || 'Falha ao cadastrar cliente.');
      }

      router.push('/clientes');
      router.refresh(); // Garante que a lista de clientes será atualizada
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 max-w-2xl">
      <div className="space-y-6">
        <div>
          <label htmlFor="tipoPessoa" className="block text-sm font-medium text-gray-700">Tipo de Cliente</label>
          <select
            id="tipoPessoa"
            name="tipoPessoa"
            value={formData.tipoPessoa}
            onChange={handleChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="FISICA">Pessoa Física</option>
            <option value="JURIDICA">Pessoa Jurídica</option>
          </select>
        </div>

        <div>
          <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
            {formData.tipoPessoa === 'FISICA' ? 'Nome Completo' : 'Razão Social'}
          </label>
          <Input id="nome" name="nome" type="text" required value={formData.nome} onChange={handleChange} placeholder="Digite o nome do cliente" />
        </div>
        
        <div>
          <label htmlFor="cpfCnpj" className="block text-sm font-medium text-gray-700">
            {formData.tipoPessoa === 'FISICA' ? 'CPF' : 'CNPJ'}
          </label>
          <Input id="cpfCnpj" name="cpfCnpj" type="text" required value={formData.cpfCnpj} onChange={handleChange} placeholder="Apenas números" />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-mail</label>
          <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="contato@cliente.com" />
        </div>

        <div>
          <label htmlFor="telefone" className="block text-sm font-medium text-gray-700">Telefone</label>
          <Input id="telefone" name="telefone" type="text" value={formData.telefone} onChange={handleChange} placeholder="(11) 99999-9999" />
        </div>

        <div>
          <label htmlFor="endereco" className="block text-sm font-medium text-gray-700">Endereço</label>
          <Input id="endereco" name="endereco" type="text" value={formData.endereco} onChange={handleChange} placeholder="Rua, número, bairro..." />
        </div>

        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
      </div>

      <div className="mt-8 border-t border-gray-200 pt-6 flex items-center justify-end space-x-4">
        <Button type="button" variant="secondary" onClick={() => router.push('/clientes')}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={isLoading} disabled={isLoading}>
          {isLoading ? 'Salvando...' : 'Salvar Cliente'}
        </Button>
      </div>
    </form>
  );
}
