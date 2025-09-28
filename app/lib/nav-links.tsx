// app/lib/nav-links.tsx

import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Wallet,
  Archive,
  Cog,
} from 'lucide-react';

// Definindo o tipo para cada link para garantir consistência
export type NavLink = {
  name: string;
  href: string;
  icon: React.ElementType; // Usamos ElementType para passar o componente do ícone
};

// Array com todos os links da navegação principal
export const mainLinks: NavLink[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Vendas',
    href: '/vendas',
    icon: ShoppingCart,
  },
  {
    name: 'Clientes',
    href: '/clientes',
    icon: Users,
  },
  {
    name: 'Financeiro',
    href: '/financeiro',
    icon: Wallet,
  },
  {
    name: 'Estoque',
    href: '/estoque',
    icon: Archive,
  },
];

// Array para links secundários ou de configuração
export const secondaryLinks: NavLink[] = [
  {
    name: 'Configurações',
    href: '/configuracoes',
    icon: Cog,
  },
];