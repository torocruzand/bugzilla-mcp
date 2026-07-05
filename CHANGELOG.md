# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-07-04

### Added
- Direct installation and execution support via `npx` (e.g. `npx -y github:torocruzand/mcp_bugzilla`).
- `"prepare"` lifecycle script to compile TypeScript files during Git URL installation.
- `.npmignore` file to optimize packed package size and resolve warnings.

### Changed
- Simplified client class constructor to rely exclusively on `api_key` authentication.
- Removed local password-handshake session token caching code.

## [1.1.0] - 2026-07-04

### Added
- Environment-controlled permission flags (`BUGZILLA_ALLOW_READ`, `BUGZILLA_ALLOW_WRITE`, `BUGZILLA_ALLOW_DELETE`).
- Checkpoint validation wrapper in server tools routing to prevent unallowed operations.

### Fixed
- Rebuilt Git history to remove any machine-specific path references in instructions and README configurations.

## [1.0.0] - 2026-07-04

### Added
- Initial release of the Bugzilla Model Context Protocol (MCP) server.
- Built-in Axios client supporting API Key header injections.
- Stdio transport setup and Zod parameter validation schemas.
- Exposed CRUD, search, comment management, attachment upload, and metadata inspection tools.
