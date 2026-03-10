# Contributing to AI-IDEI

Thank you for your interest in contributing to AI-IDEI! This guide will help you get started.

## Code of Conduct

Be respectful, constructive, and inclusive in all interactions.

## How to Contribute

### Reporting Bugs

1. Check [existing issues](https://github.com/vadimcusnir/AI_IDEI_OS/issues) first
2. Use the **Bug Report** template
3. Include reproduction steps, expected vs actual behavior, and environment details

### Suggesting Features

1. Use the **Feature Request** template
2. Explain the use case and expected behavior
3. Indicate if you're willing to implement it

### Submitting Code

1. Fork the repository
2. Create a feature branch from `main`
3. Write clean, typed TypeScript code
4. Follow existing patterns and conventions
5. Add tests where applicable
6. Submit a Pull Request using the PR template

## Development Guidelines

### Code Style

- **TypeScript** for all source files
- **Functional components** with hooks
- **camelCase** for variables, **PascalCase** for components
- **kebab-case** for route paths
- 2-space indentation
- Use semantic design tokens from `index.css` — never hardcode colors

### Commit Messages

Follow conventional commits:

```
feat: add knowledge graph visualization
fix: resolve IdeaRank convergence issue
docs: update extraction pipeline documentation
chore: upgrade dependencies
```

### Pull Request Checklist

- [ ] Code compiles without errors (`npm run build`)
- [ ] Tests pass (`npm run test`)
- [ ] No hardcoded strings (use i18n keys)
- [ ] RLS policies reviewed for new tables
- [ ] PR description explains the change

## Architecture Decisions

Major architectural changes should be discussed in an issue before implementation. See `docs/architecture.md` for the current system design.
