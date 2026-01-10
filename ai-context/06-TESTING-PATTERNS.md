# Testing Patterns

This file documents testing patterns and best practices discovered during development. It helps future agents avoid repetitive setup and follow established patterns.

> **Note**: This file will be populated by agents during development as patterns emerge. Control Tower seeds it with initial guidance, but it evolves based on actual usage.

## Purpose

Testing patterns help:
- **Avoid repetitive setup** - reuse established patterns
- **Maintain consistency** - same approach across similar tests
- **Speed up development** - less time figuring out how to test
- **Improve quality** - proven patterns catch more issues

## When to Document a Pattern

Document a pattern when:
- You find yourself repeating similar test setup code
- A testing approach works particularly well
- You discover a useful testing technique
- A pattern prevents a common bug

## Pattern Categories

### Mock Factories

**When to use**: When you need to create test data repeatedly

**Pattern**: Create factory functions that generate mock objects with sensible defaults

**Example**:
```javascript
// Instead of creating mocks inline each time:
const mockClient = {
  clientId: '123',
  name: 'Test Client',
  email: 'test@example.com',
  phone: '555-1234',
  notes: 'Test notes',
  createdAt: '2024-01-01'
}

// Create a factory:
function createMockClient(overrides = {}) {
  return {
    clientId: '123',
    name: 'Test Client',
    email: 'test@example.com',
    phone: '555-1234',
    notes: 'Test notes',
    createdAt: '2024-01-01',
    ...overrides
  }
}

// Use it:
const client1 = createMockClient({ clientId: '456' })
const client2 = createMockClient({ name: 'Different Client' })
```

**Benefits**:
- Reduces boilerplate
- Makes tests more readable
- Easy to update defaults
- Allows partial overrides

### Google Sheets API Mocking

**When to use**: When testing code that interacts with Google Sheets API

**Pattern**: Mock Google Sheets API responses in unit tests

**Example**:
```javascript
// Mock Google Sheets API client
jest.mock('../src/api/sheets', () => ({
  getClients: jest.fn(() => Promise.resolve([
    { clientId: '1', name: 'Client 1' },
    { clientId: '2', name: 'Client 2' }
  ])),
  createClient: jest.fn((client) => Promise.resolve({
    ...client,
    clientId: 'new-id',
    createdAt: '2024-01-01'
  }))
}))
```

**Benefits**:
- Fast unit tests (no API calls)
- Predictable test data
- No external dependencies
- Easy to test error cases

### Integration Test Setup

**When to use**: When testing actual Google Sheets API integration

**Pattern**: Use a separate test Google Sheet and clean up after tests

**Example**:
```javascript
// tests/integration/setup.js
beforeAll(async () => {
  // Set up test sheet
  process.env.GOOGLE_SHEETS_SPREADSHEET_ID = TEST_SHEET_ID
})

afterEach(async () => {
  // Clean up test data
  await clearTestData()
})
```

**Benefits**:
- Tests real API behavior
- Catches integration issues
- Validates actual data flow

### Concurrency Testing

**When to use**: When testing code that handles concurrent operations

**Pattern**: Run tests multiple times to catch race conditions

**Example**:
```javascript
// For tests that might have race conditions:
it('handles concurrent requests', async () => {
  // Run the test 3 times to catch intermittent failures
  for (let i = 0; i < 3; i++) {
    const promises = Array(10).fill(null).map(() => makeRequest())
    const results = await Promise.all(promises)
    expect(results).toHaveLength(10)
  }
})
```

**Benefits**:
- Catches race conditions
- Identifies flaky tests
- Validates concurrent behavior

### Performance Baselines

**When to use**: When performance is critical

**Pattern**: Establish performance baselines and test against them

**Example**:
```javascript
it('responds within acceptable time', async () => {
  const start = Date.now()
  await performOperation()
  const duration = Date.now() - start
  expect(duration).toBeLessThan(100) // 100ms baseline
})
```

**Benefits**:
- Prevents performance regressions
- Documents performance expectations
- Catches slow operations early

### Integration Test Patterns

**When to use**: When testing multiple components together

**Pattern**: [Document patterns as they emerge]

### E2E Test Patterns

**When to use**: When testing complete user flows

**Pattern**: [Document patterns as they emerge]

## Common Testing Anti-Patterns

### ❌ Over-mocking

**Problem**: Mocking too much makes tests brittle and less valuable

**Better**: Mock external dependencies, test real logic

### ❌ Testing Implementation Details

**Problem**: Tests break when refactoring, even if behavior is correct

**Better**: Test behavior and outcomes, not internal implementation

### ❌ Ignoring Flaky Tests

**Problem**: Flaky tests indicate real issues (race conditions, timing, etc.)

**Better**: Fix the root cause, don't just retry

### ❌ Missing Edge Cases

**Problem**: Only testing happy paths

**Better**: Test error cases, boundary conditions, and edge cases

## Test Organization

### File Structure

- **Unit tests**: In `tests/unit/` directory
- **Integration tests**: In `tests/integration/` directory
- **E2E tests**: In `tests/e2e/` (if applicable)

### Naming Conventions

- Test files: `*.test.js` or `*.spec.js`
- Test descriptions: Clear, behavior-focused
- Group related tests with `describe` blocks

## Test Data Management

### Test Fixtures

Create reusable test data:

```javascript
// tests/fixtures/clients.js
export const testClients = {
  client1: { clientId: '1', name: 'Client 1', email: 'client1@example.com' },
  client2: { clientId: '2', name: 'Client 2', email: 'client2@example.com' }
}
```

### Test Database

For Google Sheets integration tests:
- Use separate test Google Sheet
- Clean up test data after tests
- Seed with minimal required data

## Coverage Expectations

- **Aim for high coverage** of business logic
- **Don't obsess over 100%** - focus on meaningful tests
- **Cover critical paths** - user flows, error handling
- **Document why** if coverage is intentionally low in some areas

## Continuous Improvement

As you discover new patterns:
1. **Document them here** - add to appropriate section
2. **Update existing patterns** - refine based on experience
3. **Remove obsolete patterns** - if they're no longer relevant
4. **Share learnings** - update retro with testing insights

---

**This file grows with experience. Keep it current and useful.**

