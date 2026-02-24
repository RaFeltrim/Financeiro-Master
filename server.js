const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Security middleware
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

// Set security headers
app.use(helmet());

// Enable CORS
app.use(cors());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use(limiter);

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Logging middleware
const logger = require('./src/utils/logger');
app.use(logger.logRequest);

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, 'frontend')));

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// API routes for expenses (simulated for frontend)
app.use(express.json());

// Bank import functionality
const BankImportController = require('./src/bank-importer/bankImportController');
const bankImportController = new BankImportController();

// Automation functionality
const AutomacaoDebitosController = require('./src/controllers/automacaoDebitosController');
const automacaoController = new AutomacaoDebitosController();

// Backup and export functionality
const BackupExportController = require('./src/controllers/backupExportController');
const backupController = new BackupExportController();

// Expense Service instance
const ExpenseService = require('./src/services/expenseService');
const expenseService = new ExpenseService();

// Get all expenses
app.get('/api/expenses', async (req, res) => {
    try {
        const expensesList = await expenseService.getAllExpenses();
        res.json(expensesList);
    } catch (error) {
        logger.error('Error fetching expenses:', error);
        res.status(500).json({ error: 'Erro ao buscar despesas' });
    }
});

// Add a new expense
app.post('/api/expenses', async (req, res) => {
    const { value, date, category, description } = req.body;

    try {
        const expense = await expenseService.createExpense({
            value: parseFloat(value),
            date,
            category,
            description,
            origem: 'MANUAL'
        });
        res.status(201).json(expense);
    } catch (error) {
        logger.error('Error creating expense:', error);
        res.status(400).json({ error: error.message });
    }
});

// Delete an expense
app.delete('/api/expenses/:id', async (req, res) => {
    const id = req.params.id; // UUID as string
    try {
        const deleted = await expenseService.deleteExpense(id);
        if (!deleted) {
            return res.status(404).json({ error: 'Despesa não encontrada' });
        }
        res.json({ message: 'Despesa excluída com sucesso' });
    } catch (error) {
        logger.error(`Error deleting expense ${id}:`, error);
        res.status(500).json({ error: 'Erro ao excluir despesa' });
    }
});

// Get expense statistics
app.get('/api/stats', async (req, res) => {
    try {
        const expensesList = await expenseService.getAllExpenses();
        const totalExpenses = expensesList.length;
        const totalValue = await expenseService.getTotalExpenses();

        res.json({
            totalExpenses,
            totalValue
        });
    } catch (error) {
        logger.error('Error getting stats:', error);
        res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
});

// Excel import endpoint (simulated)
app.post('/api/import-excel', (req, res) => {
    // In a real implementation, this would process the uploaded Excel file
    // For now, we'll simulate a successful import
    res.json({
        success: true,
        message: 'Importação simulada realizada com sucesso. Em ambiente real, isso processaria o arquivo Excel.',
        importedCount: 0
    });
});

// Bank statement import endpoint
app.post('/api/import-bank-statement', async (req, res) => {
    try {
        const { filePath } = req.body;

        if (!filePath) {
            return res.status(400).json({
                success: false,
                message: 'File path is required for bank statement import'
            });
        }

        // Note: In a real implementation, you would upload the file to the server
        // For this simulation, we'll return the supported file types
        // In a real app, you'd save the file temporarily and process it
        const result = await bankImportController.getSupportedFileTypes();

        res.json({
            success: true,
            message: 'Bank statement import endpoint ready. In a real implementation, this would process the specified file.',
            supportedFileTypes: result.supportedTypes,
            maxFileSize: result.maxFileSize
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Error processing bank statement: ${error.message}`
        });
    }
});

// Get supported bank import file types
app.get('/api/bank-import-types', (req, res) => {
    try {
        const result = bankImportController.getSupportedFileTypes();
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Error getting supported types: ${error.message}`
        });
    }
});

// Automation endpoints

// Get PIX suggestion
app.get('/api/automacao/pix-sugestao', (req, res) => {
    automacaoController.getSugestaoPIX(req, res);
});

// Get upcoming due dates
app.get('/api/automacao/vencimentos-proximos', (req, res) => {
    automacaoController.getVencimentosProximos(req, res);
});

// Add new debit
app.post('/api/automacao/debitos', (req, res) => {
    automacaoController.adicionarDebito(req, res);
});

// Get statistics
app.get('/api/automacao/estatisticas', (req, res) => {
    automacaoController.getEstatisticas(req, res);
});

// Get recent alerts
app.get('/api/automacao/alertas-recentes', (req, res) => {
    automacaoController.getAlertasRecentes(req, res);
});

// Check PIX necessity
app.get('/api/automacao/verificar-pix', (req, res) => {
    automacaoController.verificarNecessidadePIX(req, res);
});

// Get all debits
app.get('/api/automacao/debitos', (req, res) => {
    automacaoController.getAllDebitos(req, res);
});

// Update a debit
app.put('/api/automacao/debitos/:id', (req, res) => {
    automacaoController.atualizarDebito(req, res);
});

// Delete a debit
app.delete('/api/automacao/debitos/:id', (req, res) => {
    automacaoController.deletarDebito(req, res);
});

// Backup and export endpoints

// Export expenses
app.get('/api/exportar/despesas', (req, res) => {
    backupController.exportarDespesas(req, res);
});

// Create backup
app.post('/api/backup/criar', (req, res) => {
    backupController.criarBackup(req, res);
});

// List backups
app.get('/api/backup/listar', (req, res) => {
    backupController.listarBackups(req, res);
});

// Generate report
app.get('/api/relatorio/financeiro', (req, res) => {
    backupController.gerarRelatorio(req, res);
});

// Download specific backup
app.get('/api/backup/download/:nomeArquivo', (req, res) => {
    backupController.baixarBackup(req, res);
});

// Error handling middleware
app.use((error, req, res, next) => {
    logger.error('Unhandled error occurred', error);

    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

app.listen(PORT, () => {
    logger.info(`Server started on port ${PORT}`);
    logger.info(`Servidor rodando na porta ${PORT}`);
    logger.info(`Acesse o sistema em: http://localhost:${PORT}`);
});