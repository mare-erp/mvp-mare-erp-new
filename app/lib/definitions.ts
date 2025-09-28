// Este arquivo conterá tipos de dados que usamos em várias partes do sistema.

export type User = {
    id: string;
    nome: string | null;
    email: string;
};

export type Cliente = {
    id: string;
    nome: string;
    tipoPessoa: 'FISICA' | 'JURIDICA';
    cpfCnpj: string;
    email: string | null;
    telefone: string | null;
    endereco: string | null;
    empresaId: string;
};
 