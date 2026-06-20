# Contributing to EcoTracker

Thank you for your interest in contributing to the Carbon Footprint Awareness Platform! We welcome contributions to help improve sustainability education, carbon calculators, and tracking tools.

## Code of Conduct

We expect all contributors to adhere to a welcoming, respectful, and collaborative environment.

## How to Contribute

### 1. Reporting Bugs
- Search existing issues to see if the bug has already been reported.
- If not, open a new issue describing:
  - The expected behavior vs. actual behavior.
  - Clear steps to reproduce the issue.
  - Environment details (Node.js version, browser, OS).

### 2. Suggesting Enhancements
- Open an issue outlining the proposed feature, why it is useful, and potential implementation details.

### 3. Submitting Code Changes
- Fork the repository and create a new branch from `master` (e.g., `feature/awesome-new-tool`).
- Ensure all dependencies are installed via `npm install`.
- Write clean, commented code adhering to our codebase conventions.
- Add unit or integration tests for new logic.
- Ensure the linter passes with zero errors:
  ```bash
  npm run lint
  ```
- Ensure all tests pass successfully:
  ```bash
  npm test
  ```
- Open a Pull Request (PR) with a clear description of your changes.

## Code Style & Standards

- **Formatting**: We use ESLint for code consistency. Make sure to run `npm run lint` before committing.
- **JSDoc**: Document all exported functions and classes using JSDoc comments (`@param`, `@returns`, `@throws`).
- **Error Handling**: Use custom error classes from `server/utils/AppError.js` rather than raw strings or generic error objects.
- **HTTP Status Codes**: Use status code constants defined in `server/utils/httpStatus.js` (e.g. `HttpStatus.CREATED` instead of `211` or `201`).
- **Security**: Never bypass security middlewares (CORS, CSRF, XSS sanitization) in production.
- **Commit Messages**: Write clear, descriptive commit messages starting with semantic prefixes (e.g., `feat:`, `fix:`, `docs:`, `test:`).
