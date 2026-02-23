# Finance Master - Sistema Completo de Gestão Financeira

> Sistema desenvolvido com foco em VV&T (Verificação, Validação e Teste de Software)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node.js-%3E%3D14.0.0-green.svg)](https://nodejs.org/)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/RaFeltrim/Financeiro-Master)

## 🏦 Sistema Completo de Controle Financeiro

Sistema desenvolvido para controle de entradas, saídas e pagamentos de contas com histórico atualizado e níveis de risco.

O **Finance Master** é uma solução completa para gestão financeira pessoal e empresarial, oferecendo controle detalhado de entradas, saídas e pagamentos de contas com histórico atualizado e análise de níveis de risco financeiro.

## ✨ Funcionalidades Principais

### 💰 Controle Financeiro Completo
- **Entradas**: Registro detalhado de todas as receitas e entradas de dinheiro
- **Saídas**: Controle preciso de despesas e pagamentos realizados
- **Pagamentos de Contas**: Gerenciamento de contas a pagar e vencer
- **Histórico Atualizado**: Manutenção contínua de registros financeiros organizados
- **Níveis de Risco**: Avaliação e monitoramento da saúde financeira

### 📊 Análise e Relatórios
- **Quantidade de Transações**: Monitoramento de volume de entradas e saídas
- **Análise de Fluxo de Caixa**: Visão clara do movimento financeiro
- **Categorização Inteligente**: Classificação automática de despesas e receitas
- **Indicadores Financeiros**: Métricas importantes para tomada de decisão

### 🔐 Segurança e Privacidade
- **Processamento Local**: Todos os dados são processados exclusivamente em sua máquina
- **Nenhuma Transmissão Externa**: Seus dados financeiros permanecem totalmente privados
- **Importação Segura**: Suporte para extratos bancários em Excel e CSV
- **Criptografia Local**: Armazenamento seguro das informações financeiras

### 📈 Integração com VV&T (Verificação, Validação e Teste de Software)

Este projeto foi desenvolvido aplicando os princípios aprendidos na disciplina de **Verificação, Validação e Teste de Software**, com foco em:

- **Testes Unitários**: Cobertura completa de cada componente do sistema
- **Testes de Integração**: Verificação do funcionamento conjunto dos módulos
- **Testes de API**: Validação dos endpoints e fluxos de dados
- **Testes de Ponta a Ponta**: Simulação completa de uso do sistema
- **Análise de Requisitos**: Validação rigorosa das regras de negócio
- **Verificação de Código**: Revisão sistemática para garantir qualidade

## 🛠️ Tecnologias Utilizadas

- **Backend**: Node.js + Express.js
- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Persistência**: Armazenamento em memória (extensível para banco de dados)
- **Planilhas**: xlsx para processamento de arquivos Excel
- **Testes**: Framework próprio de testes unitários e integrados
- **Segurança**: Criptografia local e validação rigorosa de dados

## 📁 Estrutura do Projeto

```
src/
├── models/
│   └── Expense.js (Modelo de Despesa)
├── services/
│   └── expenseService.js (Serviço de Gerenciamento)
├── utils/
│   └── expenseValidator.js (Validações)
├── controllers/
│   └── excelController.js (Controle de Excel)
├── importers/
│   └── excelImporter.js (Importação de Excel)
└── bank-importer/
    ├── secureBankImporter.js (Importação Bancária Segura)
    └── bankImportController.js (Controle de Importação Bancária)
frontend/
├── index.html (Interface Principal)
├── script.js (Lógica do Cliente)
└── styles.css (Estilos)
test/
├── expense.test.js (Testes Originais)
├── unit/ (Testes Unitários)
├── integration/ (Testes de Integração)
├── api/ (Testes de API)
└── README.md (Documentação dos Testes)
```

## 🚀 Execução

### Pré-requisitos
- Node.js >= 14.0.0
- npm (gerenciador de pacotes do Node.js)

### Instalação

1. Clone ou baixe o repositório
2. Navegue até o diretório do projeto
3. Instale as dependências:

```bash
npm install
```

4. Inicie o servidor:

```bash
npm start
```
ou
```bash
node server.js
```

5. Acesse a aplicação web em `http://localhost:3000`

## 🧪 Testes

O sistema inclui uma suíte abrangente de testes baseada nos princípios de VV&T:

- **Testes Unitários**: Validação individual de cada componente
- **Testes de Integração**: Verificação do funcionamento conjunto
- **Testes de API**: Confirmação do funcionamento dos endpoints
- **Testes de Aceitação**: Validação dos fluxos principais de uso

Execute os testes com:

```bash
# Todos os testes
npm test

# Testes unitários
npm run test:unit

# Testes de integração
npm run test:integration

# Todos os testes (unitários + integração + API)
npm run test:all
```

## 🔐 Importação de Extratos Bancários

### Como Utilizar

1. Exporte seu extrato bancário como arquivo Excel (.xlsx/.xls) ou CSV
2. Acesse o sistema web e vá até a seção "Importar Extrato Bancário"
3. Selecione o arquivo exportado
4. O sistema processará localmente e categorizará suas transações automaticamente
5. Todas as despesas serão adicionadas ao seu histórico com as categorias identificadas

### Recursos de Segurança

- **Processamento Local**: Seus dados bancários nunca saem do seu computador
- **Validação Rigorosa**: Todos os dados passam por verificações de integridade
- **Categorização Automática**: Classificação inteligente de transações
- **Histórico Completo**: Armazenamento de transações de meses atuais e anteriores

## 📊 Análise de Níveis de Risco

O sistema implementa indicadores de risco financeiro baseados em:

- **Relação Entrada/Saída**: Comparação entre receitas e despesas
- **Fluxo de Caixa Mensal**: Análise de tendências de movimentação
- **Concentração de Despesas**: Identificação de categorias com alto volume
- **Pagamentos Pendentes**: Monitoramento de obrigações financeiras

## 🤝 Contribuição

Contribuições são bem-vindas! Para sugerir melhorias:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona NovaFeature'`)
4. Push para a branch (`git push origin feature/NovaFeature`)
5. Abra um Pull Request

## 📄 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.

## 👨‍💻 Autor

Rafael Feltrim - [GitHub](https://github.com/RaFeltrim)

## 📞 Contato

Projeto desenvolvido para fins acadêmicos e demonstração de conceitos de VV&T (Verificação, Validação e Teste de Software).

---

> 💡 **Dica Profissional**: Este projeto exemplifica boas práticas de desenvolvimento de software com ênfase em qualidade, testes e verificação de requisitos.
