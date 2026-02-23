/**
 * Módulo de Automação de Débitos Automáticos
 * Extensão do Finance Master para gerenciamento automático de débitos
 */

const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class AutomacaoDebitos {
  constructor(expenseService) {
    this.expenseService = expenseService;
    this.debitos = this.carregarDebitos();
    this.contaConfig = this.carregarContaConfig();
  }

  // Carregar débitos automaticamente
  carregarDebitos() {
    const filePath = path.join(__dirname, '../data/debitos-automaticos.json');
    if (fs.existsSync(filePath)) {
      try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
      } catch (error) {
        logger.error('Erro ao carregar débitos:', error);
        return [];
      }
    }
    return [];
  }

  // Salvar débitos
  salvarDebitos() {
    const filePath = path.join(__dirname, '../data/debitos-automaticos.json');
    const dirPath = path.dirname(filePath);
    
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    fs.writeFileSync(filePath, JSON.stringify(this.debitos, null, 2));
  }

  // Carregar configuração da conta
  carregarContaConfig() {
    const filePath = path.join(__dirname, '../data/conta-config.json');
    if (fs.existsSync(filePath)) {
      try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
      } catch (error) {
        logger.error('Erro ao carregar configuração da conta:', error);
        return {};
      }
    }
    return {};
  }

  // Adicionar novo débito automático
  adicionarDebito(descricao, valor, vencimentoDia, categoria = 'Outros') {
    const novoDebito = {
      id: `debito_${Date.now()}`,
      descricao,
      valor,
      vencimentoDia,
      frequencia: 'mensal',
      ultimaData: null,
      proximaData: this.calcularProximaData(vencimentoDia),
      categoria,
      ativo: true,
      criadoEm: new Date().toISOString()
    };

    this.debitos.push(novoDebito);
    this.salvarDebitos();
    return novoDebito;
  }

  // Calcular próxima data de vencimento
  calcularProximaData(vencimentoDia) {
    const hoje = new Date();
    let mes = hoje.getMonth();
    let ano = hoje.getFullYear();
    
    // Se o dia já passou neste mês, vai para o próximo mês
    if (vencimentoDia < hoje.getDate()) {
      mes++;
      if (mes > 11) {
        mes = 0;
        ano++;
      }
    }
    
    const proximaData = new Date(ano, mes, vencimentoDia);
    return proximaData.toISOString().split('T')[0];
  }

  // Calcular vencimentos nos próximos dias
  calcularVencimentosProximos(dias = 15) {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() + dias);

    const vencimentos = this.debitos.filter(debito => {
      if (!debito.ativo) return false;
      
      const proximaData = new Date(debito.proximaData);
      return proximaData <= dataLimite && proximaData >= new Date();
    });

    const total = vencimentos.reduce((acc, debito) => acc + debito.valor, 0);

    return {
      vencimentos,
      total,
      dataLimite,
      diasConsiderados: dias
    };
  }

  // Obter data ideal para transferência PIX
  getDataTransferenciaIdeal() {
    const vencimentosOrdenados = [...this.debitos]
      .filter(d => d.ativo)
      .sort((a, b) => new Date(a.proximaData) - new Date(b.proximaData));

    if (vencimentosOrdenados.length > 0) {
      const primeiroVencimento = new Date(vencimentosOrdenados[0].proximaData);
      const dataTransferencia = new Date(primeiroVencimento);
      dataTransferencia.setDate(dataTransferencia.getDate() - 3); // 3 dias antes
      
      return {
        dataVencimento: primeiroVencimento,
        dataTransferenciaIdeal: dataTransferencia,
        descricao: vencimentosOrdenados[0].descricao,
        valor: vencimentosOrdenados[0].valor
      };
    }

    return null;
  }

  // Sugerir transferência PIX
  sugerirTransferenciaPIX() {
    const vencimentos = this.calcularVencimentosProximos(15);
    const infoTransferencia = this.getDataTransferenciaIdeal();

    if (!infoTransferencia) {
      return {
        precisaTransferencia: false,
        mensagem: "Nenhum vencimento nos próximos dias"
      };
    }

    // Calcular valor necessário com margem de segurança
    const saldoNecessario = vencimentos.total + 200; // Margem de segurança

    return {
      precisaTransferencia: true,
      dataTransferenciaIdeal: infoTransferencia.dataTransferenciaIdeal,
      dataVencimento: infoTransferencia.dataVencimento,
      descricaoPrimeiro: infoTransferencia.descricao,
      valorTotal: vencimentos.total,
      valorSugerido: saldoNecessario,
      vencimentos: vencimentos.vencimentos,
      mensagem: `Transferir R$ ${saldoNecessario.toFixed(2)} para cobrir débitos até ${infoTransferencia.dataVencimento.toLocaleDateString()}`
    };
  }

  // Calcular transferência ideal com saldo atual
  calcularTransferenciaIdeal(saldoAtual) {
    const sugestao = this.sugerirTransferenciaPIX();
    
    if (!sugestao.precisaTransferencia) {
      return sugestao;
    }

    const diferenca = sugestao.valorSugerido - saldoAtual;
    
    return {
      ...sugestao,
      valorATransferir: diferenca > 0 ? diferenca : 0,
      saldoAtual,
      mensagem: diferenca > 0 
        ? `Transferir R$ ${diferenca.toFixed(2)} para manter saldo ideal`
        : `Saldo suficiente na conta de débitos`
    };
  }

  // Verificar necessidade de transferência automaticamente
  async verificarNecessidadePIX() {
    const sugestao = this.sugerirTransferenciaPIX();
    
    if (sugestao.precisaTransferencia && sugestao.valorATransferir > 0) {
      // Criar alerta para o usuário
      await this.criarAlertaPIX(sugestao);
    }
    
    return sugestao;
  }

  // Criar alerta de transferência PIX
  async criarAlertaPIX(sugestao) {
    const alerta = {
      tipo: 'pix_transferencia',
      titulo: 'Transferência PIX Necessária',
      mensagem: `Transferir R$ ${sugestao.valorATransferir.toFixed(2)} para a conta de débitos`,
      dataSugerida: sugestao.dataTransferenciaIdeal,
      prioridade: 'media',
      criadoEm: new Date().toISOString()
    };
    
    // Salvar alerta - aqui poderia ser salvo em um banco de dados
    this.salvarAlerta(alerta);
  }

  // Salvar alerta
  salvarAlerta(alerta) {
    const filePath = path.join(__dirname, '../data/alertas.json');
    let alertas = [];
    
    if (fs.existsSync(filePath)) {
      try {
        const data = fs.readFileSync(filePath, 'utf8');
        alertas = JSON.parse(data);
      } catch (error) {
        logger.error('Erro ao carregar alertas:', error);
      }
    }
    
    alertas.push(alerta);
    
    // Manter apenas os últimos 50 alertas
    if (alertas.length > 50) {
      alertas = alertas.slice(-50);
    }
    
    fs.writeFileSync(filePath, JSON.stringify(alertas, null, 2));
  }

  // Registrar débito realizado
  async registrarDebitoRealizado(debitoId) {
    const debito = this.debitos.find(d => d.id === debitoId);
    if (!debito) return false;
    
    // Atualizar data do próximo vencimento
    debito.ultimaData = new Date().toISOString().split('T')[0];
    debito.proximaData = this.calcularProximaDataRecorrente(debito);
    
    // Registrar como despesa no sistema
    const expense = {
      value: debito.valor,
      date: new Date(),
      category: debito.categoria,
      description: `Débito automático: ${debito.descricao}`
    };
    
    await this.expenseService.createExpense(expense);
    
    // Salvar alterações
    this.salvarDebitos();
    
    return true;
  }

  // Calcular próxima data para débitos recorrentes
  calcularProximaDataRecorrente(debito) {
    const dataAtual = new Date();
    let proximaData = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), debito.vencimentoDia);
    
    // Se o dia já passou, vai para o próximo mês
    if (proximaData < dataAtual) {
      proximaData.setMonth(proximaData.getMonth() + 1);
    }
    
    return proximaData.toISOString().split('T')[0];
  }

  // Obter todos os alertas
  getAlertasRecentes(limit = 10) {
    const filePath = path.join(__dirname, '../data/alertas.json');
    if (fs.existsSync(filePath)) {
      try {
        const data = fs.readFileSync(filePath, 'utf8');
        const alertas = JSON.parse(data);
        return alertas.slice(-limit).reverse(); // Retorna os mais recentes primeiro
      } catch (error) {
        logger.error('Erro ao carregar alertas recentes:', error);
        return [];
      }
    }
    return [];
  }

  // Obter estatísticas de débitos
  getEstatisticas() {
    const ativos = this.debitos.filter(d => d.ativo);
    const vencimentos = this.calcularVencimentosProximos(30);
    
    return {
      totalDebitos: this.debitos.length,
      totalAtivos: ativos.length,
      totalInativos: this.debitos.length - ativos.length,
      vencimentosProximos: vencimentos.vencimentos.length,
      valorVencimentosProximos: vencimentos.total,
      proximoVencimento: this.getDataTransferenciaIdeal()
    };
  }
}

module.exports = AutomacaoDebitos;