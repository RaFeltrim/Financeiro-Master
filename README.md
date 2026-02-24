# Finance Master

Finance Master is a complete financial control system for tracking income (entries), expenses (exits), and bill payments, maintaining an updated historical record and displaying financial risk levels. It accounts for all transactions, including quantitative tracking of entry and exit counts, and is built upon principles learned in Verification, Validation and Testing (VV&T) of Software.

## Features

- 💰 **Expense Tracking**: Comprehensive expense management with validation
- 🔐 **Secure Bank Import**: Import bank statements with 100% local processing (no data transmitted externally)
- ⚙️ **Automated Debits**: Automation for recurring debit payments with scheduled transfers
- 📊 **Financial Reporting**: Detailed reports and analytics with risk level indicators
- 💾 **Backup & Export**: Multiple format support (JSON, CSV) for data backup and export
- 🗄️ **Persistent Storage**: Robust data persistence using **Prisma ORM** tied to a local **SQLite** database
- 🛡️ **Security First**: 100% local data processing with comprehensive security measures
- 🌐 **Web Interface**: Responsive web-based UI with full CRUD operations
- 📱 **Mobile Friendly**: Responsive design for use on all devices

## Architecture

The application follows a modular architecture with clear separation of concerns:

```
src/
├── automacao/                 # Automation modules
├── bank-importer/            # Secure bank statement importer
├── controllers/              # API controllers
├── importers/                # Data import utilities
├── models/                   # Data models
├── services/                 # Business logic services
└── utils/                    # Utility functions
```

## Security Features

- 100% local data processing (no external data transmission)
- Input sanitization and validation
- Path traversal attack prevention
- Rate limiting for API endpoints
- Helmet security headers
- Comprehensive error handling

## Installation

1. Clone the repository:
```bash
git clone https://github.com/RaFeltrim/Financeiro-Master.git
cd Financeiro-Master
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Access the application at `http://localhost:3000`

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Add expenses with validation
3. Import bank statements securely
4. Automate debit management
5. Generate financial reports
6. Export data for backup

## Quality Assurance

- 44 tests with 100% success rate
- Comprehensive validation at all levels
- Continuous integration ready
- Professional code quality standards

## Technologies Used

- Node.js
- Express.js
- Prisma ORM (v4.14)
- SQLite Database
- JavaScript
- HTML/CSS
- Excel processing (xlsx library)

## License

MIT