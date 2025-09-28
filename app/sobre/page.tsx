'use client';

import { ArrowLeft, Target, Eye, Heart, Users, Award, Lightbulb } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function SobrePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F2F5] via-white to-[#F0F2F5]">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <button
              onClick={() => router.back()}
              className="flex items-center text-[#0A2F5B] hover:text-[#00BFA5] font-medium transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar
            </button>
            <div className="relative h-10 w-40">
              <Image
                src="/logo.svg"
                alt="Maré ERP"
                fill={true}
                style={{objectFit:"contain"}}
              />
            </div>
            <div></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-[#1A202C] mb-6">
            Sobre o <span className="text-[#0A2F5B]">Maré ERP</span>
          </h1>
          <p className="text-xl text-[#718096] max-w-3xl mx-auto leading-relaxed">
            Conheça nossa história, valores e a visão que nos move a transformar 
            a gestão empresarial no Brasil.
          </p>
        </div>

        {/* Valores */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <Heart className="w-12 h-12 text-[#0A2F5B] mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-[#1A202C] mb-4">Nossos Valores</h2>
            <p className="text-lg text-[#718096] max-w-2xl mx-auto">
              Os princípios fundamentais que guiam todas as nossas ações e decisões
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-[#0A2F5B] rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#1A202C] mb-3">Parceria e Crescimento</h3>
              <p className="text-[#718096] leading-relaxed">
                Acreditamos que o sucesso dos nossos clientes é o nosso sucesso. Nos dedicamos 
                a ser um pilar fundamental no crescimento e organização de seus negócios.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-[#00BFA5] rounded-lg flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#1A202C] mb-3">Excelência e Simplicidade</h3>
              <p className="text-[#718096] leading-relaxed">
                Buscamos a excelência em tudo o que fazemos, entregando soluções completas, 
                mas intuitivas e descomplicadas.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-[#38A169] rounded-lg flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#1A202C] mb-3">Ética e Integridade</h3>
              <p className="text-[#718096] leading-relaxed">
                Nossas operações são pautadas por uma ética inabalável, construindo 
                confiança e relacionamentos duradouros.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-[#DD6B20] rounded-lg flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#1A202C] mb-3">Comprometimento</h3>
              <p className="text-[#718096] leading-relaxed">
                Nossos colaboradores se comprometem com os resultados dos clientes 
                como se fossem seus próprios negócios.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-[#E53E3E] rounded-lg flex items-center justify-center mb-4">
                <Lightbulb className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#1A202C] mb-3">Desenvolvimento Humano</h3>
              <p className="text-[#718096] leading-relaxed">
                Valorizamos o crescimento contínuo de cada indivíduo, oferecendo 
                oportunidades de desenvolvimento pessoal e profissional.
              </p>
            </div>
          </div>
        </section>

        {/* Propósito, Missão e Visão */}
        <section className="mb-16">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Propósito */}
            <div className="bg-gradient-to-br from-[#0A2F5B] to-[#00BFA5] p-8 rounded-2xl text-white">
              <Target className="w-12 h-12 mb-6" />
              <h3 className="text-2xl font-bold mb-4">Nosso Propósito</h3>
              <p className="leading-relaxed">
                Empoderar empreendedores e empresas com uma gestão descomplicada e integrada, 
                facilitando o crescimento qualitativo e as decisões estratégicas.
              </p>
            </div>

            {/* Missão */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-[#0A2F5B]">
              <Heart className="w-12 h-12 text-[#0A2F5B] mb-6" />
              <h3 className="text-2xl font-bold text-[#1A202C] mb-4">Nossa Missão</h3>
              <p className="text-[#718096] leading-relaxed">
                Oferecer a mais completa, simples e intuitiva plataforma de gestão empresarial, 
                servindo como base sólida para o controle operacional e financeiro.
              </p>
            </div>

            {/* Visão */}
            <div className="bg-gradient-to-br from-[#00BFA5] to-[#38A169] p-8 rounded-2xl text-white">
              <Eye className="w-12 h-12 mb-6" />
              <h3 className="text-2xl font-bold mb-4">Nossa Visão</h3>
              <p className="leading-relaxed">
                Ser reconhecido como o maior e mais inovador sistema de gestão do Brasil, 
                liderando o mercado de tecnologia e SaaS.
              </p>
            </div>
          </div>
        </section>

        {/* Diferenciais */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <Award className="w-12 h-12 text-[#0A2F5B] mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-[#1A202C] mb-4">Nossos Diferenciais</h2>
            <p className="text-lg text-[#718096] max-w-2xl mx-auto">
              O que nos torna únicos no mercado de gestão empresarial
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-lg">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold text-[#1A202C] mb-4">Simplicidade e Intuitividade</h3>
                <p className="text-[#718096] mb-6 leading-relaxed">
                  Design focado na experiência do usuário, tornando a gestão complexa em algo 
                  fácil e acessível, mesmo para usuários sem conhecimento técnico.
                </p>

                <h3 className="text-xl font-bold text-[#1A202C] mb-4">Integração Nativa</h3>
                <p className="text-[#718096] mb-6 leading-relaxed">
                  Oferecemos uma solução verdadeiramente integrada, onde os módulos conversam 
                  entre si de forma fluida, eliminando retrabalho.
                </p>

                <h3 className="text-xl font-bold text-[#1A202C] mb-4">Custo-Benefício</h3>
                <p className="text-[#718096] leading-relaxed">
                  Planos flexíveis e acessíveis que se adaptam ao tamanho e necessidades 
                  de cada empresa, desde o MEI até empresas de médio porte.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-[#1A202C] mb-4">Suporte Humanizado</h3>
                <p className="text-[#718096] mb-6 leading-relaxed">
                  Um time de suporte dedicado e proativo, que entende as dores do cliente 
                  e oferece soluções rápidas e eficazes.
                </p>

                <h3 className="text-xl font-bold text-[#1A202C] mb-4">Foco no Crescimento</h3>
                <p className="text-[#718096] mb-6 leading-relaxed">
                  Nosso compromisso vai além da entrega de um software; somos parceiros 
                  no desenvolvimento e sucesso dos negócios de nossos clientes.
                </p>

                <h3 className="text-xl font-bold text-[#1A202C] mb-4">Base Ética</h3>
                <p className="text-[#718096] leading-relaxed">
                  Operamos com base em princípios de ética e integridade, construindo 
                  relações de confiança e respeito.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center">
          <div className="bg-gradient-to-r from-[#0A2F5B] to-[#00BFA5] rounded-2xl p-8 md:p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">
              Pronto para transformar sua gestão?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Junte-se a milhares de empresas que já confiam no Maré ERP
            </p>
            <button
              onClick={() => router.push('/signup')}
              className="bg-white text-[#0A2F5B] px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Começar Agora
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

