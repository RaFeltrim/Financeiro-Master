const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

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

// In-memory storage for expenses (in a real app, this would be a database)
let expenses = [
    {
        id: 1,
        value: 150.75,
        date: new Date().toISOString().split('T')[0],
        category: 'Alimentação',
        description: 'Compra de supermercado',
        createdAt: new Date().toISOString()
    },
    {
        id: 2,
        value: 45.30,
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // yesterday
        category: 'Transporte',
        description: 'Gasolina',
        createdAt: new Date().toISOString()
    },
    {
        id: 3,
        value: 120.00,
        date: new Date(Date.now() - 172800000).toISOString().split('T')[0], // 2 days ago
        category: 'Lazer',
        description: 'Cinema',
        createdAt: new Date().toISOString()
    }
];

let nextId = 4;

// Get all expenses
app.get('/api/expenses', (req, res) => {
    res.json(expenses);
});

// Add a new expense
app.post('/api/expenses', (req, res) => {
    const { value, date, category, description } = req.body;

    // Basic validation
    if (value <= 0) {
        return res.status(400).json({ error: 'O valor deve ser maior que zero' });
    }

    const dateObj = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateObj > today) {
        return res.status(400).json({ error: 'A data não pode ser futura' });
    }

    if (!category) {
        return res.status(400).json({ error: 'A categoria é obrigatória' });
    }

    const expense = {
        id: nextId++,
        value: parseFloat(value),
        date: date,
        category: category,
        description: description || '',
        createdAt: new Date().toISOString()
    };

    expenses.push(expense);
    res.json(expense);
});

// Delete an expense
app.delete('/api/expenses/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = expenses.findIndex(expense => expense.id === id);

    if (index === -1) {
        return res.status(404).json({ error: 'Despesa não encontrada' });
    }

    expenses.splice(index, 1);
    res.json({ message: 'Despesa excluída com sucesso' });
});

// Get expense statistics
app.get('/api/stats', (req, res) => {
    const totalExpenses = expenses.length;
    const totalValue = expenses.reduce((sum, expense) => sum + expense.value, 0);

    res.json({
        totalExpenses,
        totalValue
    });
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

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse o sistema em: http://localhost:${PORT}`);
});