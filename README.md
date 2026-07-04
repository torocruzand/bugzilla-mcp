# Bugzilla Model Context Protocol (MCP) Server

A production-ready Model Context Protocol (MCP) server for integrating Bugzilla with AI agents and LLMs. It enables agents to search, view, create, and update bugs, manage comments, upload attachments, and query metadata directly from a Bugzilla instance.

## Features

- **Authentication Options:** Supports API Key, standard Username/Password, or anonymous access.
- **Bug Management:** Search, view detailed bug details, create new bugs, and update fields.
- **Comments & Attachments:** Read and add comments, upload attachments as Base64 strings.
- **Metadata Discovery:** Access products, components, fields, and allowed values.

---

## Installation & Setup

### 1. Clone & Build the Project
Clone this repository to your local machine, install dependencies, and build the TypeScript files:
```bash
git clone <repository-url>
cd mcp_bugzilla
npm install
npm run build
```

### 2. Authentication and Environment Variables
Create a `.env` file in the root directory of the project to configure the Bugzilla URL and authentication.

```env
BUGZILLA_URL=https://bugzilla.your-instance.com

# 1. API Key Authentication (Recommended)
BUGZILLA_API_KEY=your_bugzilla_api_key

# 2. Traditional Authentication (Alternative)
# BUGZILLA_LOGIN=your-email@example.com
# BUGZILLA_PASSWORD=your-password
```
*Note: If no authentication keys are provided, the server will fall back to anonymous/public access (suitable for public instances like Bugzilla Mozilla).*

---

## Registering the MCP Server in AI Clients

Once built, you can configure your AI agents or client applications to use this server via the `stdio` transport.

### 1. Antigravity & AI Code Editors
To configure this server for Antigravity, add the following to your custom agent configs (usually located in `.gemini/config/mcp.json` or within your active workspace config):

```json
{
  "mcpServers": {
    "bugzilla": {
      "command": "node",
      "args": [
        "/path/to/mcp_bugzilla/build/index.js"
      ],
      "env": {
        "BUGZILLA_URL": "https://bugzilla.your-instance.com",
        "BUGZILLA_API_KEY": "your_bugzilla_api_key"
      }
    }
  }
}
```

### 2. Claude Desktop Config
To integrate with the Claude Desktop application, add the configuration to your configuration file (typically `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "bugzilla": {
      "command": "node",
      "args": [
        "/path/to/mcp_bugzilla/build/index.js"
      ],
      "env": {
        "BUGZILLA_URL": "https://bugzilla.your-instance.com",
        "BUGZILLA_API_KEY": "your_bugzilla_api_key"
      }
    }
  }
}
```

---

## Exposed Tools

The server registers and exposes the following tools:

### A. Bug Management
- `search_bugs`: Query bugs with filters (summary, status, assigned_to, product, component, severity, priority, creation_time).
- `get_bug`: Fetch detailed information on a specific bug by ID. Can optionally include `include_history` and `include_attachments`.
- `create_bug`: Create a new bug entry. Required properties: `product`, `component`, `summary`, `version`, `description`.
- `update_bug`: Update fields of an existing bug (e.g., status, resolution, priority, assigned_to).

### B. Comments & Attachments
- `get_comments`: Fetch all comments associated with a specific bug ID.
- `add_comment`: Append a new comment to a bug. Supports marking comments private (`is_private`).
- `add_attachment`: Upload a Base64-encoded attachment with name, summary, and content type.

### C. Metadata
- `get_products`: List all products and components. Helpful for determining valid fields when creating bugs.
- `get_fields`: Fetch active fields, allowed statuses, and resolution values for the instance.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
