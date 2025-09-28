// app/(dashboard)/configuracoes/empresa/page.tsx

'use client';

import { useEffect, useState } from 'react';

interface EmpresaData {
  nome: string;
  cnpj?: string | null;
}

export default function EmpresaSettingsPage() {
  const [empresa, setEmpresa] = useState<EmpresaData>({ nome: '', cnpj: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState({ message: '', type: '' });

  useEffect(() => {
    const fetchEmpresaData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/empresa');
        if (!response.ok) throw new Error('Falha ao buscar dados da empresa.');
        const data = await response.json();
        setEmpresa(data);
      } catch (error) {
        setFeedback({ message: (error as Error).message, type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchEmpresaData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEmpresa(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedback({ message: '', type: '' });
    try {
      const response = await fetch('/api/empresa', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(empresa),
      });

      const data = await response.json(); // Sempre tente ler a resposta

      if (!response.ok) {
        // MUDANÇA: Agora vamos extrair os detalhes do erro da API
        const errorMessage = data.details ? JSON.stringify(data.details) : data.message;
        throw new Error(errorMessage || 'Falha ao salvar as alterações.');
      }
      
      setFeedback({ message: 'Dados da empresa atualizados com sucesso!', type: 'success' });
    } catch (error) {
      setFeedback({ message: (error as Error).message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading && !empresa.nome) {
      return <div>Carregando...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Configurações da Empresa</h1>
      <p className="mt-2 text-gray-600">
        Atualize os dados da sua empresa. Essas informações aparecerão em orçamentos e relatórios.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 max-w-2xl space-y-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div>
            <label htmlFor="nome" className="text-sm font-medium text-gray-700">Nome da Empresa</label>
            <input id="nome" name="nome" type="text" required value={empresa.nome} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#003846] focus:border-[#003846]" />
          </div>
          <div className="mt-4">
            <label htmlFor="cnpj" className="text-sm font-medium text-gray-700">CNPJ</label>
            <input id="cnpj" name="cnpj" type="text" value={empresa.cnpj || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#003846] focus:border-[#003846]" />
          </div>
        </div>
        
        {feedback.message && (
          <div className={`p-4 rounded-md ${feedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {feedback.message}
          </div>
        )}

        <div className="flex justify-end">
          <button type="submit" disabled={isLoading} className="py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#003846] hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#003846] disabled:bg-gray-400">
            {isLoading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
}