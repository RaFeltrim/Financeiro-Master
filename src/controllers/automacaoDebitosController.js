/**
 * Controller para Automação de Débitos Automáticos
 * Gerencia as requisições da interface web para o módulo de automação
 */

const AutomacaoDebitos = require('../automacao/automacaoDebitos');
const ExpenseService = require('../services/expenseService');
const logger = require('../utils/logger');

class AutomacaoDebitosController {
  constructor() {
    this.automacaoDebitos = new AutomacaoDebitos(new ExpenseService());
  }

  // Endpoint para obter sugestão de transferência PIX
  getSugestaoPIX(req, res) {
    try {
      const saldoAtual = parseFloat(req.query.saldoAtual) || 1500; // Valor padrão para simulação
      logger.info('Getting PIX transfer suggestion', { saldoAtual, userId: req.user?.id });
      
      const sugestao = this.automacaoDebitos.calcularTransferenciaIdeal(saldoAtual);
      
      logger.info('PIX transfer suggestion calculated successfully');
      res.json(sugestao);
    } catch (error) {
      logger.error('Error getting PIX suggestion', error);
      res.status(500).json({ error: 'Erro ao calcular sugestão de transferência' });
    }
  }

  // Endpoint para obter vencimentos próximos
  getVencimentosProximos(req, res) {
    try {
      const dias = parseInt(req.query.dias) || 15;
      const vencimentos = this.automacaoDebitos.calcularVencimentosProximos(dias);
      
      res.json(vencimentos);
    } catch (error) {
      logger.error('Erro ao obter vencimentos próximos:', error);
      res.status(500).json({ error: 'Erro ao calcular vencimentos próximos' });
    }
  }

  // Endpoint para adicionar novo débito automático
  adicionarDebito(req, res) {
    try {
      const { descricao, valor, vencimentoDia, categoria } = req.body;
      
      if (!descricao || !valor || !vencimentoDia) {
        return res.status(400).json({ error: 'Descrição, valor e dia de vencimento são obrigatórios' });
      }
      
      const novoDebito = this.automacaoDebitos.adicionarDebito(descricao, parseFloat(valor), parseInt(vencimentoDia), categoria);
      
      res.json({ success: true, debito: novoDebito });
    } catch (error) {
      logger.error('Erro ao adicionar débito:', error);
      res.status(500).json({ error: 'Erro ao adicionar débito automático' });
    }
  }

  // Endpoint para obter estatísticas
  getEstatisticas(req, res) {
    try {
      const estatisticas = this.automacaoDebitos.getEstatisticas();
      
      res.json(estatisticas);
    } catch (error) {
      logger.error('Erro ao obter estatísticas:', error);
      res.status(500).json({ error: 'Erro ao obter estatísticas' });
    }
  }

  // Endpoint para obter alertas recentes
  getAlertasRecentes(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const alertas = this.automacaoDebitos.getAlertasRecentes(limit);
      
      res.json(alertas);
    } catch (error) {
      logger.error('Erro ao obter alertas recentes:', error);
      res.status(500).json({ error: 'Erro ao obter alertas recentes' });
    }
  }

  // Endpoint para simular verificação automática de necessidade de PIX
  verificarNecessidadePIX(req, res) {
    try {
      const sugestao = this.automacaoDebitos.verificarNecessidadePIX();
      
      res.json(sugestao);
    } catch (error) {
      logger.error('Erro ao verificar necessidade de PIX:', error);
      res.status(500).json({ error: 'Erro ao verificar necessidade de transferência' });
    }
  }

  // Endpoint para obter todos os débitos
  getAllDebitos(req, res) {
    try {
      res.json(this.automacaoDebitos.debitos);
    } catch (error) {
      logger.error('Erro ao obter débitos:', error);
      res.status(500).json({ error: 'Erro ao obter lista de débitos' });
    }
  }

  // Endpoint para atualizar um débito
  atualizarDebito(req, res) {
    try {
      const { id } = req.params;
      const { descricao, valor, vencimentoDia, categoria, ativo } = req.body;
      
      // Encontrar o débito
      const index = this.automacaoDebitos.debitos.findIndex(d => d.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Débito não encontrado' });
      }
      
      // Atualizar os campos
      if (descricao) this.automacaoDebitos.debitos[index].descricao = descricao;
      if (valor) this.automacaoDebitos.debitos[index].valor = parseFloat(valor);
      if (vencimentoDia) this.automacaoDebitos.debitos[index].vencimentoDia = parseInt(vencimentoDia);
      if (categoria) this.automacaoDebitos.debitos[index].categoria = categoria;
      if (ativo !== undefined) this.automacaoDebitos.debitos[index].ativo = ativo;
      
      // Recalcular a próxima data se o dia de vencimento mudou
      if (vencimentoDia) {
        this.automacaoDebitos.debitos[index].proximaData = 
          this.automacaoDebitos.calcularProximaData(parseInt(vencimentoDia));
      }
      
      // Salvar alterações
      this.automacaoDebitos.salvarDebitos();
      
      res.json({ success: true, debito: this.automacaoDebitos.debitos[index] });
    } catch (error) {
      logger.error('Erro ao atualizar débito:', error);
      res.status(500).json({ error: 'Erro ao atualizar débito' });
    }
  }

  // Endpoint para deletar um débito
  deletarDebito(req, res) {
    try {
      const { id } = req.params;
      
      const index = this.automacaoDebitos.debitos.findIndex(d => d.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Débito não encontrado' });
      }
      
      this.automacaoDebitos.debitos.splice(index, 1);
      this.automacaoDebitos.salvarDebitos();
      
      res.json({ success: true });
    } catch (error) {
      logger.error('Erro ao deletar débito:', error);
      res.status(500).json({ error: 'Erro ao deletar débito' });
    }
  }
}

module.exports = AutomacaoDebitosController;