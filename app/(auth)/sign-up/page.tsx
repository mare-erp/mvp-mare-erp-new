
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    nomeEmpresa: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (formData.senha !== formData.confirmarSenha) {
      setError('As senhas não coincidem.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/sign-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.nome,
          email: formData.email,
          password: formData.senha,
          companyName: formData.nomeEmpresa,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Falha ao cadastrar.');
      }

      router.push('/setup-empresa');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F0F2F5] via-white to-[#F0F2F5] p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="relative h-12 w-48 max-h-12 max-w-48">
            <Image
              src="/logo.png"
              alt="Maré ERP"
              width={192}
              height={48}
              style={{ objectFit: 'contain' }}
            />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-[#1A202C] mb-8">Crie sua Conta no Maré ERP</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-[#718096] mb-1">Seu Nome</label>
            <Input id="nome" name="nome" type="text" placeholder="Seu nome completo" required value={formData.nome} onChange={handleChange} />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#718096] mb-1">Seu E-mail</label>
            <Input id="email" name="email" type="email" placeholder="seu@email.com" required value={formData.email} onChange={handleChange} />
          </div>
          <div>
            <label htmlFor="nomeEmpresa" className="block text-sm font-medium text-[#718096] mb-1">Nome da Empresa</label>
            <Input id="nomeEmpresa" name="nomeEmpresa" type="text" placeholder="Nome da sua empresa" required value={formData.nomeEmpresa} onChange={handleChange} />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="senha" className="block text-sm font-medium text-[#718096] mb-1">Crie uma Senha</label>
              <div className="relative">
                <Input id="senha" name="senha" type={showPassword ? 'text' : 'password'} placeholder="Sua senha" required value={formData.senha} onChange={handleChange} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#718096] hover:text-[#0A2F5B]"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div className="flex-1">
              <label htmlFor="confirmarSenha" className="block text-sm font-medium text-[#718096] mb-1">Confirme a Senha</label>
              <div className="relative">
                <Input id="confirmarSenha" name="confirmarSenha" type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirme sua senha" required value={formData.confirmarSenha} onChange={handleChange} />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#718096] hover:text-[#0A2F5B]"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-[#E53E3E] text-center">{error}</p>}

          <div>
            <Button type="submit" isLoading={isLoading} className="w-full bg-[#0A2F5B] text-white py-3 rounded-lg text-lg font-semibold hover:bg-[#00BFA5] transition-colors">
              {isLoading ? 'Criando conta...' : 'Cadastrar'}
            </Button>
          </div>
        </form>

        <p className="mt-8 text-center text-sm text-[#718096]">
          Já tem uma conta?{' '}
          <Link href="/login" className="font-semibold text-[#0A2F5B] hover:text-[#00BFA5]">
            Faça login
          </Link>
        </p>
      </div>
    </div>
  );
}

