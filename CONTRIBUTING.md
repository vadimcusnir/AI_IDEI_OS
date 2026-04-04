# Contributing to AI-IDEI

Thank you for your interest in contributing to AI-IDEI! This guide will help you get started.

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code. Protected. |
| `feature/*` | New features (branch from `main`) |
| `fix/*` | Bug fixes (branch from `main`) |
| `docs/*` | Documentation changes |

**Rules:**
- No direct pushes to `main` — pull requests only
- All CI checks must pass before merge
- Signed commits required (`git config commit.gpgsign true`)
- Linear history enforced (rebase, no merge commits)

## How to Contribute

### Reporting Bugs

1. Check [existing issues](https://github.com/vadimcusnir/AI_IDEI_OS/issues) first
2. Use the **Bug Report** template
3. Include reproduction steps, expected vs actual behavior, and environment details

### Reporting Security Vulnerabilities

- **Critical:** Email [vadim.kusnir@gmail.com](mailto:vadim.kusnir@gmail.com) privately
- **Non-critical:** Use the **Security Report** issue template

### Suggesting Features

1. Use the **Feature Request** template
2. Explain the use case and expected behavior
3. Indicate if you're willing to implement it

### Submitting Code

1. Fork the repository
2. Create a feature branch from `main` (`git checkout -b feature/amazing-feature`)
3. Write clean, typed TypeScript code
4. Follow existing patterns and conventions
5. Add tests where applicable
6. Commit with conventional commits (signed)
7. Push to your fork and open a Pull Request using the PR template

## Development Setup

```bash
git clone https://github.com/vadimcusnir/AI_IDEI_OS.git
cd AI_IDEI_OS
npm install
npm run dev
```

### Available Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run test` | Run unit tests |
| `npm run lint` | ESLint check |

## Development Guidelines

### Code Style

- **TypeScript** for all source files
- **Functional components** with hooks
- **camelCase** for variables, **PascalCase** for components
- **kebab-case** for route paths
- 2-space indentation
- Use semantic design tokens from `index.css` — never hardcode colors

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add knowledge graph visualization
fix: resolve IdeaRank convergence issue
docs: update extraction pipeline documentation
chore: upgrade dependencies
refactor: extract shared StatCard component
perf: add database indexes for entity queries
security: fix edge function JWT validation
```

### Pull Request Checklist

- [ ] Code compiles without errors (`npm run build`)
- [ ] Tests pass (`npm run test`)
- [ ] Lint passes (`npm run lint`)
- [ ] No hardcoded strings (use i18n keys)
- [ ] RLS policies reviewed for new tables
- [ ] No secrets or API keys in code
- [ ] PR description explains the change
- [ ] Commits are signed

## Architecture Decisions

Major architectural changes should be discussed in an issue before implementation. See `docs/architecture.md` for the current system design.

## Release Process

Releases follow [Semantic Versioning](https://semver.org/):

- **MAJOR** — breaking changes to public APIs or data schema
- **MINOR** — new features, backward compatible
- **PATCH** — bug fixes, security patches

To create a release:
```bash
git tag -s v1.1.0 -m "Release v1.1.0"
git push origin v1.1.0
```

The [Release workflow](.github/workflows/release.yml) automatically creates a GitHub Release with generated notes.
