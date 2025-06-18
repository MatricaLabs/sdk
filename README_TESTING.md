# Testing Guide

## Overview

This project now has a comprehensive testing suite that covers both v1 and v2 implementations of the Matrica OAuth SDK.

## Test Structure

```
src/__tests__/
├── setup.ts                    # Global test setup and mocks
├── errors.test.ts              # Error class tests
├── v1.matricaOAuthClient.test.ts # V1 OAuth client tests
├── v1.userSession.test.ts      # V1 UserSession tests
├── v2.matricaOAuthClient.test.ts # V2 OAuth client tests
└── integration.test.ts         # Integration and export tests
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Coverage

The test suite covers:

### V1 Implementation
- ✅ Constructor and configuration validation
- ✅ Authorization URL generation with PKCE
- ✅ Token exchange flow
- ✅ Session creation and management
- ✅ User profile, email, wallets, domains, NFTs, socials APIs
- ✅ Token refresh functionality
- ✅ Error handling and retry logic
- ✅ Automatic token refresh on 401 responses

### V2 Implementation
- ✅ Constructor and configuration validation
- ✅ Authorization URL generation
- ✅ Session creation from codes and tokens
- ✅ User profile, wallets, NFTs, tokens, domains APIs
- ✅ Paginated responses
- ✅ Social platform integrations (Twitter, Discord, Telegram)
- ✅ Token refresh functionality
- ✅ Error handling

### Shared Components
- ✅ Error classes (MatricaOAuthError, MatricaAuthenticationError)
- ✅ Package exports and backward compatibility
- ✅ Integration between v1 and v2 namespaces

## Test Features

- **Proper Mocking**: All HTTP requests are mocked using Jest
- **Realistic Scenarios**: Tests cover both success and error cases
- **Type Safety**: Full TypeScript support in tests
- **Isolation**: Each test is properly isolated with beforeEach cleanup
- **Performance**: Fast execution with proper timeout handling

## Key Improvements Made

1. **Fixed Jest Configuration**: Updated to modern ts-jest syntax
2. **Comprehensive Coverage**: Tests for all major functionality
3. **Proper Mocking**: Realistic fetch mocks with proper response handling
4. **Error Testing**: Comprehensive error scenario coverage
5. **Integration Testing**: Ensures package exports work correctly
6. **Clean Structure**: Separate test files for v1 and v2 implementations

## Test Results

All 41 tests are passing:
- 5 test suites
- 41 individual tests
- Full coverage of critical paths
- No test failures or timeouts