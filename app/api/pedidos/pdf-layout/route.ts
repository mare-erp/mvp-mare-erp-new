import { NextRequest, NextResponse } from 'next/server';
import { withAuth, logAuditoria } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';

export const POST = withAuth(
  async (req: NextRequest, context) => {
    try {
      const { pedidoId } = await req.json();

      if (!pedidoId) {
        return NextResponse.json(
          { error: 'ID do pedido é obrigatório' },
          { status: 400 }
        );
      }

      // Buscar pedido com todos os dados necessários
      const pedido = await prisma.pedido.findFirst({
        where: {
          id: pedidoId,
          empresaId: context.empresaId || undefined
        },
        include: {
          cliente: true,
          usuario: {
            select: {
              nome: true,
              email: true
            }
          },
          empresa: {
            select: {
              nome: true,
              cnpj: true,
              cep: true,
              rua: true,
              numero: true,
              complemento: true,
              bairro: true,
              cidade: true,
              uf: true,
              telefone: true,
              email: true
            }
          },
          itens: {
            include: {
              produto: {
                select: {
                  nome: true,
                  sku: true,
                  unidadeMedida: true
                }
              }
            }
          }
        }
      });

      if (!pedido) {
        return NextResponse.json(
          { error: 'Pedido não encontrado' },
          { status: 404 }
        );
      }

      // Gerar HTML do PDF com layout autêntico
      const htmlContent = generatePdfHtml(pedido);

      // Log de auditoria
      await logAuditoria(
        context.userId,
        context.organizacaoId,
        context.empresaId || null,
        'IMPRIMIR',
        'Pedido',
        pedidoId,
        { numeroPedido: pedido.numeroPedido, status: pedido.status },
        req
      );

      return NextResponse.json({
        html: htmlContent,
        pedido: {
          numeroPedido: pedido.numeroPedido,
          status: pedido.status,
          cliente: pedido.cliente.nome
        }
      });

    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      );
    }
  },
  {
    requireCompany: true,
    requiredPermission: { modulo: 'vendas', acao: 'imprimir' }
  }
);

