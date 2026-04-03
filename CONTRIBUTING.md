# Contributing to Toddler Monster Truck Match

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Git

### Local Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/toddler-truck-game.git
cd toddler-truck-game
```

2. Install dependencies:
```bash
npm install
```

3. Open in browser:
```bash
# Simply open index.html in your browser
# Or use a local server:
npx serve .
```

## Code Style Guide

### Immutability (CRITICAL)
Always create new objects, never mutate existing ones:

```javascript
// ❌ Wrong: mutates existing object
slotData.filled = true;

// ✅ Correct: creates new object
const updatedSlot = { ...slotData, filled: true };
```

```javascript
// ❌ Wrong: mutates array
items.push(newItem);

// ✅ Correct: creates new array
const updatedItems = [...items, newItem];
```

### File Size Limits
- **Functions**: Maximum 50 lines
- **Files**: Target 200-400 lines, maximum 800 lines
- If a file exceeds limits, extract utilities or split by domain

### Error Handling
- Always add try-catch blocks around DOM operations
- Add null checks before accessing elements
- Validate touch events before accessing properties

```javascript
// ✅ Good error handling
function generateLevel(level) {
    try {
        const container = document.getElementById('slots-container');
        if (!container) {
            throw new Error('Container not found');
        }
        // ... rest of function
    } catch (error) {
        console.error('Failed to generate level:', error);
        showErrorMessage('Something went wrong. Please refresh.');
    }
}
```

### No Hardcoded Values
Extract all magic numbers to `src/constants.js`:

```javascript
// ❌ Wrong
const size = isLarge ? 120 : 80;

// ✅ Correct
import { SLOT_SIZE_LARGE, SLOT_SIZE_SMALL } from './constants.js';
const size = isLarge ? SLOT_SIZE_LARGE : SLOT_SIZE_SMALL;
```

## Testing Requirements

### Test Coverage
- **Minimum coverage**: 80% for lines, functions, and branches
- Run coverage check: `npm run test:coverage`

### Test Types Required
1. **Unit Tests**: Individual functions and utilities
2. **Integration Tests**: API interactions, state management
3. **E2E Tests**: Critical user flows

### Running Tests

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e

# Run tests with UI
npm run test:headed

# Generate coverage report
npm run test:coverage
```

### Writing Tests
- Follow existing test structure in `tests/` directory
- Use descriptive test names: `test('should bounce back when wrong item dragged to slot', ...)`
- Test both success and failure cases
- Use test helpers from `tests/helpers/game-page.js`

### Test-Driven Development (TDD)
1. Write test first (RED)
2. Run test - it should FAIL
3. Write minimal implementation (GREEN)
4. Run test - it should PASS
5. Refactor (IMPROVE)
6. Verify coverage >= 80%

## Pull Request Process

### Before Submitting
1. ✅ All tests passing: `npm test`
2. ✅ Coverage >= 80%: `npm run test:coverage`
3. ✅ No console.log statements (except in development mode)
4. ✅ Code follows style guide
5. ✅ New functions have tests
6. ✅ Large functions split (<50 lines)
7. ✅ No hardcoded magic numbers

### PR Checklist
- [ ] Tests added for new functionality
- [ ] Existing tests pass
- [ ] Coverage maintained at 80%+
- [ ] Code follows immutability principles
- [ ] No console.log statements
- [ ] Error handling added where needed
- [ ] ARIA labels added for new interactive elements
- [ ] README updated if needed

### Commit Message Format

```
<type>: <description>

<optional body>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `docs`: Documentation changes
- `test`: Test additions/fixes
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes

**Examples:**
```
feat: add bubble wrap popping mini-game

fix: resolve memory leak in mud wash event listeners

refactor: split script.js into modular structure

test: add missing tests for visual effects functions
```

### PR Title
Use the same format as commit messages:
- `feat: add bubble wrap mini-game`
- `fix: memory leak in sticker shop`

### PR Description Template
```markdown
## Summary
Brief description of changes

## Changes
- Bullet list of specific changes

## Test Plan
- [ ] Manual testing on Chrome/Firefox/Safari
- [ ] All automated tests pass
- [ ] Coverage remains >= 80%
- [ ] Tested on mobile devices

## Screenshots (if applicable)
[Add screenshots for UI changes]
```

## Code Review Standards

All PRs must pass code review before merging:
- No CRITICAL or HIGH severity issues
- Code quality checklist passed
- Tests adequate and passing
- Performance acceptable

## Development Workflow

1. **Plan First**
   - For complex features, create an issue first
   - Discuss approach before implementing

2. **TDD Approach**
   - Write tests before implementation
   - Ensure tests fail, then implement
   - Refactor with test safety net

3. **Code Review**
   - Address all CRITICAL/HIGH issues
   - Fix MEDIUM issues when possible

4. **Commit & Push**
   - Follow commit message format
   - Group related changes

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/yourusername/toddler-truck-game/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/toddler-truck-game/discussions)

## License

By contributing, you agree that your contributions will be licensed under the project's ISC License.
