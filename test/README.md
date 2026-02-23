# Test Suite Documentation

This directory contains a comprehensive test suite for the Expense Tracking System, designed to ensure the reliability and correctness of all system components.

## Test Structure

The test suite is organized into several categories:

### 1. Unit Tests (`/unit/`)
- **Purpose**: Test individual components in isolation
- **Components Tested**:
  - Expense Model
  - Expense Service
  - Expense Validator

### 2. Integration Tests (`/integration/`)
- **Purpose**: Test interactions between multiple components
- **Scenarios Covered**:
  - Full workflow: create → retrieve → update → delete
  - Data validation across layers
  - Multiple expense management

### 3. API Tests (`/api/`)
- **Purpose**: Test the REST API endpoints
- **Endpoints Tested**:
  - `GET /api/expenses` - Retrieve all expenses
  - `POST /api/expenses` - Create new expense
  - `DELETE /api/expenses/:id` - Delete expense
  - `GET /api/stats` - Get statistics
  - `POST /api/import-excel` - Excel import

## Running Tests

### All Tests
```bash
npm run test:all
```

### Individual Test Suites
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# API tests only (requires running server)
npm run test:api

# Original tests
npm test
```

### Direct File Execution
```bash
# Run specific test file
node test/unit/expense.model.test.js
```

## Test Coverage

### Expense Model
- ✅ Constructor validation
- ✅ Property validation
- ✅ Update method
- ✅ JSON serialization

### Expense Service
- ✅ CRUD operations
- ✅ Validation integration
- ✅ Filtering methods
- ✅ Calculation methods

### Expense Validator
- ✅ Individual field validation
- ✅ Complete validation
- ✅ Data sanitization

### Integration Scenarios
- ✅ Full workflow validation
- ✅ Cross-component validation
- ✅ Business logic verification

### API Endpoints
- ✅ Request/response validation
- ✅ Error handling
- ✅ Data integrity

## Test Philosophy

Each test follows the AAA pattern:
- **Arrange**: Set up test data and dependencies
- **Act**: Execute the operation being tested
- **Assert**: Verify the expected outcome

Tests are designed to be:
- **Independent**: Each test can run in isolation
- **Deterministic**: Same inputs produce same outputs
- **Fast**: Quick execution for continuous integration
- **Clear**: Descriptive names and error messages

## Continuous Integration

The test suite is designed to be used in CI/CD pipelines:
- Exit codes reflect test results (0 = success, 1 = failure)
- Console output provides detailed information
- All tests are non-destructive to persistent data