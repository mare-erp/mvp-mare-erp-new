'use client';

import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { DataProvider } from '@/app/contexts/DataContexts';
import ErrorBoundary from '@/app/components/ErrorBoundary';
import { AuthProvider } from '@/app/hooks/useAuth';

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
    <AuthProvider>
      <DataProvider>
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
            <Header />
            <main className="p-8 pt-28">
              <ErrorBoundary>{children}</ErrorBoundary>
            </main>
          </div>
        </div>
      </DataProvider>
    </AuthProvider>
  );
}
