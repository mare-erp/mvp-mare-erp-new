'use client';

import Link from 'next/link';
import { User, Building, Lock, HelpCircle, LogOut, Users } from 'lucide-react';

// O componente recebe uma função para deslogar como propriedade
interface SettingsDropdownProps {
  onLogout: () => void;
}

// Array de itens do menu para facilitar a manutenção
const menuItems = [
  { href: '/configuracoes?tab=conta', icon: User, label: 'Configurações do Usuário' },
  { href: '/configuracoes?tab=empresa', icon: Building, label: 'Configurações da Empresa' },
  { href: '/configuracoes?tab=equipe', icon: Users, label: 'Gerenciar Equipe' },
  { href: '/configuracoes?tab=sistema', icon: Lock, label: 'Configurações do Sistema' },
  { href: '/ajuda', icon: HelpCircle, label: 'Ajuda' },
];

export default function SettingsDropdown({ onLogout }: SettingsDropdownProps) {
  return (
    <div 
      className="absolute top-16 right-8 w-64 bg-white border rounded-md shadow-lg z-30"
      onClick={(e) => e.stopPropagation()} // Impede que o clique dentro do menu o feche
    >
      <div className="p-2">
        {menuItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </Link>
        ))}
        
        <div className="h-px bg-gray-200 my-2" /> {/* Divisor */}

        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-600 rounded-md hover:bg-red-50"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair (Logoff)</span>
        </button>
      </div>
    </div>
  );
}