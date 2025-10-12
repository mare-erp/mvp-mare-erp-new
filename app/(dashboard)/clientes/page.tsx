'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, Search, Users, UserPlus, UserCheck, UserX, RefreshCw } from 'lucide-react';
import StatCard from '@/app/components/ui/StatCard';

// --- Tipagens ---
interface Cliente { id: string; nome: string; email: string | null; telefone: string | null; cidade: string | null; uf: string | null; ativo: boolean; }
interface ClientesSummary { total: number; novos: number; ativos: number; inativos: number; }
type ClientesFiltro = 'todos' | 'ativos' | 'inativos';

export default function ClientesPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [summary, setSummary] = useState<ClientesSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtro, setFiltro] = useState<ClientesFiltro>('todos');

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [clientesRes, summaryRes] = await Promise.all([
        fetch('/api/clientes'),
        fetch('/api/clientes/summary'),
      ]);
      if (!clientesRes.ok || !summaryRes.ok) throw new Error('Falha ao carregar dados dos clientes.');
      const clientesData = await clientesRes.json();
      const summaryData = await summaryRes.json();
      setClientes(clientesData);
      setSummary(summaryData);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleResetFilters = () => {
    setFiltro('todos');
    setSearchTerm('');
  };

  const filteredClientes = useMemo(() => {
    let items = clientes;
    if (filtro === 'ativos') items = items.filter(c => c.ativo);
    if (filtro === 'inativos') items = items.filter(c => !c.ativo);

    if (searchTerm) {
      return items.filter(cliente =>
        cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cliente.email && cliente.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    return items;
  }, [clientes, filtro, searchTerm]);

  if (isLoading) return <div className="p-6">Carregando...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Clientes</h1>
            <button onClick={() => router.push('/clientes/novo')} className="btn-primary inline-flex items-center gap-2">
                <PlusCircle className="w-5 h-5" /><span>Novo Cliente</span>
            </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input type="text" placeholder="Pesquisar por nome ou e-mail..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
          </div>
          <button onClick={handleResetFilters} className="btn-secondary p-2" title="Limpar Filtros"><RefreshCw className="w-4 h-4" /></button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total de Clientes" value={summary.total.toString()} icon={<Users />} color="blue" onClick={() => setFiltro('todos')} isActive={filtro === 'todos'} />
          <StatCard title="Novos no Mês" value={summary.novos.toString()} icon={<UserPlus />} color="purple" />
          <StatCard title="Clientes Ativos" value={summary.ativos.toString()} icon={<UserCheck />} color="green" onClick={() => setFiltro('ativos')} isActive={filtro === 'ativos'} />
          <StatCard title="Clientes Inativos" value={summary.inativos.toString()} icon={<UserX />} color="red" onClick={() => setFiltro('inativos')} isActive={filtro === 'inativos'} />
        </div>
      )}

      <div className="bg-white rounded-lg border shadow-sm">
         <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Lista de Clientes</h2>
          <span className="text-sm text-gray-500">{filteredClientes.length} clientes exibidos</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr><th className="th-style">Nome</th><th className="th-style">Contato</th><th className="th-style">Localização</th><th className="th-style text-center">Status</th></tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClientes.length > 0 ? filteredClientes.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/clientes/${cliente.id}/editar`)}>
                  <td className="td-style font-medium">{cliente.nome}</td>
                  <td className="td-style">{cliente.email || cliente.telefone || '-'}</td>
                  <td className="td-style">{cliente.cidade && cliente.uf ? `${cliente.cidade}, ${cliente.uf}` : '-'}</td>
                  <td className="td-style text-center"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cliente.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{cliente.ativo ? 'Ativo' : 'Inativo'}</span></td>
                </tr>
              )) : (<tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">Nenhum cliente encontrado.</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}