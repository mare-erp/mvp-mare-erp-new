import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from '@/app/lib/prisma';
import { jsPDF } from 'jspdf';

interface TokenPayload {
  empresaId: string;
  userId: string;
}

// GET - Gerar PDF do pedido
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    const { empresaId } = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;

    // Buscar o pedido com todas as informações necessárias
    const pedido = await prisma.pedido.findFirst({
      where: {
        id: params.id,
        empresaId: empresaId,
      },
      include: {
        cliente: true,
        usuario: { select: { nome: true, email: true } },
        empresa: {
          select: {
            nome: true,
            cnpj: true,
            rua: true,
            numero: true,
            complemento: true,
            bairro: true,
            cidade: true,
            uf: true,
            cep: true,
            telefone: true, 
            email: true 
          } 
        },
        itens: {
          include: {
            produto: { select: { nome: true } }
          }
        }
      },
    });

    if (!pedido) {
      return NextResponse.json({ message: 'Pedido não encontrado' }, { status: 404 });
    }

    // Criar o PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPosition = 20;

    // Cabeçalho da empresa
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(pedido.empresa.nome, 20, yPosition);
    yPosition += 12;

    // Endereço completo da empresa
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    if (pedido.empresa.cnpj) {
      doc.text(`CNPJ: ${pedido.empresa.cnpj}`, 20, yPosition);
      yPosition += 5;
    }

    // Montar endereço completo
    let enderecoCompleto = '';
    if (pedido.empresa.rua) {
      enderecoCompleto += pedido.empresa.rua;
      if (pedido.empresa.numero) enderecoCompleto += `, ${pedido.empresa.numero}`;
      if (pedido.empresa.complemento) enderecoCompleto += `, ${pedido.empresa.complemento}`;
    }
    if (pedido.empresa.bairro) {
      if (enderecoCompleto) enderecoCompleto += ' - ';
      enderecoCompleto += pedido.empresa.bairro;
    }
    if (pedido.empresa.cidade && pedido.empresa.uf) {
      if (enderecoCompleto) enderecoCompleto += ' - ';
      enderecoCompleto += `${pedido.empresa.cidade}/${pedido.empresa.uf}`;
    }
    if (pedido.empresa.cep) {
      if (enderecoCompleto) enderecoCompleto += ' - ';
      enderecoCompleto += `CEP: ${pedido.empresa.cep}`;
    }

    if (enderecoCompleto) {
      doc.text(enderecoCompleto, 20, yPosition);
      yPosition += 5;
    }

    if (pedido.empresa.telefone) {
      doc.text(`Telefone: ${pedido.empresa.telefone}`, 20, yPosition);
      yPosition += 5;
    }
    if (pedido.empresa.email) {
      doc.text(`Email: ${pedido.empresa.email}`, 20, yPosition);
      yPosition += 5;
    }

    yPosition += 10;

    // Linha separadora
    doc.setLineWidth(0.5);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 15;

    // Título do documento
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    const tipoDocumento = pedido.status === 'VENDIDO' ? 'PEDIDO DE VENDA' : 
                         pedido.status === 'ORCAMENTO' ? 'ORÇAMENTO' : 'PEDIDO';
    doc.text(tipoDocumento, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Informações do pedido em duas colunas
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Coluna esquerda
    doc.text(`Número: #${pedido.numeroPedido}`, 20, yPosition);
    doc.text(`Data: ${new Date(pedido.dataPedido).toLocaleDateString('pt-BR')}`, 20, yPosition + 5);
    if (pedido.dataEntrega) {
      doc.text(`Entrega: ${new Date(pedido.dataEntrega).toLocaleDateString('pt-BR')}`, 20, yPosition + 10);
    }
    if (pedido.status === 'ORCAMENTO' && pedido.validadeOrcamento) {
      doc.text(`Validade: ${new Date(pedido.validadeOrcamento).toLocaleDateString('pt-BR')}`, 20, yPosition + 15);
    }

    // Coluna direita - Vendedor
    doc.setFont('helvetica', 'bold');
    doc.text('VENDEDOR RESPONSÁVEL:', pageWidth - 100, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(pedido.usuario.nome, pageWidth - 100, yPosition + 5);
    if (pedido.usuario.email) {
      doc.text(pedido.usuario.email, pageWidth - 100, yPosition + 10);
    }

    yPosition += 25;

    // Informações do cliente
    doc.setFont('helvetica', 'bold');
    doc.text('DADOS DO CLIENTE:', 20, yPosition);
    yPosition += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Nome: ${pedido.cliente.nome}`, 20, yPosition);
    yPosition += 5;
    
    if (pedido.cliente.cpfCnpj) {
      doc.text(`${pedido.cliente.tipoPessoa === 'FISICA' ? 'CPF' : 'CNPJ'}: ${pedido.cliente.cpfCnpj}`, 20, yPosition);
      yPosition += 5;
    }
    
    if (pedido.cliente.email) {
      doc.text(`Email: ${pedido.cliente.email}`, 20, yPosition);
      yPosition += 5;
    }
    
    if (pedido.cliente.telefone) {
      doc.text(`Telefone: ${pedido.cliente.telefone}`, 20, yPosition);
      yPosition += 5;
    }

    // Endereço do cliente
    let enderecoCliente = '';
    if (pedido.cliente.rua) {
      enderecoCliente += pedido.cliente.rua;
      if (pedido.cliente.numero) enderecoCliente += `, ${pedido.cliente.numero}`;
      if (pedido.cliente.complemento) enderecoCliente += `, ${pedido.cliente.complemento}`;
    }
    if (pedido.cliente.bairro) {
      if (enderecoCliente) enderecoCliente += ' - ';
      enderecoCliente += pedido.cliente.bairro;
    }
    if (pedido.cliente.cidade && pedido.cliente.uf) {
      if (enderecoCliente) enderecoCliente += ' - ';
      enderecoCliente += `${pedido.cliente.cidade}/${pedido.cliente.uf}`;
    }
    if (pedido.cliente.cep) {
      if (enderecoCliente) enderecoCliente += ' - ';
      enderecoCliente += `CEP: ${pedido.cliente.cep}`;
    }

    if (enderecoCliente) {
      doc.text(`Endereço: ${enderecoCliente}`, 20, yPosition);
      yPosition += 5;
    }

    yPosition += 15;

    // Cabeçalho da tabela de itens
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    
    // Fundo do cabeçalho
    doc.setFillColor(240, 240, 240);
    doc.rect(20, yPosition - 3, pageWidth - 40, 8, 'F');
    
    doc.text('ITEM', 22, yPosition + 2);
    doc.text('DESCRIÇÃO', 45, yPosition + 2);
    doc.text('QTD', 120, yPosition + 2);
    doc.text('PREÇO UNIT.', 135, yPosition + 2);
    doc.text('TOTAL', pageWidth - 25, yPosition + 2, { align: 'right' });
    yPosition += 10;

    // Itens do pedido
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    let subtotal = 0;

    pedido.itens.forEach((item, index) => {
      const valorItem = Number(item.precoUnitario) * item.quantidade;
      subtotal += valorItem;

      // Alternar cor de fundo das linhas
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(20, yPosition - 2, pageWidth - 40, 6, 'F');
      }

      doc.text(`${index + 1}`, 22, yPosition + 2);
      
      // Quebrar descrição se for muito longa
      const descricao = item.descricao;
      if (descricao.length > 35) {
        const lines = doc.splitTextToSize(descricao, 70);
        doc.text(lines[0], 45, yPosition + 2);
        if (lines.length > 1) {
          yPosition += 4;
          doc.text(lines[1], 45, yPosition + 2);
        }
      } else {
        doc.text(descricao, 45, yPosition + 2);
      }
      
      doc.text(item.quantidade.toString(), 120, yPosition + 2);
      doc.text(`R$ ${Number(item.precoUnitario).toFixed(2).replace('.', ',')}`, 135, yPosition + 2);
      doc.text(`R$ ${valorItem.toFixed(2).replace('.', ',')}`, pageWidth - 25, yPosition + 2, { align: 'right' });
      
      yPosition += 8;

      // Verificar se precisa de nova página
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
    });

    yPosition += 5;

    // Linha separadora
    doc.setLineWidth(0.5);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 10;

    // Totais
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    doc.text(`Subtotal:`, pageWidth - 60, yPosition);
    doc.text(`R$ ${subtotal.toFixed(2).replace('.', ',')}`, pageWidth - 25, yPosition, { align: 'right' });
    yPosition += 6;

    if (pedido.frete && Number(pedido.frete) > 0) {
      doc.text(`Frete:`, pageWidth - 60, yPosition);
      doc.text(`R$ ${Number(pedido.frete).toFixed(2).replace('.', ',')}`, pageWidth - 25, yPosition, { align: 'right' });
      yPosition += 6;
    }

    // Total geral
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    const totalGeral = subtotal + Number(pedido.frete || 0);
    doc.text(`TOTAL GERAL:`, pageWidth - 60, yPosition);
    doc.text(`R$ ${totalGeral.toFixed(2).replace('.', ',')}`, pageWidth - 25, yPosition, { align: 'right' });

    yPosition += 15;

    // Informações adicionais
    if (pedido.informacoesNegociacao) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('INFORMAÇÕES DA NEGOCIAÇÃO:', 20, yPosition);
      yPosition += 6;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const infoLines = doc.splitTextToSize(pedido.informacoesNegociacao, pageWidth - 40);
      doc.text(infoLines, 20, yPosition);
      yPosition += infoLines.length * 4 + 10;
    }

    if (pedido.observacoesNF) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('OBSERVAÇÕES:', 20, yPosition);
      yPosition += 6;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const obsLines = doc.splitTextToSize(pedido.observacoesNF, pageWidth - 40);
      doc.text(obsLines, 20, yPosition);
      yPosition += obsLines.length * 4 + 10;
    }

    // Status e data de geração
    yPosition += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    const statusTexto = pedido.status === 'VENDIDO' ? 'VENDIDO' : 
                       pedido.status === 'ORCAMENTO' ? 'ORÇAMENTO' : 'RECUSADO';
    doc.text(`Status: ${statusTexto}`, 20, yPosition);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Documento gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth - 80, yPosition, { align: 'right' });

    // Gerar o PDF como buffer
    const pdfBuffer = doc.output('arraybuffer');

    // Retornar o PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="pedido-${pedido.numeroPedido}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    return NextResponse.json({ message: 'Erro ao gerar PDF do pedido.' }, { status: 500 });
  }
}