function generatePdfHtml(pedido: any): string {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
  };

  const statusLabels = {
    ORCAMENTO: 'Orçamento',
    VENDIDO: 'Venda',
    RECUSADO: 'Recusado'
  };

  const statusLabel = statusLabels[pedido.status as keyof typeof statusLabels] ?? pedido.status;

  const empresaLogo =
    'logoUrl' in pedido.empresa ? (pedido.empresa as { logoUrl?: string | null }).logoUrl ?? null : null;

  const empresaEndereco =
    'endereco' in pedido.empresa && (pedido.empresa as { endereco?: string | null }).endereco
      ? (pedido.empresa as { endereco?: string | null }).endereco
      : [
          pedido.empresa.rua,
          pedido.empresa.numero,
          pedido.empresa.complemento,
          pedido.empresa.bairro,
          pedido.empresa.cidade,
          pedido.empresa.uf,
          pedido.empresa.cep ? `CEP: ${pedido.empresa.cep}` : null
        ]
          .filter(Boolean)
          .join(', ');

  const clienteEndereco =
    'endereco' in pedido.cliente && (pedido.cliente as { endereco?: string | null }).endereco
      ? (pedido.cliente as { endereco?: string | null }).endereco
      : [
          pedido.cliente.rua,
          pedido.cliente.numero,
          pedido.cliente.complemento,
          pedido.cliente.bairro,
          pedido.cliente.cidade,
          pedido.cliente.uf,
          pedido.cliente.cep ? `CEP: ${pedido.cliente.cep}` : null
        ]
          .filter(Boolean)
          .join(', ');

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${statusLabel} ${pedido.numeroPedido}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Arial', sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #1A202C;
          background: white;
        }
        
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          border-bottom: 2px solid #0A2F5B;
          padding-bottom: 20px;
        }
        
        .company-info {
          flex: 1;
        }
        
        .company-logo {
          width: 120px;
          height: 60px;
          object-fit: contain;
          margin-bottom: 10px;
        }
        
        .company-name {
          font-size: 18px;
          font-weight: bold;
          color: #0A2F5B;
          margin-bottom: 5px;
        }
        
        .company-details {
          font-size: 11px;
          color: #718096;
          line-height: 1.3;
        }
        
        .document-info {
          text-align: right;
          background: #F0F2F5;
          padding: 15px;
          border-radius: 8px;
          min-width: 200px;
        }
        
        .document-title {
          font-size: 20px;
          font-weight: bold;
          color: #0A2F5B;
          margin-bottom: 10px;
        }
        
        .document-number {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .document-date {
          font-size: 11px;
          color: #718096;
        }
        
        .section {
          margin-bottom: 25px;
        }
        
        .section-title {
          font-size: 14px;
          font-weight: bold;
          color: #0A2F5B;
          margin-bottom: 10px;
          border-bottom: 1px solid #E2E8F0;
          padding-bottom: 5px;
        }
        
        .client-info {
          background: #F8F9FA;
          padding: 15px;
          border-radius: 6px;
          border-left: 4px solid #00BFA5;
        }
        
        .client-name {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        
        .items-table th {
          background: #0A2F5B;
          color: white;
          padding: 12px 8px;
          text-align: left;
          font-size: 11px;
          font-weight: bold;
        }
        
        .items-table td {
          padding: 10px 8px;
          border-bottom: 1px solid #E2E8F0;
          font-size: 11px;
        }
        
        .items-table tr:nth-child(even) {
          background: #F8F9FA;
        }
        
        .text-right {
          text-align: right;
        }
        
        .text-center {
          text-align: center;
        }
        
        .totals {
          background: #F8F9FA;
          padding: 15px;
          border-radius: 6px;
          border: 1px solid #E2E8F0;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
        }
        
        .total-row.final {
          font-size: 14px;
          font-weight: bold;
          color: #0A2F5B;
          border-top: 1px solid #CBD5E0;
          padding-top: 10px;
          margin-top: 10px;
        }
        
        .payment-info {
          background: #E6FFFA;
          padding: 15px;
          border-radius: 6px;
          border-left: 4px solid #00BFA5;
        }
        
        .seller-info {
          background: #EDF2F7;
          padding: 15px;
          border-radius: 6px;
          border-left: 4px solid #0A2F5B;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #E2E8F0;
          text-align: center;
          font-size: 10px;
          color: #718096;
        }
        
        .observations {
          background: #FFFBEB;
          padding: 15px;
          border-radius: 6px;
          border-left: 4px solid #DD6B20;
          margin-bottom: 20px;
        }
        
        @media print {
          .container {
            padding: 0;
          }
          
          body {
            font-size: 11px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="company-info">
            ${empresaLogo ? `<img src="${empresaLogo}" alt="${pedido.empresa.nome}" class="company-logo">` : ''}
            <div class="company-name">${pedido.empresa.nome}</div>
            <div class="company-details">
              ${pedido.empresa.cnpj ? `CNPJ: ${pedido.empresa.cnpj}<br>` : ''}
              ${empresaEndereco}<br>
              ${[pedido.empresa.cidade, pedido.empresa.uf, pedido.empresa.cep].filter(Boolean).join(' - ')}<br>
              ${pedido.empresa.telefone ? `Tel: ${pedido.empresa.telefone}<br>` : ''}
              ${pedido.empresa.email ? `Email: ${pedido.empresa.email}` : ''}
            </div>
          </div>
          
          <div class="document-info">
            <div class="document-title">${statusLabel} Nº ${pedido.numeroPedido}</div>
            <div class="document-number">Data: ${formatDate(pedido.dataPedido)}</div>
            ${pedido.validadeOrcamento ? `<div class="document-date">Validade: ${formatDate(pedido.validadeOrcamento)}</div>` : ''}
            ${pedido.dataEntrega ? `<div class="document-date">Entrega: ${formatDate(pedido.dataEntrega)}</div>` : ''}
          </div>
        </div>
        
        <!-- Cliente -->
        <div class="section">
          <div class="section-title">Dados do Cliente</div>
          <div class="client-info">
            <div class="client-name">${pedido.cliente.nome}</div>
            ${pedido.cliente.cpfCnpj ? `<div>${pedido.cliente.tipoPessoa === 'JURIDICA' ? 'CNPJ' : 'CPF'}: ${pedido.cliente.cpfCnpj}</div>` : ''}
            ${pedido.cliente.email ? `<div>Email: ${pedido.cliente.email}</div>` : ''}
            ${pedido.cliente.telefone ? `<div>Telefone: ${pedido.cliente.telefone}</div>` : ''}
            ${clienteEndereco ? `<div>Endereço: ${clienteEndereco}</div>` : ''}
          </div>
        </div>
        
        <!-- Itens -->
        <div class="section">
          <div class="section-title">Itens do ${statusLabel}</div>
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 8%">Qt.</th>
                <th style="width: 12%">Código</th>
                <th style="width: 40%">Produto/Serviço</th>
                <th style="width: 8%">Un.</th>
                <th style="width: 16%">Valor Unit.</th>
                <th style="width: 16%">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${pedido.itens.map((item: any) => `
                <tr>
                  <td class="text-center">${item.quantidade}</td>
                  <td>${item.produto?.sku || '-'}</td>
                  <td>${item.descricao}</td>
                  <td class="text-center">${item.produto?.unidadeMedida || 'UN'}</td>
                  <td class="text-right">${formatCurrency(Number(item.precoUnitario))}</td>
                  <td class="text-right">${formatCurrency(Number(item.precoUnitario) * item.quantidade)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <!-- Totais -->
        <div class="section">
          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>${formatCurrency(Number(pedido.valorTotal) - Number(pedido.frete || 0) + Number(pedido.desconto || 0))}</span>
            </div>
            ${Number(pedido.desconto || 0) > 0 ? `
              <div class="total-row">
                <span>Desconto:</span>
                <span>- ${formatCurrency(Number(pedido.desconto))}</span>
              </div>
            ` : ''}
            ${Number(pedido.frete || 0) > 0 ? `
              <div class="total-row">
                <span>Frete:</span>
                <span>${formatCurrency(Number(pedido.frete))}</span>
              </div>
            ` : ''}
            <div class="total-row final">
              <span>TOTAL GERAL:</span>
              <span>${formatCurrency(Number(pedido.valorTotal))}</span>
            </div>
          </div>
        </div>
        
        <!-- Informações de Pagamento -->
        ${pedido.formaPagamento || pedido.parcelas || pedido.banco ? `
          <div class="section">
            <div class="section-title">Condições de Pagamento</div>
            <div class="payment-info">
              ${pedido.formaPagamento ? `<div><strong>Forma de Pagamento:</strong> ${pedido.formaPagamento}</div>` : ''}
              ${pedido.parcelas ? `<div><strong>Parcelas:</strong> ${pedido.parcelas}x</div>` : ''}
              ${pedido.banco ? `<div><strong>Banco:</strong> ${pedido.banco}</div>` : ''}
              ${pedido.dataVencimento ? `<div><strong>Vencimento:</strong> ${formatDate(pedido.dataVencimento)}</div>` : ''}
            </div>
          </div>
        ` : ''}
        
        <!-- Observações -->
        ${pedido.informacoesNegociacao || pedido.observacoesNF ? `
          <div class="section">
            <div class="section-title">Observações</div>
            <div class="observations">
              ${pedido.informacoesNegociacao ? `<div><strong>Negociação:</strong> ${pedido.informacoesNegociacao}</div>` : ''}
              ${pedido.observacoesNF ? `<div><strong>Observações:</strong> ${pedido.observacoesNF}</div>` : ''}
            </div>
          </div>
        ` : ''}
        
        <!-- Vendedor -->
        <div class="section">
          <div class="section-title">Vendedor Responsável</div>
          <div class="seller-info">
            <div><strong>Nome:</strong> ${pedido.usuario.nome}</div>
            <div><strong>Email:</strong> ${pedido.usuario.email}</div>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <div>Este documento foi gerado automaticamente pelo Maré ERP em ${formatDate(new Date())}</div>
          <div>Página 1 de 1</div>
        </div>
      </div>
    </body>
    </html>
  `;
}
