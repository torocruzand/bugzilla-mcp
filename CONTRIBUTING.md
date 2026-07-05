# Contributing to Bugzilla MCP Server

First off, thank you for considering contributing to the Bugzilla MCP Server! It's people like you that make open-source software such a great community to learn, inspire, and create.

The following is a set of guidelines for contributing. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## Code of Conduct

This project and everyone participating in it is governed by the [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to torocruzand@gemail.com.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* Use a clear and descriptive title for the issue to identify the problem.
* Describe the exact steps which reproduce the problem in as many details as possible.
* Provide specific examples to demonstrate the steps.
* Describe the behavior you observed after following the steps and point out what exactly is the problem with that behavior.
* Explain which behavior you expected to see instead and why.

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include as many details as possible:

* Use a clear and descriptive title for the issue to identify the suggestion.
* Provide a step-by-step description of the suggested enhancement in as many details as possible.
* Describe the current behavior and explain which behavior you expected to see instead and why.
* Explain why this enhancement would be useful.

### Pull Requests

* Fill in the required template.
* Do not include issue numbers in the PR title.
* Follow the TypeScript style guide.
* Include tests or validation reports when adding new features or fixing bugs.
* End files with a newline.

## Development Setup

1. **Node.js:** You'll need Node.js (v18 or higher) and npm installed.
2. **Clone the repository:**
   ```bash
   git clone https://github.com/torocruzand/mcp_bugzilla.git
   cd mcp_bugzilla
   ```
3. **Install Dependencies:**
   ```bash
   npm install
   ```
4. **Build and Run:**
   ```bash
   npm run build
   npm start
   ```

## Styleguides

### Git Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line
