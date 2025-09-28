
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({ email: '', senha: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Falha no login.');
            }
            
            router.push('/dashboard'); 
            router.refresh(); 

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
                            style={{objectFit:"contain"}}
                        />
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-center text-[#1A202C] mb-8">Acessar sua conta</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-[#718096] mb-1">E-mail</label>
                        <Input id="email" name="email" type="email" placeholder="seu@email.com" required value={formData.email} onChange={handleChange} />
                    </div>
                    <div>
                        <label htmlFor="senha" className="block text-sm font-medium text-[#718096] mb-1">Senha</label>
                        <Input id="senha" name="senha" type="password" placeholder="Sua senha" required value={formData.senha} onChange={handleChange} />
                    </div>

                    {error && <p className="text-sm text-[#E53E3E] text-center">{error}</p>}

                    <div>
                        <Button type="submit" isLoading={isLoading} className="w-full bg-[#0A2F5B] text-white py-3 rounded-lg text-lg font-semibold hover:bg-[#00BFA5] transition-colors">
                            Entrar
                        </Button>
                    </div>
                </form>

                <p className="mt-8 text-center text-sm text-[#718096]">
                    Não tem uma conta?{' '}
                    <Link href="/sign-up" className="font-semibold text-[#0A2F5B] hover:text-[#00BFA5]">
                        Cadastre-se
                    </Link>
                </p>
            </div>
        </div>
    );
}

