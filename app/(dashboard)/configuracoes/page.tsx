'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Building2, Users, User, FileText, Settings, Plus } from 'lucide-react';

type Tab = 'empresa' | 'equipe' | 'conta' | 'logs' | 'sistema' | 'organizacao';

export default function ConfiguracoesPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>('empresa');

  useEffect(() => {
    const tab = searchParams.get('tab') as Tab;
    if (tab && ['empresa', 'equipe', 'conta', 'logs', 'sistema', 'organizacao'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const tabs = [
    { id: 'organizacao' as Tab, name: 'Organização', icon: Plus },
    { id: 'empresa' as Tab, name: 'Empresa', icon: Building2 },
    { id: 'equipe' as Tab, name: 'Equipe', icon: Users },
    { id: 'conta' as Tab, name: 'Conta', icon: User },
    { id: 'logs' as Tab, name: 'Logs', icon: FileText },
    { id: 'sistema' as Tab, name: 'Sistema', icon: Settings },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'organizacao':
        return <OrganizacaoTab />;
      case 'empresa':
        return <EmpresaTab />;
      case 'equipe':
        return <EquipeTab />;
      case 'conta':
        return <ContaTab />;
      case 'logs':
        return <LogsTab />;
      case 'sistema':
        return <SistemaTab />;
      default:
        return <OrganizacaoTab />;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <p className="mt-2 text-gray-600">Gerencie as configurações do sistema e da empresa.</p>
      </div>

      <div className="bg-white rounded-lg border">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-[#003846] text-[#003846]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm inline-flex items-center gap-2`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}

function OrganizacaoTab() {
  const [organizacao, setOrganizacao] = useState({
    nome: '',
    empresas: [] as any[]
  });
  const [showEmpresaModal, setShowEmpresaModal] = useState(false);
  const [novaEmpresa, setNovaEmpresa] = useState({
    nome: '',
    cnpj: '',
    email: '',
    telefone: ''
  });

  const handleAddEmpresa = () => {
    if (novaEmpresa.nome) {
      const empresa = {
        id: Date.now().toString(),
        ...novaEmpresa,
        ativa: true
      };
      setOrganizacao(prev => ({
        ...prev,
        empresas: [...prev.empresas, empresa]
      }));
      setNovaEmpresa({ nome: '', cnpj: '', email: '', telefone: '' });
      setShowEmpresaModal(false);
    }
  };

  const handleRemoveEmpresa = (empresaId: string) => {
    setOrganizacao(prev => ({
      ...prev,
      empresas: prev.empresas.filter(e => e.id !== empresaId)
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Gerenciar Organização</h3>
        <p className="text-gray-600 mb-6">
          Configure sua organização e gerencie múltiplas empresas em um só lugar.
        </p>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome da Organização
          </label>
          <input
            type="text"
            value={organizacao.nome}
            onChange={(e) => setOrganizacao(prev => ({ ...prev, nome: e.target.value }))}
            className="input-style max-w-md"
            placeholder="Ex: Grupo Empresarial ABC"
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-md font-medium text-gray-900">Empresas da Organização</h4>
          <button
            onClick={() => setShowEmpresaModal(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova Empresa
          </button>
        </div>

        {organizacao.empresas.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma empresa cadastrada</p>
            <p className="text-sm text-gray-400">Clique em "Nova Empresa" para começar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {organizacao.empresas.map((empresa) => (
              <div key={empresa.id} className="border rounded-lg p-4 bg-white">
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-medium text-gray-900">{empresa.nome}</h5>
                  <button
                    onClick={() => handleRemoveEmpresa(empresa.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remover
                  </button>
                </div>
                {empresa.cnpj && (
                  <p className="text-sm text-gray-600">CNPJ: {empresa.cnpj}</p>
                )}
                {empresa.email && (
                  <p className="text-sm text-gray-600">Email: {empresa.email}</p>
                )}
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 mt-2">
                  Ativa
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para Nova Empresa */}
      {showEmpresaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Nova Empresa</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Empresa *
                </label>
                <input
                  type="text"
                  value={novaEmpresa.nome}
                  onChange={(e) => setNovaEmpresa(prev => ({ ...prev, nome: e.target.value }))}
                  className="input-style w-full"
                  placeholder="Ex: Empresa ABC Ltda"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CNPJ
                </label>
                <input
                  type="text"
                  value={novaEmpresa.cnpj}
                  onChange={(e) => setNovaEmpresa(prev => ({ ...prev, cnpj: e.target.value }))}
                  className="input-style w-full"
                  placeholder="00.000.000/0000-00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={novaEmpresa.email}
                  onChange={(e) => setNovaEmpresa(prev => ({ ...prev, email: e.target.value }))}
                  className="input-style w-full"
                  placeholder="contato@empresa.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={novaEmpresa.telefone}
                  onChange={(e) => setNovaEmpresa(prev => ({ ...prev, telefone: e.target.value }))}
                  className="input-style w-full"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEmpresaModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddEmpresa}
                className="btn-primary"
              >
                Adicionar Empresa
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button className="btn-primary">
          Salvar Configurações da Organização
        </button>
      </div>
    </div>
  );
}

function EmpresaTab() {
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    logoUrl: '',
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
    telefone: '',
    email: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implementar salvamento
    console.log('Salvando dados da empresa:', formData);
  };

  const buscarCEP = async (cep: string) => {
    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            rua: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            uf: data.uf
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Informações da Empresa</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome da Empresa *</label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              className="mt-1 block w-full input-style"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">CNPJ</label>
            <input
              type="text"
              value={formData.cnpj}
              onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value }))}
              className="mt-1 block w-full input-style"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Logo da Empresa</label>
          <input
            type="file"
            accept="image/*"
            className="mt-1 block w-full input-style"
          />
          <p className="mt-1 text-sm text-gray-500">Formatos aceitos: JPG, PNG. Tamanho máximo: 2MB</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Endereço</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">CEP</label>
            <input
              type="text"
              value={formData.cep}
              onChange={(e) => {
                const cep = e.target.value.replace(/\D/g, '');
                setFormData(prev => ({ ...prev, cep }));
                if (cep.length === 8) {
                  buscarCEP(cep);
                }
              }}
              className="mt-1 block w-full input-style"
              placeholder="00000-000"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Rua</label>
            <input
              type="text"
              value={formData.rua}
              onChange={(e) => setFormData(prev => ({ ...prev, rua: e.target.value }))}
              className="mt-1 block w-full input-style"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Número</label>
            <input
              type="text"
              value={formData.numero}
              onChange={(e) => setFormData(prev => ({ ...prev, numero: e.target.value }))}
              className="mt-1 block w-full input-style"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Complemento</label>
            <input
              type="text"
              value={formData.complemento}
              onChange={(e) => setFormData(prev => ({ ...prev, complemento: e.target.value }))}
              className="mt-1 block w-full input-style"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Bairro</label>
            <input
              type="text"
              value={formData.bairro}
              onChange={(e) => setFormData(prev => ({ ...prev, bairro: e.target.value }))}
              className="mt-1 block w-full input-style"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Cidade</label>
            <input
              type="text"
              value={formData.cidade}
              onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
              className="mt-1 block w-full input-style"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">UF</label>
            <input
              type="text"
              value={formData.uf}
              onChange={(e) => setFormData(prev => ({ ...prev, uf: e.target.value.toUpperCase() }))}
              className="mt-1 block w-full input-style"
              maxLength={2}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Contato</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Telefone Principal</label>
            <input
              type="tel"
              value={formData.telefone}
              onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
              className="mt-1 block w-full input-style"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">E-mail Principal</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="mt-1 block w-full input-style"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" className="btn-primary">
          Salvar Configurações
        </button>
      </div>
    </form>
  );
}

function EquipeTab() {
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Gerenciamento de Equipe</h3>
      <p className="text-gray-600">Funcionalidade de gerenciamento de equipe será implementada aqui.</p>
    </div>
  );
}

function ContaTab() {
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Configurações da Conta</h3>
      <p className="text-gray-600">Configurações da conta do usuário serão implementadas aqui.</p>
    </div>
  );
}

function LogsTab() {
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Logs do Sistema</h3>
      <p className="text-gray-600">Logs de atividades do sistema serão exibidos aqui.</p>
    </div>
  );
}

function SistemaTab() {
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Configurações do Sistema</h3>
      <p className="text-gray-600">Configurações gerais do sistema serão implementadas aqui.</p>
    </div>
  );
}

