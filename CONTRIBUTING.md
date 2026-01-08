# Contributing to SKYBLUE

Thank you for your interest in contributing to SKYBLUE Hybrid Aero Engine Control System! 🚀

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)

---

## Code of Conduct

This project adheres to a Code of Conduct. By participating, you are expected to uphold this code. Please be respectful and constructive in all interactions.

---

## How Can I Contribute?

### 🐛 Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Screenshots** (if applicable)
- **Environment details** (OS, browser, Node version)

### 💡 Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Clear title and description**
- **Use case** - why is this enhancement useful?
- **Proposed solution**
- **Alternative solutions** considered

### 🔧 Code Contributions

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/skyblue-hybrid-engine.git
cd skyblue-hybrid-engine

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests (if available)
npm test
```

---

## Pull Request Process

1. **Update Documentation**
   - Update README.md if needed
   - Add comments to complex code
   - Update HELP_SYSTEM.md for user-facing changes

2. **Test Your Changes**
   - Test locally with `npm run dev`
   - Test production build with `npm run build && npm run preview`
   - Test with Wokwi simulation

3. **Follow Coding Standards**
   - Use existing code style
   - Add PropTypes for React components
   - Keep functions small and focused

4. **Write Clear Commit Messages**
   - Use present tense ("Add feature" not "Added feature")
   - Be descriptive but concise
   - Reference issues when applicable

5. **Submit PR**
   - Fill out the PR template
   - Link related issues
   - Request review from maintainers

---

## Coding Standards

### JavaScript/React

```javascript
// ✅ Good
const calculateThrust = (throttle, maxThrust) => {
  return (throttle / 100) * maxThrust;
};

// ❌ Bad
function calc(t,m){return t/100*m}
```

### CSS

```css
/* ✅ Good */
.control-button {
  background: rgba(0, 242, 255, 0.1);
  border: 1px solid rgba(0, 242, 255, 0.3);
  transition: all 0.2s ease;
}

/* ❌ Bad */
.btn{background:#00f2ff;border:1px solid #00f2ff}
```

### File Organization

```
src/
├── components/       # Reusable components
├── hooks/           # Custom React hooks
├── utils/           # Utility functions
├── App.jsx          # Main application
└── main.jsx         # Entry point
```

---

## Commit Guidelines

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding tests
- **chore**: Maintenance tasks

### Examples

```bash
# Good commits
feat(controls): add emergency kill switch
fix(websocket): resolve connection timeout issue
docs(readme): update installation instructions
style(app): improve button hover effects

# Bad commits
update stuff
fix bug
changes
```

---

## Areas for Contribution

### High Priority

- [ ] Multi-language support (i18n)
- [ ] Unit tests for components
- [ ] E2E tests with Cypress
- [ ] Performance optimizations
- [ ] Accessibility improvements

### Medium Priority

- [ ] Historical data export
- [ ] Flight plan presets
- [ ] Advanced charting options
- [ ] Mobile responsiveness
- [ ] Dark/light theme toggle

### Low Priority

- [ ] Additional chart types
- [ ] Custom color themes
- [ ] Sound effects
- [ ] Keyboard shortcuts
- [ ] Print functionality

---

## Questions?

Feel free to:
- Open an issue for discussion
- Join GitHub Discussions
- Contact the maintainer

---

**Thank you for contributing to SKYBLUE! 🙏**
