'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Building2, Globe } from 'lucide-react';

interface Empresa {
  id: string;
  nome: string;
  cnpj?: string;
  logoUrl?: string;
}

const formatCNPJ = (value: string) => {
  const digits = (value || '').replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
};

interface CompanySelectorProps {
  empresas: Empresa[];
  empresaSelecionada?: string;
  onEmpresaChange: (empresaId: string | null) => void;
}

export default function CompanySelector({ 
  empresas, 
  empresaSelecionada, 
  onEmpresaChange 
}: CompanySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [empresaAtual, setEmpresaAtual] = useState<Empresa | null>(null);

  useEffect(() => {
    if (empresaSelecionada) {
      const empresa = empresas.find(e => e.id === empresaSelecionada);
      setEmpresaAtual(empresa || null);
    } else {
      setEmpresaAtual(null);
    }
  }, [empresaSelecionada, empresas]);

  const handleEmpresaSelect = (empresa: Empresa | null) => {
    setEmpresaAtual(empresa);
    onEmpresaChange(empresa?.id || null);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors min-w-[200px]"
      >
        {empresaAtual ? (
          <>
            {empresaAtual.logoUrl ? (
              <img 
                src={empresaAtual.logoUrl} 
                alt={empresaAtual.nome}
                className="w-6 h-6 rounded object-cover"
              />
            ) : (
              <Building2 className="w-5 h-5 text-[#0A2F5B]" />
            )}
            <div className="flex-1 text-left">
              <div className="text-sm font-medium text-gray-900 truncate">
                {empresaAtual.nome}
              </div>
              {empresaAtual.cnpj && (
                <div className="text-xs text-gray-500">
                  {formatCNPJ(empresaAtual.cnpj)}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Globe className="w-5 h-5 text-[#00BFA5]" />
            <div className="flex-1 text-left">
              <div className="text-sm font-medium text-gray-900">
                Todas as Empresas
              </div>
              <div className="text-xs text-gray-500">
                Visão consolidada
              </div>
            </div>
          </>
        )}
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {/* Opção "Todas as Empresas" */}
          <button
            onClick={() => handleEmpresaSelect(null)}
            className={`w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
              !empresaAtual ? 'bg-blue-50 border-l-4 border-[#0A2F5B]' : ''
            }`}
          >
            <Globe className="w-5 h-5 text-[#00BFA5]" />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">
                Todas as Empresas
              </div>
              <div className="text-xs text-gray-500">
                Visão consolidada de {empresas.length} empresa{empresas.length !== 1 ? 's' : ''}
              </div>
            </div>
          </button>

          {/* Separador */}
          <div className="border-t border-gray-100 my-1" />

          {/* Lista de empresas */}
          {empresas.map((empresa) => (
            <button
              key={empresa.id}
              onClick={() => handleEmpresaSelect(empresa)}
              className={`w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                empresaAtual?.id === empresa.id ? 'bg-blue-50 border-l-4 border-[#0A2F5B]' : ''
              }`}
            >
              {empresa.logoUrl ? (
                <img 
                  src={empresa.logoUrl} 
                  alt={empresa.nome}
                  className="w-6 h-6 rounded object-cover"
                />
              ) : (
                <Building2 className="w-5 h-5 text-[#0A2F5B]" />
              )}
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {empresa.nome}
                </div>
                {empresa.cnpj && (
                  <div className="text-xs text-gray-500">
                    {formatCNPJ(empresa.cnpj)}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Overlay para fechar o dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
