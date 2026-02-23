// Frontend JavaScript for Expense Tracking System
class ExpenseTrackerFrontend {
    constructor() {
        this.expenses = [];
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadExpenses();
        this.renderExpenses();
        await this.updateStats();
    }

    bindEvents() {
        // Form submission
        const form = document.getElementById('expense-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Import button
        const importBtn = document.getElementById('import-btn');
        if (importBtn) {
            importBtn.addEventListener('click', () => this.handleImport());
        }
        
        // Bank import button
        const bankImportBtn = document.getElementById('import-bank-btn');
        if (bankImportBtn) {
            bankImportBtn.addEventListener('click', () => this.handleBankImport());
        }

        // Set today's date as default
        const dateInput = document.getElementById('date');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.value = today;
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        const value = parseFloat(document.getElementById('value').value);
        const date = document.getElementById('date').value;
        const category = document.getElementById('category').value;
        const description = document.getElementById('description').value;

        try {
            // Send to backend
            const response = await fetch('/api/expenses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ value, date, category, description })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao adicionar despesa');
            }

            const newExpense = await response.json();
            
            // Refresh the list
            await this.loadExpenses();
            this.renderExpenses();
            await this.updateStats();

            // Reset form
            document.getElementById('expense-form').reset();
            
            // Set date back to today
            const resetToday = new Date().toISOString().split('T')[0];
            document.getElementById('date').value = resetToday;

            // Show success message
            this.showMessage('Despesa adicionada com sucesso!', 'success');
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }

    async handleImport() {
        // In a real implementation, this would handle file upload
        // For now, we'll just call the backend endpoint
        try {
            const response = await fetch('/api/import-excel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({})
            });

            const result = await response.json();
            
            if (result.success) {
                this.showMessage(result.message, 'success');
                // Refresh data after import
                await this.loadExpenses();
                this.renderExpenses();
                await this.updateStats();
            } else {
                this.showMessage(result.message || 'Erro na importação', 'error');
            }
        } catch (error) {
            this.showMessage('Erro ao importar do Excel: ' + error.message, 'error');
        }
    }

    async handleBankImport() {
        const fileInput = document.getElementById('bank-statement-file');
        
        if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
            this.showMessage('Por favor, selecione um arquivo de extrato bancário', 'error');
            return;
        }
        
        const file = fileInput.files[0];
        
        // Validate file type
        const allowedTypes = ['.xlsx', '.xls', '.csv'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!allowedTypes.includes(fileExtension)) {
            this.showMessage(`Tipo de arquivo não suportado: ${fileExtension}. Tipos suportados: ${allowedTypes.join(', ')}`, 'error');
            return;
        }
        
        // Note: In a real implementation, we would upload the file to the server
        // For this simulation, we'll call the API to show the functionality
        try {
            this.showMessage('Iniciando importação de extrato bancário...', 'success');
            
            const response = await fetch('/api/import-bank-statement', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    filePath: file.name // In a real app, this would be the path after upload
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showMessage(
                    `Importação de extrato bancário iniciada com sucesso! ` +
                    `Tipos suportados: ${result.supportedFileTypes.join(', ')} ` +
                    `Tamanho máximo: ${result.maxFileSize}. ` +
                    'Os dados serão processados localmente, mantendo sua privacidade.', 
                    'success'
                );
                
                // Refresh data after import
                await this.loadExpenses();
                this.renderExpenses();
                await this.updateStats();
            } else {
                this.showMessage(result.message || 'Erro na importação do extrato bancário', 'error');
            }
        } catch (error) {
            this.showMessage('Erro ao importar extrato bancário: ' + error.message, 'error');
        }
    }
    
    async loadExpenses() {
        try {
            const response = await fetch('/api/expenses');
            if (!response.ok) {
                throw new Error('Erro ao carregar despesas');
            }
            this.expenses = await response.json();
        } catch (error) {
            console.error('Error loading expenses:', error);
            this.showMessage('Erro ao carregar despesas: ' + error.message, 'error');
        }
    }

    renderExpenses() {
        const tbody = document.getElementById('expenses-tbody');
        if (!tbody) return;

        // Clear existing rows
        tbody.innerHTML = '';

        // Sort expenses by date (newest first)
        const sortedExpenses = [...this.expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

        sortedExpenses.forEach(expense => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${expense.id}</td>
                <td>R$ ${expense.value.toFixed(2)}</td>
                <td>${this.formatDate(expense.date)}</td>
                <td>${expense.category}</td>
                <td>${expense.description || '-'}</td>
                <td>
                    <button class="delete-btn" onclick="deleteExpense(${expense.id})">Excluir</button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    async deleteExpense(id) {
        if (confirm('Tem certeza que deseja excluir esta despesa?')) {
            try {
                const response = await fetch(`/api/expenses/${id}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Erro ao excluir despesa');
                }

                // Refresh the list
                await this.loadExpenses();
                this.renderExpenses();
                await this.updateStats();
                
                this.showMessage('Despesa excluída com sucesso!', 'success');
            } catch (error) {
                this.showMessage(error.message, 'error');
            }
        }
    }

    async updateStats() {
        try {
            const response = await fetch('/api/stats');
            if (!response.ok) {
                throw new Error('Erro ao carregar estatísticas');
            }
            const stats = await response.json();

            document.getElementById('total-expenses').textContent = stats.totalExpenses;
            document.getElementById('total-value').textContent = `R$ ${stats.totalValue.toFixed(2)}`;
        } catch (error) {
            console.error('Error updating stats:', error);
            this.showMessage('Erro ao atualizar estatísticas: ' + error.message, 'error');
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }

    showMessage(message, type) {
        const statusDiv = document.getElementById('import-status');
        if (!statusDiv) return;

        statusDiv.textContent = message;
        statusDiv.className = `status-message ${type}`;

        // Auto-hide success messages after 3 seconds
        if (type === 'success') {
            setTimeout(() => {
                statusDiv.classList.add('hidden');
            }, 3000);
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.expenseTracker = new ExpenseTrackerFrontend();
});

// Make deleteExpense available globally for HTML onclick handlers
window.deleteExpense = function(id) {
    if (window.expenseTracker) {
        window.expenseTracker.deleteExpense(id);
    }
};