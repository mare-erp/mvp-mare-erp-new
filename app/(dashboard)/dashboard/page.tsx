export default function DashboardPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
            <p className="mt-2 text-gray-500">Bem-vindo ao Maré ERP! Este é o seu painel de controle.</p>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Card de Vendas */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500">Vendas do Mês</h3>
                    <p className="mt-2 text-3xl font-semibold text-gray-900">R$ 0,00</p>
                    <p className="mt-1 text-xs text-gray-500">Ainda sem dados</p>
                </div>

                {/* Card de Clientes */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500">Clientes Ativos</h3>
                    <p className="mt-2 text-3xl font-semibold text-gray-900">0</p>
                    <p className="mt-1 text-xs text-gray-500">Ainda sem dados</p>
                </div>

                {/* Card de Contas a Receber */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500">Contas a Receber</h3>
                    <p className="mt-2 text-3xl font-semibold text-gray-900">R$ 0,00</p>
                    <p className="mt-1 text-xs text-gray-500">Ainda sem dados</p>
                </div>

                {/* Card de Estoque */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500">Produtos em Estoque</h3>
                    <p className="mt-2 text-3xl font-semibold text-gray-900">0</p>
                    <p className="mt-1 text-xs text-gray-500">Ainda sem dados</p>
                </div>
            </div>
        </div>
    );
}