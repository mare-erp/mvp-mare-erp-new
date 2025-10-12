'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Building2, MapPin, Phone, Mail, FileText, Save } from 'lucide-react';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';

export default function SetupEmpresaPage() {
  const router = useRouter();
  const formatCNPJ = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    if (digits.length <= 12) {
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    }
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
  };

  const formatTelefone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (!digits) return '';
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const formatCEP = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  };

  const sanitizeDigits = (value: string) => value.replace(/\D/g, '');

  const formatIncomingCompany = (empresa: any) => ({
    nome: empresa.nome || '',
    cnpj: empresa.cnpj ? formatCNPJ(empresa.cnpj) : '',
    telefone: empresa.telefone ? formatTelefone(empresa.telefone) : '',
    email: empresa.email || '',
    cep: empresa.cep ? formatCEP(empresa.cep) : '',
    rua: empresa.rua || '',
    numero: empresa.numero || '',
    complemento: empresa.complemento || '',
    bairro: empresa.bairro || '',
    cidade: empresa.cidade || '',
    uf: empresa.uf || '',
  });
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    telefone: '',
    email: '',
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [empresaExistente, setEmpresaExistente] = useState<any>(null);

  useEffect(() => {
    // Verificar se já existe empresa configurada
    const verificarEmpresa = async () => {
      try {
        const response = await fetch('/api/empresa/current');
        if (response.ok) {
          const empresa = await response.json();
          setEmpresaExistente(empresa);
          setFormData(formatIncomingCompany(empresa));
        }
      } catch (error) {
        console.error('Erro ao verificar empresa:', error);
      }
    };

    verificarEmpresa();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      let newValue = value;
      if (name === 'cnpj') newValue = formatCNPJ(value);
      if (name === 'telefone') newValue = formatTelefone(value);
      if (name === 'cep') newValue = formatCEP(value);
      return { ...prev, [name]: newValue };
    });
  };

  const buscarCEP = async (cep: string) => {
    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            rua: data.logradouro || '',
            bairro: data.bairro || '',
            cidade: data.localidade || '',
            uf: data.uf || '',
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      }
    }
  };

  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value);
    const digits = sanitizeDigits(formatted);
    setFormData(prev => ({ ...prev, cep: formatted }));
    if (digits.length === 8) {
      buscarCEP(digits);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const url = '/api/empresa';
      const method = empresaExistente ? 'PUT' : 'POST';
      const payload = {
        ...formData,
        cnpj: formData.cnpj ? sanitizeDigits(formData.cnpj) : null,
        telefone: formData.telefone ? sanitizeDigits(formData.telefone) : null,
        cep: formData.cep ? sanitizeDigits(formData.cep) : null,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Falha ao configurar empresa.');
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const pularConfiguracao = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F2F5] via-white to-[#F0F2F5] p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <div className="flex justify-center mb-6">
            <div className="relative h-12 w-48">
              <Image
                src="/logo.svg"
                alt="Maré ERP"
                fill={true}
                style={{ objectFit: 'contain' }}
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-[#1A202C] mb-4">
            {empresaExistente ? 'Configurar Empresa' : 'Configure sua Empresa'}
          </h1>
          <p className="text-lg text-[#718096] max-w-2xl mx-auto">
            {empresaExistente 
              ? 'Atualize as informações da sua empresa para personalizar o sistema.'
              : 'Complete as informações da sua empresa para começar a usar o Maré ERP com todas as funcionalidades.'
            }
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Informações Básicas */}
            <div>
              <div className="flex items-center mb-4">
                <Building2 className="w-5 h-5 text-[#0A2F5B] mr-2" />
                <h2 className="text-xl font-semibold text-[#1A202C]">Informações Básicas</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="nome" className="block text-sm font-medium text-[#718096] mb-1">
                    Nome da Empresa *
                  </label>
                  <Input
                    id="nome"
                    name="nome"
                    type="text"
                    placeholder="Nome da sua empresa"
                    required
                    value={formData.nome}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="cnpj" className="block text-sm font-medium text-[#718096] mb-1">
                    CNPJ
                  </label>
                  <Input
                    id="cnpj"
                    name="cnpj"
                    type="text"
                    placeholder="00.000.000/0000-00"
                    value={formData.cnpj}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Contato */}
            <div>
              <div className="flex items-center mb-4">
                <Phone className="w-5 h-5 text-[#0A2F5B] mr-2" />
                <h2 className="text-xl font-semibold text-[#1A202C]">Contato</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="telefone" className="block text-sm font-medium text-[#718096] mb-1">
                    Telefone
                  </label>
                  <Input
                    id="telefone"
                    name="telefone"
                    type="text"
                    placeholder="(11) 99999-9999"
                    value={formData.telefone}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#718096] mb-1">
                    E-mail
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="contato@empresa.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div>
              <div className="flex items-center mb-4">
                <MapPin className="w-5 h-5 text-[#0A2F5B] mr-2" />
                <h2 className="text-xl font-semibold text-[#1A202C]">Endereço</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="cep" className="block text-sm font-medium text-[#718096] mb-1">
                    CEP
                  </label>
                  <Input
                    id="cep"
                    name="cep"
                    type="text"
                    placeholder="00000-000"
                    value={formData.cep}
                    onChange={handleCEPChange}
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="rua" className="block text-sm font-medium text-[#718096] mb-1">
                    Rua
                  </label>
                  <Input
                    id="rua"
                    name="rua"
                    type="text"
                    placeholder="Nome da rua"
                    value={formData.rua}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-4 gap-6 mt-6">
                <div>
                  <label htmlFor="numero" className="block text-sm font-medium text-[#718096] mb-1">
                    Número
                  </label>
                  <Input
                    id="numero"
                    name="numero"
                    type="text"
                    placeholder="123"
                    value={formData.numero}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="complemento" className="block text-sm font-medium text-[#718096] mb-1">
                    Complemento
                  </label>
                  <Input
                    id="complemento"
                    name="complemento"
                    type="text"
                    placeholder="Sala 1"
                    value={formData.complemento}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="bairro" className="block text-sm font-medium text-[#718096] mb-1">
                    Bairro
                  </label>
                  <Input
                    id="bairro"
                    name="bairro"
                    type="text"
                    placeholder="Centro"
                    value={formData.bairro}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="cidade" className="block text-sm font-medium text-[#718096] mb-1">
                    Cidade
                  </label>
                  <Input
                    id="cidade"
                    name="cidade"
                    type="text"
                    placeholder="São Paulo"
                    value={formData.cidade}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="mt-6">
                <label htmlFor="uf" className="block text-sm font-medium text-[#718096] mb-1">
                  Estado (UF)
                </label>
                <select
                  id="uf"
                  name="uf"
                  value={formData.uf}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A2F5B] focus:border-transparent"
                >
                  <option value="">Selecione o estado</option>
                  <option value="AC">Acre</option>
                  <option value="AL">Alagoas</option>
                  <option value="AP">Amapá</option>
                  <option value="AM">Amazonas</option>
                  <option value="BA">Bahia</option>
                  <option value="CE">Ceará</option>
                  <option value="DF">Distrito Federal</option>
                  <option value="ES">Espírito Santo</option>
                  <option value="GO">Goiás</option>
                  <option value="MA">Maranhão</option>
                  <option value="MT">Mato Grosso</option>
                  <option value="MS">Mato Grosso do Sul</option>
                  <option value="MG">Minas Gerais</option>
                  <option value="PA">Pará</option>
                  <option value="PB">Paraíba</option>
                  <option value="PR">Paraná</option>
                  <option value="PE">Pernambuco</option>
                  <option value="PI">Piauí</option>
                  <option value="RJ">Rio de Janeiro</option>
                  <option value="RN">Rio Grande do Norte</option>
                  <option value="RS">Rio Grande do Sul</option>
                  <option value="RO">Rondônia</option>
                  <option value="RR">Roraima</option>
                  <option value="SC">Santa Catarina</option>
                  <option value="SP">São Paulo</option>
                  <option value="SE">Sergipe</option>
                  <option value="TO">Tocantins</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Botões */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6">
              <button
                type="button"
                onClick={pularConfiguracao}
                className="text-[#718096] hover:text-[#0A2F5B] font-medium transition-colors"
              >
                Pular configuração (pode ser feita depois)
              </button>
              <div className="flex gap-4">
                <Button
                  type="submit"
                  isLoading={isLoading}
                  className="bg-[#0A2F5B] text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-[#00BFA5] transition-colors flex items-center"
                >
                  <Save className="w-5 h-5 mr-2" />
                  {isLoading ? 'Salvando...' : empresaExistente ? 'Atualizar' : 'Salvar e Continuar'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
