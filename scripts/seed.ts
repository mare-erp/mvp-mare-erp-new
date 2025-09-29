import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed do banco de dados...');

  // Deletar dados existentes na ordem correta para evitar erros de chave estrangeira
  await prisma.itemPedido.deleteMany({});
  await prisma.pedido.deleteMany({});
  await prisma.cliente.deleteMany({});
  await prisma.produto.deleteMany({});
  await prisma.membroOrganizacao.deleteMany({});
  await prisma.usuario.deleteMany({});
  await prisma.empresa.deleteMany({});
  await prisma.organizacao.deleteMany({});

  console.log('Dados existentes deletados.');

  // Criar organização primeiro
  const organizacao = await prisma.organizacao.create({
    data: {
      nome: 'Organização Teste',
    },
  });

  console.log('Organização criada:', organizacao.nome);

  // Criar empresa
  const empresa = await prisma.empresa.create({
    data: {
      nome: 'Empresa Teste Ltda',
      cnpj: '12.345.678/0001-90',
      organizacaoId: organizacao.id,
    },
  });

  console.log('Empresa criada:', empresa.nome, 'ID:', empresa.id);

  // Criar usuário admin
  const senhaHash = await bcrypt.hash('123456', 10);
  const usuario = await prisma.usuario.create({
    data: {
      email: 'admin@teste.com',
      nome: 'Administrador',
      senhaHash: senhaHash,
    },
  });

  console.log('Usuário criado:', usuario.email);

  // Criar membro da organização
  const membroOrganizacao = await prisma.membroOrganizacao.create({
    data: {
      organizacaoId: organizacao.id,
      usuarioId: usuario.id,
      role: 'ADMIN',
    },
  });

  console.log('Membro da organização criado');

  // Criar clientes
  const clientes = await Promise.all([
    prisma.cliente.create({
      data: {
        empresaId: empresa.id,
        nome: 'João Silva',
        tipoPessoa: 'FISICA',
        cpfCnpj: '123.456.789-00',
        email: 'joao@email.com',
        telefone: '(11) 98888-8888',
        rua: 'Rua A',
        numero: '100',
        primeiraCompraConcluida: false,
      },
    }),
    prisma.cliente.create({
      data: {
        empresaId: empresa.id,
        nome: 'Maria Santos',
        tipoPessoa: 'FISICA',
        cpfCnpj: '987.654.321-00',
        email: 'maria@email.com',
        telefone: '(11) 97777-7777',
        rua: 'Rua B',
        numero: '200',
        primeiraCompraConcluida: true,
      },
    }),
    prisma.cliente.create({
      data: {
        empresaId: empresa.id,
        nome: 'Pedro Oliveira',
        tipoPessoa: 'FISICA',
        cpfCnpj: '456.789.123-00',
        email: 'pedro@email.com',
        telefone: '(11) 96666-6666',
        rua: 'Rua C',
        numero: '300',
        primeiraCompraConcluida: false,
      },
    }),
  ]);

  console.log(`${clientes.length} clientes criados`);

  // Criar produtos
  const produtos = await Promise.all([
    prisma.produto.create({
      data: {
        empresaId: empresa.id,
        nome: 'Produto A',
        descricao: 'Descrição do Produto A',
        preco: 100.00,
        quantidadeEstoque: 50,
        tipo: 'PRODUTO',
      },
    }),
    prisma.produto.create({
      data: {
        empresaId: empresa.id,
        nome: 'Produto B',
        descricao: 'Descrição do Produto B',
        preco: 250.00,
        quantidadeEstoque: 30,
        tipo: 'PRODUTO',
      },
    }),
    prisma.produto.create({
      data: {
        empresaId: empresa.id,
        nome: 'Serviço de Consultoria',
        descricao: 'Serviço de consultoria especializada',
        preco: 500.00,
        quantidadeEstoque: 0,
        tipo: 'SERVICO',
      },
    }),
  ]);

  console.log(`${produtos.length} produtos criados`);

  // Criar alguns pedidos de exemplo
  const pedidos = await Promise.all([
    // Pedido vendido
    prisma.pedido.create({
      data: {
        empresaId: empresa.id,
        clienteId: clientes[0].id,
        usuarioId: usuario.id,
        numeroPedido: 1,
        status: 'VENDIDO',
        valorTotal: 350.00,
        dataPedido: new Date('2025-09-01'),
      },
    }),
    // Orçamento
    prisma.pedido.create({
      data: {
        empresaId: empresa.id,
        clienteId: clientes[1].id,
        usuarioId: usuario.id,
        numeroPedido: 2,
        status: 'ORCAMENTO',
        valorTotal: 750.00,
        dataPedido: new Date('2025-09-15'),
      },
    }),
    // Pedido recusado
    prisma.pedido.create({
      data: {
        empresaId: empresa.id,
        clienteId: clientes[2].id,
        usuarioId: usuario.id,
        numeroPedido: 3,
        status: 'RECUSADO',
        valorTotal: 200.00,
        dataPedido: new Date('2025-09-10'),
      },
    }),
  ]);

  console.log(`${pedidos.length} pedidos criados`);

  // Criar itens para os pedidos
  await Promise.all([
    // Itens do primeiro pedido (vendido)
    prisma.itemPedido.create({
      data: {
        pedidoId: pedidos[0].id,
        produtoId: produtos[0].id,
        descricao: produtos[0].nome,
        quantidade: 2,
        precoUnitario: 100.00,
        subtotal: 200.00,
      },
    }),
    prisma.itemPedido.create({
      data: {
        pedidoId: pedidos[0].id,
        produtoId: produtos[1].id,
        descricao: produtos[1].nome,
        quantidade: 1,
        precoUnitario: 150.00,
        subtotal: 150.00,
      },
    }),
    
    // Itens do segundo pedido (orçamento)
    prisma.itemPedido.create({
      data: {
        pedidoId: pedidos[1].id,
        produtoId: produtos[1].id,
        descricao: produtos[1].nome,
        quantidade: 1,
        precoUnitario: 250.00,
        subtotal: 250.00,
      },
    }),
    prisma.itemPedido.create({
      data: {
        pedidoId: pedidos[1].id,
        produtoId: produtos[2].id,
        descricao: produtos[2].nome,
        quantidade: 1,
        precoUnitario: 500.00,
        subtotal: 500.00,
      },
    }),
    
    // Itens do terceiro pedido (recusado)
    prisma.itemPedido.create({
      data: {
        pedidoId: pedidos[2].id,
        produtoId: produtos[0].id,
        descricao: produtos[0].nome,
        quantidade: 2,
        precoUnitario: 100.00,
        subtotal: 200.00,
      },
    }),
  ]);

  console.log('Itens dos pedidos criados');

  console.log('Seed concluído com sucesso!');
  console.log('Dados de login:');
  console.log('Email: admin@teste.com');
  console.log('Senha: 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

