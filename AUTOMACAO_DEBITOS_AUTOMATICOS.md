# Sistema de Automação de Débitos Automáticos

## Visão Geral

Este módulo faz parte do Finance Master e automatiza o processo de gerenciamento de débitos automáticos utilizando uma conta bancária dedicada e transferências PIX programadas.

## Configuração Inicial

### 1. Conta Dedicada para Débitos Automáticos

O sistema assume que você utiliza uma conta bancária específica para receber PIX e processar débitos automáticos.

```javascript
// Configuração da conta de débitos
const contaDebitosConfig = {
  banco: "Nome do Banco",
  agencia: "Número da Agência",
  conta: "Número da Conta",
  pix: "Chave PIX (CPF, telefone ou email)",
  saldoMinimo: 500.00, // Saldo mínimo recomendado
  saldoIdeal: 1000.00,  // Saldo ideal para cobrir débitos
  saldoMaximo: 5000.00  // Limite máximo para evitar excesso
};
```

### 2. Cadastro de Débitos Automáticos

Registre todos os débitos automáticos que você tem programados:

```javascript
const debitosAutomaticos = [
  {
    id: "luz_companhia",
    descricao: "Conta de luz - Companhia Energética",
    valor: 180.50,
    vencimentoDia: 10, // Dia do mês
    frequencia: "mensal",
    ultimaData: "2026-02-10",
    proximaData: "2026-03-10",
    categoria: "Moradia",
    ativo: true
  },
  {
    id: "internet_empresa",
    descricao: "Internet - Provedor ABC",
    valor: 129.90,
    vencimentoDia: 5,
    frequencia: "mensal",
    ultimaData: "2026-02-05",
    proximaData: "2026-03-05",
    categoria: "Comunicação",
    ativo: true
  },
  {
    id: "plano_saude",
    descricao: "Plano de saúde mensal",
    valor: 450.00,
    vencimentoDia: 15,
    frequencia: "mensal",
    ultimaData: "2026-02-15",
    proximaData: "2026-03-15",
    categoria: "Saúde",
    ativo: true
  }
];
```

## Funcionalidades de Automação

### 1. Monitoramento de Vencimentos

O sistema monitora automaticamente os próximos vencimentos e calcula o total necessário na conta de débitos:

```javascript
class MonitoramentoVencimentos {
  constructor(debitos, contaConfig) {
    this.debitos = debitos;
    this.contaConfig = contaConfig;
  }

  // Calcular total a vencer nos próximos 15 dias
  calcularVencimentosProximos(dias = 15) {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() + dias);

    const vencimentos = this.debitos.filter(debito => {
      const proximaData = new Date(debito.proximaData);
      return (
        debito.ativo &&
        proximaData <= dataLimite &&
        proximaData >= new Date()
      );
    });

    const total = vencimentos.reduce((acc, debito) => acc + debito.valor, 0);

    return {
      vencimentos,
      total,
      dataLimite,
      diasConsiderados: dias
    };
  }

  // Obter data ideal para transferência (3 dias antes do primeiro vencimento)
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
        descricao: vencimentosOrdenados[0].descricao
      };
    }

    return null;
  }
}
```

### 2. Planejamento de Transferências PIX

O sistema ajuda a planejar as transferências PIX para a conta de débitos:

```javascript
class PlanejadorPIX {
  constructor(monitoramento) {
    this.monitoramento = monitoramento;
  }

  // Sugerir transferência para próxima data de vencimento
  sugerirTransferenciaPIX() {
    const vencimentos = this.monitoramento.calcularVencimentosProximos(15);
    const infoTransferencia = this.monitoramento.getDataTransferenciaIdeal();

    if (!infoTransferencia) {
      return {
        precisaTransferencia: false,
        mensagem: "Nenhum vencimento nos próximos dias"
      };
    }

    // Verificar se saldo é suficiente
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

  // Calcular transferência ideal com base no saldo atual
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
}
```

### 3. Interface de Automação

Interface simplificada para gerenciar o processo de forma automática:

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Automação de Débitos - Finance Master</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    
    .dashboard {
      background: white;
      border-radius: 10px;
      padding: 25px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }
    
    .card {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 15px;
      margin: 10px 0;
      border-left: 4px solid #007bff;
    }
    
    .btn {
      background: #007bff;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      margin: 5px;
    }
    
    .btn:hover {
      background: #0056b3;
    }
    
    .btn-success {
      background: #28a745;
    }
    
    .btn-warning {
      background: #ffc107;
      color: #212529;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    
    th, td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }
    
    th {
      background-color: #f2f2f2;
    }
  </style>
