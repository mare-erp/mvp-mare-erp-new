
// app/(dashboard)/clientes/novo/page.tsx

'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
import { Dropdown } from '@/app/components/ui/Dropdown'; // Importar o componente Dropdown
import { TipoPessoa } from '@prisma/client';

export default function NovoClientePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nome: '',
    tipoPessoa: 'FISICA' as TipoPessoa,
    cpfCnpj: '',
    email: '',
    telefone: '',
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
  });
  const [feedback, setFeedback] = useState({ message: '', type: '' });
  const [isCepLoading, setIsCepLoading] = useState(false);

  const tipoPessoaOptions = [
    { label: 'Pessoa Física', value: 'FISICA' },
    { label: 'Pessoa Jurídica', value: 'JURIDICA' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDropdownChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCepSearch = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;

    setIsCepLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();
      if (data.erro) {
        throw new Error('CEP não encontrado.');
      }
      setFormData(prev => ({
        ...prev,
        rua: data.logradouro,
        bairro: data.bairro,
        cidade: data.localidade,
        uf: data.uf,
      }));
    } catch (error) {
        setFeedback({ message: 'CEP não encontrado.', type: 'error' });
    } finally {
        setIsCepLoading(false);
    }
  };


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback({ message: '', type: '' });
    try {
      const response = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Falha ao cadastrar cliente.');
      router.push('/clientes');
    } catch (err) {
      setFeedback({ message: (err as Error).message, type: 'error' });
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Novo Cliente</h1>
      <p className="mt-2 text-gray-600">Preencha os dados para cadastrar um novo cliente.</p>

      <form onSubmit={handleSubmit} className="mt-8 max-w-2xl space-y-6">
        {/* Bloco de Informações Pessoais */}
        <div className="bg-white p-6 rounded-lg border space-y-4">
          <h3 className="text-lg font-medium">Dados Principais</h3>
          <div>
            <label htmlFor="nome" className="text-sm font-medium">
                {formData.tipoPessoa === 'JURIDICA' ? 'Razão Social *' : 'Nome *'}
            </label>
            <Input id="nome" name="nome" type="text" required value={formData.nome} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Dropdown
              label="Tipo *"
              options={tipoPessoaOptions}
              value={formData.tipoPessoa}
              onChange={(value) => handleDropdownChange('tipoPessoa', value)}
            />
            <div>
              <label htmlFor="cpfCnpj" className="text-sm font-medium">
                {formData.tipoPessoa === 'JURIDICA' ? 'CNPJ *' : 'CPF (opcional)'}
              </label>
              <Input id="cpfCnpj" name="cpfCnpj" type="text" value={formData.cpfCnpj} required={formData.tipoPessoa === 'JURIDICA'} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* Bloco de Contato (agora 100% opcional) */}
        <div className="bg-white p-6 rounded-lg border space-y-4">
            <h3 className="text-lg font-medium">Contato (opcional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="email" className="text-sm font-medium">E-mail</label>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
                </div>
                <div>
                    <label htmlFor="telefone" className="text-sm font-medium">Telefone</label>
                    <Input id="telefone" name="telefone" type="text" value={formData.telefone} onChange={handleChange} />
                </div>
            </div>
        </div>

        {/* Bloco de Endereço (agora 100% opcional) */}
        <div className="bg-white p-6 rounded-lg border space-y-4">
            <h3 className="text-lg font-medium">Endereço (opcional)</h3>
             <div>
                <label htmlFor="cep" className="text-sm font-medium">CEP</label>
                <div className="flex items-center gap-2">
                    <Input id="cep" name="cep" type="text" value={formData.cep} onChange={handleChange} onBlur={(e) => handleCepSearch(e.target.value)} />
                    {isCepLoading && <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-900"></div>}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                    <label htmlFor="rua" className="text-sm font-medium">Rua</label>
                    <Input id="rua" name="rua" type="text" value={formData.rua} onChange={handleChange} readOnly />
                </div>
                <div>
                    <label htmlFor="numero" className="text-sm font-medium">Número</label>
                    <Input id="numero" name="numero" type="text" value={formData.numero} onChange={handleChange} />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="complemento" className="text-sm font-medium">Complemento</label>
                    <Input id="complemento" name="complemento" type="text" value={formData.complemento} onChange={handleChange} />
                </div>
                <div>
                    <label htmlFor="bairro" className="text-sm font-medium">Bairro</label>
                    <Input id="bairro" name="bairro" type="text" value={formData.bairro} onChange={handleChange} readOnly />
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                    <label htmlFor="cidade" className="text-sm font-medium">Cidade</label>
                    <Input id="cidade" name="cidade" type="text" value={formData.cidade} onChange={handleChange} readOnly />
                </div>
                <div>
                    <label htmlFor="uf" className="text-sm font-medium">UF</label>
                    <Input id="uf" name="uf" type="text" value={formData.uf} onChange={handleChange} readOnly />
                </div>
            </div>
        </div>
        
        {feedback.message && (
          <div className={`p-4 rounded-md ${feedback.type === 'error' ? 'bg-red-100 text-red-800' : ''}`}>{feedback.message}</div>
        )}

        <div className="flex justify-end gap-4">
          <Button type="button" onClick={() => router.back()} variant="secondary">Cancelar</Button>
          <Button type="submit">Salvar Cliente</Button>
        </div>
      </form>
    </div>
  );
}

