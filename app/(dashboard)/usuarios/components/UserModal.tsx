
'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
import { Dropdown } from '@/app/components/ui/Dropdown';
import { Role } from '@prisma/client';

interface UserModalProps {
  onClose: () => void;
  onSave: () => void;
  editingUser?: any | null;
}

export default function UserModal({ onClose, onSave, editingUser }: UserModalProps) {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    role: Role.OPERADOR,
    ativo: true,
    senha: '',
    confirmarSenha: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (editingUser) {
      setFormData({
        nome: editingUser.nome,
        email: editingUser.email,
        role: editingUser.role,
        ativo: editingUser.ativo,
        senha: '', // Senha não é preenchida para edição
        confirmarSenha: '',
      });
    } else {
      setFormData({
        nome: '',
        email: '',
        role: Role.OPERADOR,
        ativo: true,
        senha: '',
        confirmarSenha: '',
      });
    }
  }, [editingUser]);

  const roleOptions = [
    { label: 'Gestor', value: Role.GESTOR },
    { label: 'Operador', value: Role.OPERADOR },
    { label: 'Visualizador', value: Role.VISUALIZADOR },
  ];

  const ativoOptions = [
    { label: 'Ativo', value: 'true' },
    { label: 'Inativo', value: 'false' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDropdownChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: name === 'ativo' ? value === 'true' : value,
    }));
  };

  const handleSubmit = async () => {
    setError(null);
    setIsLoading(true);

    if (!editingUser && formData.senha !== formData.confirmarSenha) {
      setError('As senhas não coincidem.');
      setIsLoading(false);
      return;
    }

    try {
      const url = editingUser ? `/api/usuarios/${editingUser.id}` : '/api/usuarios';
      const method = editingUser ? 'PUT' : 'POST';

      const payload: any = {
        nome: formData.nome,
        email: formData.email,
        role: formData.role,
        ativo: formData.ativo,
      };

      if (!editingUser && formData.senha) {
        payload.senha = formData.senha;
      } else if (editingUser && formData.senha) {
        // Se for edição e a senha foi preenchida, atualiza
        payload.senha = formData.senha;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Falha ao salvar usuário.');
      }

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl z-50 w-full max-w-md h-auto flex flex-col">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {editingUser ? 'Editar Usuário' : 'Adicionar Usuário'}
          </h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>

        <main className="p-6 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <Input id="nome" name="nome" type="text" required value={formData.nome} onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <Input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} />
            </div>
            <Dropdown
              label="Função"
              options={roleOptions}
              value={formData.role}
              onChange={(value) => handleDropdownChange('role', value)}
            />
            <Dropdown
              label="Status"
              options={ativoOptions}
              value={formData.ativo.toString()}
              onChange={(value) => handleDropdownChange('ativo', value)}
            />
            {!editingUser && (
              <>
                <div>
                  <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                  <Input id="senha" name="senha" type="password" required={!editingUser} value={formData.senha} onChange={handleChange} />
                </div>
                <div>
                  <label htmlFor="confirmarSenha" className="block text-sm font-medium text-gray-700 mb-1">Confirmar Senha</label>
                  <Input id="confirmarSenha" name="confirmarSenha" type="password" required={!editingUser} value={formData.confirmarSenha} onChange={handleChange} />
                </div>
              </>
            )}
            {editingUser && (
              <p className="text-sm text-gray-500">Deixe os campos de senha em branco para não alterar a senha.</p>
            )}
            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          </div>
        </main>

        <div className="p-6 border-t flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} isLoading={isLoading}>Salvar Usuário</Button>
        </div>
      </div>
    </div>
  );
}

