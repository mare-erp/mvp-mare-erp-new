// app/(dashboard)/components/Sidebar.tsx

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { mainLinks, secondaryLinks, NavLink } from '@/app/lib/nav-links';
import { ChevronLeft } from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

const NavLinkItem = ({ link, isCollapsed }: { link: NavLink; isCollapsed: boolean }) => {
  const pathname = usePathname();
  const isActive = pathname === link.href;
  const Icon = link.icon;

  return (
    <Link
      href={link.href}
      className={`flex items-center gap-3 rounded-md p-3 text-sm font-medium transition-all duration-200 ${isCollapsed ? 'justify-center' : ''} ${isActive ? 'bg-[#00BFA5] text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-[#003846]'}`}
      title={isCollapsed ? link.name : ''}
    >
      <Icon className="w-5 h-5" />
      {!isCollapsed && <span>{link.name}</span>}
    </Link>
  );
};

export default function Sidebar({ isCollapsed, toggleSidebar }: SidebarProps) {
  return (
    // A sidebar agora é 'fixed' para se desvincular do conteúdo principal
    <aside
      className={`fixed top-0 left-0 z-20 h-full flex flex-col border-r bg-white pt-24 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}
    >
      {/* AQUI ESTÁ O AJUSTE DE POSIÇÃO */}
      {/* 'flex-grow' faz esta seção ocupar todo o espaço vertical disponível, empurrando o resto para baixo */}
      <nav className="flex-grow px-4">
        <div className="flex flex-col gap-1">
          {mainLinks.map((link) => (
            <NavLinkItem key={link.name} link={link} isCollapsed={isCollapsed} />
          ))}
        </div>
      </nav>

      {/* Seção inferior com Configurações */}
      <div className="flex flex-col gap-1 p-4 border-t">
        {secondaryLinks.map((link) => (
          <NavLinkItem key={link.name} link={link} isCollapsed={isCollapsed} />
        ))}
      </div>

      {/* Botão de controle */}
      <button
        onClick={toggleSidebar}
        className="absolute bottom-20 right-[-18px] h-9 w-9 flex items-center justify-center rounded-full bg-white border-2 border-gray-200 shadow-md text-gray-600 hover:bg-gray-100 transition-all"
        aria-label="Recolher/Expandir menu"
      >
        <ChevronLeft className={`h-5 w-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
      </button>
    </aside>
  );
}