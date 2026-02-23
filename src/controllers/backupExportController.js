/**
 * Controller para Backup e Exportação
 * Gerencia as requisições da interface web para backup/exportação
 */

const path = require('path');
const BackupExportManager = require('../utils/backupExportManager');
const ExpenseService = require('../services/expenseService');
const logger = require('../utils/logger');

class BackupExportController {
  constructor() {
    this.backupManager = new BackupExportManager(new ExpenseService());
  }

  // Endpoint para exportar despesas
  async exportarDespesas(req, res) {
    try {
      const formato = req.query.formato || 'json';
      logger.info('Exporting expenses', { formato, userId: req.user?.id });
      
      const dados = await this.backupManager.exportarDespesas(formato);
      
      res.setHeader('Content-Type', formato === 'csv' ? 'text/csv' : 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=despesas_${new Date().toISOString().slice(0, 10)}.${formato}`);
      res.send(dados);
      
      logger.info('Expenses exported successfully', { formato });
    } catch (error) {
      logger.error('Error exporting expenses', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Endpoint para criar backup
  async criarBackup(req, res) {
    try {
      const { nomePersonalizado } = req.body;
      logger.info('Creating backup', { nomePersonalizado, userId: req.user?.id });
      
      const resultado = await this.backupManager.criarBackup(nomePersonalizado);
      
      logger.info('Backup created successfully', { nomeArquivo: resultado.nomeArquivo });
      res.json(resultado);
    } catch (error) {
      logger.error('Error creating backup', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Endpoint para listar backups
  async listarBackups(req, res) {
    try {
      logger.info('Listing backups', { userId: req.user?.id });
      
      const backups = this.backupManager.listarBackups();
      
      logger.info('Backups listed successfully', { count: backups.total });
      res.json(backups);
    } catch (error) {
      logger.error('Error listing backups', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Endpoint para gerar relatório
  async gerarRelatorio(req, res) {
    try {
      const { mes, ano } = req.query;
      logger.info('Generating financial report', { mes, ano, userId: req.user?.id });
      
      const relatorio = await this.backupManager.gerarRelatorio(
        mes ? parseInt(mes) : null,
        ano ? parseInt(ano) : null
      );
      
      logger.info('Financial report generated successfully', { periodo: relatorio.periodo });
      res.json(relatorio);
    } catch (error) {
      logger.error('Error generating report', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Endpoint para baixar backup específico
  async baixarBackup(req, res) {
    try {
      const { nomeArquivo } = req.params;
      logger.info('Downloading backup file', { nomeArquivo, userId: req.user?.id });
      
      // Sanitize filename to prevent path traversal attacks
      const sanitizedFilename = path.basename(nomeArquivo);
      
      // Verify that the filename only contains allowed characters
      if (!/^[\w\-_.]+$/.test(sanitizedFilename)) {
        logger.warn('Invalid filename provided', { nomeArquivo });
        return res.status(400).json({ error: 'Nome de arquivo inválido.' });
      }
      
      // Ensure the file is in the correct directory
      const fullPath = path.join(__dirname, '..', 'backups', sanitizedFilename);
      
      // Resolve the path to ensure it doesn't go outside the backups directory
      const resolvedPath = path.resolve(fullPath);
      const backupsDir = path.resolve(path.join(__dirname, '..', 'backups'));
      
      if (!resolvedPath.startsWith(backupsDir)) {
        logger.warn('Access attempt outside backups directory', { resolvedPath, backupsDir });
        return res.status(400).json({ error: 'Acesso negado ao arquivo.' });
      }
      
      if (!require('fs').existsSync(resolvedPath)) {
        logger.warn('Backup file not found', { resolvedPath });
        return res.status(404).json({ error: 'Arquivo de backup não encontrado.' });
      }
      
      res.download(resolvedPath, sanitizedFilename, (err) => {
        if (err) {
          logger.error('Error downloading backup file', err);
          res.status(500).json({ error: 'Erro ao baixar arquivo de backup.' });
        } else {
          logger.info('Backup file downloaded successfully', { nomeArquivo: sanitizedFilename });
        }
      });
    } catch (error) {
      logger.error('Error downloading backup', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = BackupExportController;