
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle, BarChart3, Shield, Zap } from 'lucide-react';
import Image from 'next/image';

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleNavigation = (path: string) => {
    setIsLoading(true);
    router.push(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F2F5] via-white to-[#F0F2F5]">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="relative h-10 w-40">
                <Image
                  src="/logo.svg"
                  alt="Maré ERP"
                  fill={true}
                  style={{objectFit:"contain"}}
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleNavigation('/login')}
                className="text-[#0A2F5B] hover:text-[#00BFA5] font-medium transition-colors"
              >
                Entrar
              </button>
              <button
                onClick={() => handleNavigation('/sign-up')}
                className="bg-[#0A2F5B] text-white px-6 py-2 rounded-lg hover:bg-[#00BFA5] transition-colors"
              >
                Criar Conta
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-[#1A202C] mb-6 leading-tight">
            Transforme a Gestão da Sua Empresa e{' '}
            <span className="text-[#0A2F5B]">Navegue Rumo ao Lucro</span>{' '}
            com o Maré ERP
          </h1>
          
          <p className="text-xl md:text-2xl text-[#718096] mb-12 max-w-4xl mx-auto leading-relaxed">
            A solução completa e integrada para micro, pequenas e médias empresas que buscam 
            excelência operacional, crescimento sustentável e decisões estratégicas baseadas em dados reais.
          </p>

          {/* Botões Principais */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20">
            <button
              onClick={() => handleNavigation('/login')}
              disabled={isLoading}
              className="w-full sm:w-auto bg-[#0A2F5B] text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-[#00BFA5] transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              Fazer Login
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            
            <button
              onClick={() => handleNavigation('/sign-up')}
              disabled={isLoading}
              className="w-full sm:w-auto bg-[#00BFA5] text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-[#0A2F5B] transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              Criar Conta
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            
            <button
              onClick={() => handleNavigation('/dashboard')}
              disabled={isLoading}
              className="w-full sm:w-auto border-2 border-[#0A2F5B] text-[#0A2F5B] px-8 py-4 rounded-xl text-lg font-semibold hover:bg-[#0A2F5B] hover:text-white transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              Ver Dashboard
              <BarChart3 className="ml-2 w-5 h-5" />
            </button>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-[#0A2F5B] rounded-full flex items-center justify-center mb-6 mx-auto">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#1A202C] mb-4">Gestão Integrada</h3>
              <p className="text-[#718096] leading-relaxed">
                Vendas, financeiro, estoque e clientes em uma única plataforma. 
                Elimine a complexidade e tenha controle total do seu negócio.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-[#00BFA5] rounded-full flex items-center justify-center mb-6 mx-auto">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#1A202C] mb-4">Segurança Total</h3>
              <p className="text-[#718096] leading-relaxed">
                Seus dados protegidos com criptografia avançada e isolamento multi-tenant. 
                Conformidade com LGPD garantida.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-[#38A169] rounded-full flex items-center justify-center mb-6 mx-auto">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#1A202C] mb-4">Simplicidade</h3>
              <p className="text-[#718096] leading-relaxed">
                Interface intuitiva que qualquer pessoa pode usar. 
                Foque no seu negócio, não na tecnologia.
              </p>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-lg">
            <h2 className="text-3xl font-bold text-[#1A202C] mb-8">
              Por que escolher o Maré ERP?
            </h2>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              {[
                'Controle financeiro completo com fluxo de caixa em tempo real',
                'Gestão de vendas com emissão de PDFs profissionais',
                'Controle de estoque inteligente com alertas automáticos',
                'Relatórios e métricas para decisões estratégicas',
                'Suporte técnico especializado e humanizado',
                'Atualizações constantes sem custo adicional'
              ].map((benefit, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-[#38A169] mt-0.5 flex-shrink-0" />
                  <span className="text-[#718096]">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#1A202C] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="relative h-8 w-32 mx-auto mb-6">
            <Image
              src="/logo.svg"
              alt="Maré ERP"
              fill={true}
              style={{objectFit:"contain"}}
              className="brightness-0 invert"
            />
          </div>
          <p className="text-gray-400 mb-4">
            Empodere sua empresa com gestão descomplicada e integrada
          </p>
          <p className="text-sm text-gray-500">
            © 2024 Maré ERP. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}

