/**
 * Jest setup file to configure test environment.
 *
 * This file runs before each test file and sets appropriate timeouts.
 *
 * NOTE: log4js ERROR/WARN messages will appear in test output - this is expected
 * behavior during negative test cases. To suppress them in CI, run tests with:
 *   pnpm test 2>&1 | grep -v "^\s*\[" | grep -v "console.log"
 */

// Set a reasonable default timeout for integration tests
// (unleash server takes time to initialize)
jest.setTimeout(15000);


