'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, UserCircle, MoreVertical } from 'lucide-react';
import SettingsDropdown from './SettingsDropdown';
import CompanySelector from '@/app/components/CompanySelector';
import Image from 'next/image';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  fotoPerfil?: string;
}

interface Empresa {
  id: string;
  nome: string;
  cnpj?: string;
  logoUrl?: string;
}

interface Organizacao {
  id: string;
  nome: string;
  empresas: Empresa[];
}

interface HeaderProps {
  usuario?: Usuario;
  organizacao?: Organizacao;
  empresaSelecionada?: string;
  onEmpresaChange?: (empresaId: string | null) => void;
}

export default function Header({
  usuario,
  organizacao,
  empresaSelecionada,
  onEmpresaChange
}: HeaderProps) {
  const router = useRouter();
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [notificacoes, setNotificacoes] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [usuarioAtual, setUsuarioAtual] = useState<Usuario | null>(usuario ?? null);
  const [organizacaoAtual, setOrganizacaoAtual] = useState<Organizacao | undefined>(organizacao);
  const [empresaAtual, setEmpresaAtual] = useState<string | null>(empresaSelecionada ?? usuario?.id ?? null);
  const [carregandoUsuario, setCarregandoUsuario] = useState<boolean>(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Erro na requisição de logout:', error);
    }
  };

  // Buscar notificações (placeholder)
  useEffect(() => {
    // TODO: Implementar busca de notificações
    setNotificacoes(3);
  }, []);

  useEffect(() => {
    setUsuarioAtual(usuario ?? null);
  }, [usuario]);

  useEffect(() => {
    setOrganizacaoAtual(organizacao);
  }, [organizacao]);

  useEffect(() => {
    setEmpresaAtual(empresaSelecionada ?? null);
  }, [empresaSelecionada]);

  useEffect(() => {
    let cancellado = false;
    const carregarDados = async () => {
      setCarregandoUsuario(true);
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
          cache: 'no-store',
        });
        if (!response.ok) return;
        const data = await response.json();
        if (cancellado) return;
        if (!usuarioAtual) {
          setUsuarioAtual(data.user ?? null);
        }
        if (!organizacaoAtual) {
          setOrganizacaoAtual(data.organizacao);
        }
        if ((empresaSelecionada ?? empresaAtual) == null && data.organizacao?.empresas?.length) {
          const primeiraEmpresa = data.organizacao.empresas[0].id;
          setEmpresaAtual(primeiraEmpresa);
          onEmpresaChange?.(primeiraEmpresa);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      } finally {
        if (!cancellado) setCarregandoUsuario(false);
      }
    };

    if (!usuarioAtual || !organizacaoAtual) {
      carregarDados();
    }

    return () => {
      cancellado = true;
    };
  }, [usuarioAtual, organizacaoAtual, empresaAtual, empresaSelecionada, onEmpresaChange]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-20 flex h-20 items-center justify-between border-b bg-white px-8 shadow-sm">
      {/* Logo */}
      <div className="relative h-8 w-32">
        <Image
          src="/logo.svg"
          alt="Maré ERP Logo"
          fill={true}
          style={{objectFit:"contain"}}
        />
      </div>

      {/* Seletor de Empresa */}
      <div className="flex-1 flex justify-center max-w-md mx-8">
        {organizacaoAtual && organizacaoAtual.empresas.length > 0 && (
          <CompanySelector
            empresas={organizacaoAtual.empresas}
            empresaSelecionada={empresaAtual ?? undefined}
            onEmpresaChange={(empresaId) => {
              setEmpresaAtual(empresaId);
              onEmpresaChange?.(empresaId);
            }}
          />
        )}
      </div>

      {/* Área do usuário */}
      <div className="flex items-center gap-6">
        {/* Notificações */}
        <button className="relative text-gray-500 hover:text-gray-800 transition-colors">
          <Bell className="w-6 h-6" />
          {notificacoes > 0 && (
            <span className="absolute -top-2 -right-2 bg-[#E53E3E] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {notificacoes > 9 ? '9+' : notificacoes}
            </span>
          )}
        </button>

        {/* Informações do usuário */}
        <div className="flex items-center gap-3">
          {usuarioAtual?.fotoPerfil ? (
            <img
              src={usuarioAtual.fotoPerfil}
              alt={usuarioAtual.nome}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <UserCircle className="w-8 h-8 text-gray-400" />
          )}
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-800">
              {carregandoUsuario ? 'Carregando...' : usuarioAtual?.nome ?? usuario?.nome ?? 'Usuário'}
            </p>
            <p className="text-xs text-gray-500">
              {usuarioAtual?.email ?? ''}
            </p>
          </div>
        </div>

        {/* Menu de configurações */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!isDropdownOpen)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <MoreVertical className="h-6 w-6 text-gray-700" />
          </button>

          {isDropdownOpen && <SettingsDropdown onLogout={handleLogout} />}
        </div>
      </div>
    </header>
  );
}
