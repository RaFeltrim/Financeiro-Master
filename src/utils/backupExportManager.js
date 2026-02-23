/**
 * Módulo de Backup e Exportação de Dados
 * Permite exportar dados financeiros e fazer backup das informações
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

class BackupExportManager {
  constructor(expenseService) {
    this.expenseService = expenseService;
    this.backupDir = path.join(__dirname, '../backups');
    
    // Criar diretório de backups se não existir
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  // Exportar todas as despesas para JSON
  async exportarDespesas(formato = 'json') {
    const despesas = this.expenseService.getAllExpenses();
    
    const dadosExportacao = {
      exportadoEm: new Date().toISOString(),
      totalDespesas: despesas.length,
      despesas: despesas,
      sistema: 'Finance Master',
      versao: '1.0.5'
    };

    if (formato.toLowerCase() === 'json') {
      return JSON.stringify(dadosExportacao, null, 2);
    } else if (formato.toLowerCase() === 'csv') {
      return this.converterParaCSV(dadosExportacao.despesas);
    }
    
    throw new Error('Formato de exportação não suportado. Use "json" ou "csv".');
  }

  // Converter despesas para formato CSV
  converterParaCSV(despesas) {
    if (!despesas || despesas.length === 0) {
      return 'ID,Valor,Data,Categoria,Descrição,CriadoEm\n';
    }

    const cabecalhos = ['ID', 'Valor', 'Data', 'Categoria', 'Descrição', 'CriadoEm'];
    let csv = cabecalhos.join(',') + '\n';

    for (const despesa of despesas) {
      const linha = [
        despesa.id || '',
        despesa.value || '',
        despesa.date || '',
        despesa.category ? `"${despesa.category}"` : '""',
        despesa.description ? `"${despesa.description.replace(/"/g, '""')}"` : '""',
        despesa.createdAt || ''
      ].join(',');
      csv += linha + '\n';
    }

    return csv;
  }

  // Criar backup completo
  async criarBackup(nomePersonalizado = null) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const nomeArquivo = nomePersonalizado || `backup-${timestamp}.json`;
      const caminhoCompleto = path.join(this.backupDir, nomeArquivo);

      const dadosBackup = {
        sistema: 'Finance Master',
        versao: '1.0.5',
        criadoEm: new Date().toISOString(),
        dados: {
          despesas: this.expenseService.getAllExpenses(),
          estatisticas: this.expenseService.getStatistics()
        }
      };

      await promisify(fs.writeFile)(caminhoCompleto, JSON.stringify(dadosBackup, null, 2));
      
      return {
        sucesso: true,
        caminho: caminhoCompleto,
        nomeArquivo,
        tamanho: fs.statSync(caminhoCompleto).size,
        mensagem: `Backup criado com sucesso: ${nomeArquivo}`
      };
    } catch (error) {
      throw new Error(`Erro ao criar backup: ${error.message}`);
    }
  }

  // Restaurar backup
  async restaurarBackup(caminhoArquivo) {
    try {
      if (!fs.existsSync(caminhoArquivo)) {
        throw new Error('Arquivo de backup não encontrado.');
      }

      const conteudo = fs.readFileSync(caminhoArquivo, 'utf8');
      const dadosBackup = JSON.parse(conteudo);

      if (dadosBackup.sistema !== 'Finance Master') {
        throw new Error('Arquivo de backup inválido ou corrompido.');
      }

      // Aqui você implementaria a lógica para restaurar os dados
      // Por simplicidade, estamos apenas retornando os dados
      return {
        sucesso: true,
        dados: dadosBackup.dados,
        mensagem: 'Backup restaurado com sucesso (simulado)'
      };
    } catch (error) {
      throw new Error(`Erro ao restaurar backup: ${error.message}`);
    }
  }

  // Listar backups disponíveis
  listarBackups() {
    try {
      const arquivos = fs.readdirSync(this.backupDir);
      const backups = arquivos
        .filter(arquivo => arquivo.endsWith('.json') && arquivo.startsWith('backup-'))
        .map(arquivo => {
          const caminhoCompleto = path.join(this.backupDir, arquivo);
          const stats = fs.statSync(caminhoCompleto);
          return {
            nome: arquivo,
            caminho: caminhoCompleto,
            tamanho: stats.size,
            criadoEm: stats.birthtime,
            modificadoEm: stats.mtime
          };
        })
        .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm)); // Ordenar por data (mais recente primeiro)

      return {
        total: backups.length,
        backups
      };
    } catch (error) {
      throw new Error(`Erro ao listar backups: ${error.message}`);
    }
  }

  // Exportar relatório financeiro
  async gerarRelatorio(mes = null, ano = null) {
    const despesas = this.expenseService.getAllExpenses();
    
    // Filtrar por mês e ano se especificados
    const despesasFiltradas = mes && ano 
      ? despesas.filter(d => {
          const dataDespesa = new Date(d.date);
          return dataDespesa.getMonth() + 1 === mes && dataDespesa.getFullYear() === ano;
        })
      : despesas;

    // Agrupar por categoria
    const porCategoria = {};
    let totalGeral = 0;

    for (const despesa of despesasFiltradas) {
      if (!porCategoria[despesa.category]) {
        porCategoria[despesa.category] = {
          total: 0,
          itens: 0,
          despesas: []
        };
      }
      
      porCategoria[despesa.category].total += despesa.value;
      porCategoria[despesa.category].itens += 1;
      porCategoria[despesa.category].despesas.push(despesa);
      totalGeral += despesa.value;
    }

    const periodo = mes && ano ? `${mes}/${ano}` : 'Todos os períodos';

    return {
      periodo,
      totalGeral,
      numeroDespesas: despesasFiltradas.length,
      porCategoria,
      detalhes: despesasFiltradas
    };
  }
}

module.exports = BackupExportManager;