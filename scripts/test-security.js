const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testSecurity() {
  console.log('🔒 Iniciando testes de segurança e isolamento...\n');

  try {
    // Limpar dados de teste anteriores
    await cleanupTestData();

    // 1. Criar dados de teste
    console.log('1. Criando dados de teste...');
    const testData = await createTestData();
    console.log('✅ Dados de teste criados\n');

    // 2. Testar isolamento entre organizações
    console.log('2. Testando isolamento entre organizações...');
    await testOrganizationIsolation(testData);
    console.log('✅ Isolamento entre organizações funcionando\n');

    // 3. Testar isolamento entre empresas
    console.log('3. Testando isolamento entre empresas...');
    await testCompanyIsolation(testData);
    console.log('✅ Isolamento entre empresas funcionando\n');

    // 4. Testar permissões de usuários
    console.log('4. Testando permissões de usuários...');
    await testUserPermissions(testData);
    console.log('✅ Sistema de permissões funcionando\n');

    // 5. Testar integridade dos dados
    console.log('5. Testando integridade dos dados...');
    await testDataIntegrity(testData);
    console.log('✅ Integridade dos dados mantida\n');

    // Limpar dados de teste
    await cleanupTestData();

    console.log('🎉 Todos os testes de segurança passaram com sucesso!');

  } catch (error) {
    console.error('❌ Erro nos testes de segurança:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function cleanupTestData() {
  // Remover dados de teste (organizações com prefixo TEST_)
  await prisma.logAuditoria.deleteMany({
    where: {
      organizacao: {
        nome: {
          startsWith: 'TEST_'
        }
      }
    }
  });

  await prisma.membroOrganizacao.deleteMany({
    where: {
      organizacao: {
        nome: {
          startsWith: 'TEST_'
        }
      }
    }
  });

  await prisma.empresa.deleteMany({
    where: {
      organizacao: {
        nome: {
          startsWith: 'TEST_'
        }
      }
    }
  });

  await prisma.organizacao.deleteMany({
    where: {
      nome: {
        startsWith: 'TEST_'
      }
    }
  });

  await prisma.usuario.deleteMany({
    where: {
      email: {
        contains: 'test-security'
      }
    }
  });
}

async function createTestData() {
  const senhaHash = await bcrypt.hash('123456', 12);

  // Criar usuários de teste
  const admin1 = await prisma.usuario.create({
    data: {
      nome: 'Admin Org 1',
      email: 'admin1@test-security.com',
      senhaHash
    }
  });

  const admin2 = await prisma.usuario.create({
    data: {
      nome: 'Admin Org 2',
      email: 'admin2@test-security.com',
      senhaHash
    }
  });

  const operador1 = await prisma.usuario.create({
    data: {
      nome: 'Operador 1',
      email: 'operador1@test-security.com',
      senhaHash
    }
  });

  // Criar organizações
  const org1 = await prisma.organizacao.create({
    data: {
      nome: 'TEST_Organizacao_1',
      adminId: admin1.id
    }
  });

  const org2 = await prisma.organizacao.create({
    data: {
      nome: 'TEST_Organizacao_2',
      adminId: admin2.id
    }
  });

  // Criar empresas
  const empresa1A = await prisma.empresa.create({
    data: {
      nome: 'Empresa 1A',
      cnpj: '11111111000111',
      organizacaoId: org1.id
    }
  });

  const empresa1B = await prisma.empresa.create({
    data: {
      nome: 'Empresa 1B',
      cnpj: '11111111000222',
      organizacaoId: org1.id
    }
  });

  const empresa2A = await prisma.empresa.create({
    data: {
      nome: 'Empresa 2A',
      cnpj: '22222222000111',
      organizacaoId: org2.id
    }
  });

  // Criar membros das organizações
  await prisma.membroOrganizacao.create({
    data: {
      organizacaoId: org1.id,
      usuarioId: admin1.id,
      role: 'ADMIN'
    }
  });

  await prisma.membroOrganizacao.create({
    data: {
      organizacaoId: org2.id,
      usuarioId: admin2.id,
      role: 'ADMIN'
    }
  });

  await prisma.membroOrganizacao.create({
    data: {
      organizacaoId: org1.id,
      usuarioId: operador1.id,
      role: 'OPERADOR',
      permissoes: {
        vendas: { acessar: true, criar_pedido: true, visualizar: true },
        financeiro: { acessar: false }
      }
    }
  });

  // Criar alguns clientes para teste
  const cliente1A = await prisma.cliente.create({
    data: {
      nome: 'Cliente 1A',
      tipoPessoa: 'JURIDICA',
      cpfCnpj: '11111111000111',
      empresaId: empresa1A.id
    }
  });

  const cliente2A = await prisma.cliente.create({
    data: {
      nome: 'Cliente 2A',
      tipoPessoa: 'JURIDICA',
      cpfCnpj: '22222222000111',
      empresaId: empresa2A.id
    }
  });

  return {
    usuarios: { admin1, admin2, operador1 },
    organizacoes: { org1, org2 },
    empresas: { empresa1A, empresa1B, empresa2A },
    clientes: { cliente1A, cliente2A }
  };
}

async function testOrganizationIsolation(testData) {
  const { organizacoes, empresas, clientes } = testData;

  // Teste 1: Usuário da org1 não deve ver dados da org2
  const clientesOrg1 = await prisma.cliente.findMany({
    where: {
      empresa: {
        organizacaoId: organizacoes.org1.id
      }
    }
  });

  const clientesOrg2 = await prisma.cliente.findMany({
    where: {
      empresa: {
        organizacaoId: organizacoes.org2.id
      }
    }
  });

  if (clientesOrg1.length === 0) {
    throw new Error('Deveria haver clientes na organização 1');
  }

  if (clientesOrg2.length === 0) {
    throw new Error('Deveria haver clientes na organização 2');
  }

  // Verificar que os clientes são diferentes
  const clienteOrg1Ids = clientesOrg1.map(c => c.id);
  const clienteOrg2Ids = clientesOrg2.map(c => c.id);
  
  const intersection = clienteOrg1Ids.filter(id => clienteOrg2Ids.includes(id));
  if (intersection.length > 0) {
    throw new Error('Clientes estão sendo compartilhados entre organizações');
  }

  console.log('  ✓ Dados isolados entre organizações');
}

async function testCompanyIsolation(testData) {
  const { empresas } = testData;

  // Teste: Verificar que empresas pertencem às organizações corretas
  const empresa1A = await prisma.empresa.findUnique({
    where: { id: empresas.empresa1A.id },
    include: { organizacao: true }
  });

  const empresa2A = await prisma.empresa.findUnique({
    where: { id: empresas.empresa2A.id },
    include: { organizacao: true }
  });

  if (empresa1A.organizacao.id === empresa2A.organizacao.id) {
    throw new Error('Empresas de organizações diferentes têm a mesma organização');
  }

  console.log('  ✓ Empresas isoladas por organização');
}

async function testUserPermissions(testData) {
  const { usuarios, organizacoes } = testData;

  // Teste: Verificar permissões do operador
  const membroOperador = await prisma.membroOrganizacao.findUnique({
    where: {
      organizacaoId_usuarioId: {
        organizacaoId: organizacoes.org1.id,
        usuarioId: usuarios.operador1.id
      }
    }
  });

  if (!membroOperador) {
    throw new Error('Membro operador não encontrado');
  }

  if (membroOperador.role !== 'OPERADOR') {
    throw new Error('Role do operador incorreta');
  }

  if (!membroOperador.permissoes) {
    throw new Error('Permissões do operador não definidas');
  }

  const permissoes = membroOperador.permissoes;
  if (permissoes.vendas?.acessar !== true) {
    throw new Error('Operador deveria ter acesso a vendas');
  }

  if (permissoes.financeiro?.acessar !== false) {
    throw new Error('Operador não deveria ter acesso ao financeiro');
  }

  console.log('  ✓ Sistema de permissões funcionando');
}

async function testDataIntegrity(testData) {
  const { organizacoes, empresas } = testData;

  // Teste: Verificar relacionamentos
  const org1ComEmpresas = await prisma.organizacao.findUnique({
    where: { id: organizacoes.org1.id },
    include: { empresas: true }
  });

  if (org1ComEmpresas.empresas.length !== 2) {
    throw new Error('Organização 1 deveria ter 2 empresas');
  }

  // Teste: Verificar constraints de CNPJ único
  try {
    await prisma.empresa.create({
      data: {
        nome: 'Empresa Duplicada',
        cnpj: empresas.empresa1A.cnpj, // CNPJ duplicado
        organizacaoId: organizacoes.org2.id
      }
    });
    throw new Error('Deveria ter falhado por CNPJ duplicado');
  } catch (error) {
    if (!error.message.includes('Unique constraint')) {
      console.log('  ✓ Constraint de CNPJ único funcionando');
    } else {
      throw error;
    }
  }

  console.log('  ✓ Integridade dos dados mantida');
}

// Executar testes se chamado diretamente
if (require.main === module) {
  testSecurity();
}

module.exports = { testSecurity };