</head>
<body>
  <h1>Automação de Débitos Automáticos</h1>
  
  <div class="dashboard">
    <h2>Visão Geral</h2>
    <div class="card">
      <h3>Próximos Vencimentos</h3>
      <div id="vencimentos-info"></div>
    </div>
    
    <div class="card">
      <h3>Sugestão de Transferência PIX</h3>
      <div id="pix-suggestion"></div>
    </div>
    
    <div class="card">
      <h3>Controle de Débitos Automáticos</h3>
      <button class="btn" onclick="adicionarDebito()">Adicionar Débito</button>
      <button class="btn btn-success" onclick="atualizarVencimentos()">Atualizar</button>
    </div>
  </div>
  
  <div class="dashboard">
    <h2>Débitos Cadastrados</h2>
    <table id="debitos-table">
      <thead>
        <tr>
          <th>Descrição</th>
          <th>Valor</th>
          <th>Vencimento</th>
          <th>Categoria</th>
          <th>Status</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody id="debitos-body">
      </tbody>
    </table>
  </div>

  <script>
    // Dados de exemplo - substitua pelos dados reais
    let debitos = [
      {
        id: "luz_companhia",
        descricao: "Conta de luz - Companhia Energética",
        valor: 180.50,
        vencimentoDia: 10,
        frequencia: "mensal",
        ultimaData: "2026-02-10",
        proximaData: "2026-03-10",
        categoria: "Moradia",
        ativo: true
      },
      {
        id: "internet_empresa",
        descricao: "Internet - Provedor ABC",
        valor: 129.90,
        vencimentoDia: 5,
        frequencia: "mensal",
        ultimaData: "2026-02-05",
        proximaData: "2026-03-05",
        categoria: "Comunicação",
        ativo: true
      }
    ];

    function atualizarVencimentos() {
      // Simulação de cálculos - substitua pela lógica real
      const proximos = calcularVencimentosProximos();
      document.getElementById('vencimentos-info').innerHTML = `
        <p><strong>Total a vencer nos próximos 15 dias:</strong> R$ ${proximos.total.toFixed(2)}</p>
        <p><strong>Número de débitos:</strong> ${proximos.vencimentos.length}</p>
        <p><strong>Próximo vencimento:</strong> ${proximos.vencimentos[0]?.descricao || 'Nenhum'}</p>
      `;

      const sugestao = sugerirTransferenciaPIX();
      document.getElementById('pix-suggestion').innerHTML = `
        <p><strong>Data ideal para transferência:</strong> ${sugestao.dataTransferenciaIdeal?.toLocaleDateString() || 'Nenhuma'}</p>
        <p><strong>Valor sugerido:</strong> R$ ${sugestao.valorSugerido?.toFixed(2) || '0,00'}</p>
        <p><strong>Transferência necessária:</strong> ${sugestao.valorATransferir > 0 ? 'Sim' : 'Não'}</p>
        <p><strong>Valor a transferir:</strong> R$ ${sugestao.valorATransferir?.toFixed(2) || '0,00'}</p>
      `;

      atualizarTabelaDebitos();
    }

    function calcularVencimentosProximos(dias = 15) {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() + dias);

      const vencimentos = debitos.filter(debito => {
        const proximaData = new Date(debito.proximaData);
        return (
          debito.ativo &&
          proximaData <= dataLimite &&
          proximaData >= new Date()
        );
      });

      const total = vencimentos.reduce((acc, debito) => acc + debito.valor, 0);

      return {
        vencimentos,
        total,
        dataLimite,
        diasConsiderados: dias
      };
    }

    function sugerirTransferenciaPIX() {
      const vencimentosOrdenados = [...debitos]
        .filter(d => d.ativo)
        .sort((a, b) => new Date(a.proximaData) - new Date(b.proximaData));

      if (vencimentosOrdenados.length === 0) {
        return {
          precisaTransferencia: false,
          mensagem: "Nenhum vencimento nos próximos dias"
        };
      }

      const primeiroVencimento = new Date(vencimentosOrdenados[0].proximaData);
      const dataTransferencia = new Date(primeiroVencimento);
      dataTransferencia.setDate(dataTransferencia.getDate() - 3);

      const vencimentos = calcularVencimentosProximos(15);
      const saldoNecessario = vencimentos.total + 200;
      const saldoAtual = 1500; // Simulado - substitua pelo saldo real
      const diferenca = saldoNecessario - saldoAtual;

      return {
        precisaTransferencia: true,
        dataTransferenciaIdeal: dataTransferencia,
        dataVencimento: primeiroVencimento,
        descricaoPrimeiro: vencimentosOrdenados[0].descricao,
        valorTotal: vencimentos.total,
        valorSugerido: saldoNecessario,
        valorATransferir: diferenca > 0 ? diferenca : 0,
        saldoAtual: saldoAtual,
        vencimentos: vencimentos.vencimentos
      };
    }

    function atualizarTabelaDebitos() {
      const tbody = document.getElementById('debitos-body');
      tbody.innerHTML = '';

      debitos.forEach(debito => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${debito.descricao}</td>
          <td>R$ ${debito.valor.toFixed(2)}</td>
          <td>${new Date(debito.proximaData).toLocaleDateString()}</td>
          <td>${debito.categoria}</td>
          <td>${debito.ativo ? 'Ativo' : 'Inativo'}</td>
          <td>
            <button class="btn btn-warning" onclick="editarDebito('${debito.id}')">Editar</button>
            <button class="btn" onclick="excluirDebito('${debito.id}')">Excluir</button>
          </td>
        `;
        tbody.appendChild(row);
      });
    }

    function adicionarDebito() {
      const descricao = prompt("Descrição do débito:");
      if (!descricao) return;
      
      const valor = parseFloat(prompt("Valor do débito:"));
      if (isNaN(valor)) return;
      
      const vencimentoDia = parseInt(prompt("Dia do vencimento (1-31):"));
      if (isNaN(vencimentoDia) || vencimentoDia < 1 || vencimentoDia > 31) return;

      const novoDebito = {
        id: `debito_${Date.now()}`,
        descricao,
        valor,
        vencimentoDia,
        frequencia: "mensal",
        ultimaData: new Date().toISOString().split('T')[0],
        proximaData: calcularProximaData(vencimentoDia),
        categoria: "Outros",
        ativo: true
      };

      debitos.push(novoDebito);
      atualizarVencimentos();
    }

    function calcularProximaData(dia) {
      const hoje = new Date();
      let mes = hoje.getMonth();
      let ano = hoje.getFullYear();
      
      // Se o dia já passou neste mês, vai para o próximo mês
      if (dia < hoje.getDate()) {
        mes++;
        if (mes > 11) {
          mes = 0;
          ano++;
        }
      }
      
      const proximaData = new Date(ano, mes, dia);
      return proximaData.toISOString().split('T')[0];
    }

    function editarDebito(id) {
      const debito = debitos.find(d => d.id === id);
      if (!debito) return;
      
      const novaDescricao = prompt("Nova descrição:", debito.descricao);
      if (novaDescricao !== null) debito.descricao = novaDescricao;
      
      const novoValor = prompt("Novo valor:", debito.valor);
      if (novoValor !== null) debito.valor = parseFloat(novoValor) || debito.valor;
      
      atualizarVencimentos();
    }

    function excluirDebito(id) {
      if (confirm("Tem certeza que deseja excluir este débito?")) {
        debitos = debitos.filter(d => d.id !== id);
        atualizarVencimentos();
      }
    }

    // Inicializar a página
    atualizarVencimentos();
  </script>
</body>
</html>
```

### 4. Integração com o Sistema Finance Master

Adicionando a funcionalidade de automação ao sistema principal:

```javascript
// Novo módulo de automação
class AutomacaoDebitos {
  constructor(expenseService) {
    this.expenseService = expenseService;
    this.debitos = [];
    this.contaConfig = {};
  }

  // Carregar configurações de débitos
  async carregarConfiguracao() {
    // Carrega do banco de dados ou arquivo de configuração
    this.debitos = await this.carregarDebitos();
    this.contaConfig = await this.carregarContaConfig();
  }

  // Verificar necessidade de transferência automaticamente
  async verificarNecessidadePIX() {
    const planejador = new PlanejadorPIX(new MonitoramentoVencimentos(this.debitos, this.contaConfig));
    const sugestao = planejador.sugerirTransferenciaPIX();
    
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
      criadoEm: new Date()
    };
    
    // Salvar alerta no sistema
    await this.salvarAlerta(alerta);
  }

  // Registrar débito automático realizado
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
    await this.salvarDebitos();
    
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
}
```

## Benefícios da Automação

### 1. Economia de Tempo
- Monitoramento automático de vencimentos
- Sugestões de transferências PIX otimizadas
- Interface única para gerenciar todos os débitos

### 2. Controle Financeiro Aprimorado
- Visibilidade completa dos próximos compromissos
- Planejamento antecipado de fluxo de caixa
- Evita atrasos e multas por esquecimento

### 3. Segurança e Confiabilidade
- Integração segura com o sistema Finance Master
- Validations rigorosas de dados
- Histórico completo de todas as operações

## Implementação Prática

Para começar a usar esta automação:

1. **Configure sua conta de débitos** no sistema
2. **Cadastre todos os seus débitos automáticos** com datas e valores
3. **Defina os dias ideais de transferência** (geralmente 3 dias antes do vencimento)
4. **Monitore as sugestões de transferência** automaticamente geradas
5. **Execute as transferências PIX** conforme as recomendações do sistema

Esta automação reduzirá significativamente o tempo gasto com o gerenciamento de contas e garantirá que você nunca mais se esqueça de transferir fundos para seus débitos automáticos.