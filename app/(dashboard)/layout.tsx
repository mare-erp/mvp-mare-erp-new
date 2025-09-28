'use client';

import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { DashboardDataProvider } from '@/app/contexts/DashboardDataProvider';
import { CompanyProvider, useCompany } from '@/app/contexts/CompanyContext';

// Componente para conectar o Header ao contexto
const ConnectedHeader = () => {
  const { organizacao, empresaSelecionada, handleEmpresaChange, isLoading } = useCompany();

  // Opcional: mostrar um loader enquanto os dados da organização carregam
  if (isLoading) {
    return <header className="fixed top-0 left-0 right-0 z-20 flex h-20 items-center justify-between border-b bg-white px-8 shadow-sm" />;
  }

  return (
    <Header
      organizacao={organizacao || undefined}
      empresaSelecionada={empresaSelecionada || undefined}
      onEmpresaChange={handleEmpresaChange}
    />
  );
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <CompanyProvider>
      <DashboardDataProvider>
        <div className="min-h-screen w-full bg-gray-50">
          <Sidebar 
            isCollapsed={isSidebarCollapsed} 
            toggleSidebar={toggleSidebar}
          />
          <div 
            className={`
              relative transition-all duration-300 ease-in-out
              ${isSidebarCollapsed ? 'pl-20' : 'pl-64'}
            `}
          >
            <ConnectedHeader />
            <main className="p-8 pt-28">
              {children}
            </main>
          </div>
        </div>
      </DashboardDataProvider>
    </CompanyProvider>
  );
}