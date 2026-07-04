# Bugzilla Model Context Protocol (MCP) Server

A production-ready Model Context Protocol (MCP) server for integrating Bugzilla with AI agents and LLMs. It enables agents to search, view, create, and update bugs, manage comments, upload attachments, and query metadata directly from a Bugzilla instance.

## Features

- **Authentication:** Supports secure API Key access or anonymous read-only access.
- **Bug Management:** Search, view detailed bug details, create new bugs, and update fields.
- **Comments & Attachments:** Read and add comments, upload attachments as Base64 strings.
- **Metadata Discovery:** Access products, components, fields, and allowed values.
- **npx Support:** Can be executed directly from GitHub without manual build/cloning.

---

## Obtaining a Bugzilla API Key

To authenticate with Bugzilla securely, we recommend using an API Key:
1. Log into your Bugzilla web interface.
2. Go to **User Preferences** (usually by clicking on your email/profile in the top-right corner).
3. Select the **API Keys** tab.
4. Click **Create a New API Key**.
5. Save the generated key. You will pass this key to the MCP server.

---

## Installation & Configuration

You can configure and run this MCP server in one of two ways:

### Method A: Quick Setup via `npx` (Recommended)

This method does not require you to clone or build the project locally. Your AI Client will download and run the built server on-demand from GitHub.

#### 1. Configuration for Antigravity & AI Code Editors
Add the following to your custom agent configs (usually located in `.gemini/config/mcp.json` or your workspace settings):

```json
{
  "mcpServers": {
    "bugzilla": {
      "command": "npx",
      "args": [
        "-y",
        "github:torocruzand/mcp_bugzilla"
      ],
      "env": {
        "BUGZILLA_URL": "https://bugzilla.your-instance.com",
        "BUGZILLA_API_KEY": "your_bugzilla_api_key",
        "BUGZILLA_ALLOW_READ": "true",
        "BUGZILLA_ALLOW_WRITE": "false"
      }
    }
  }
}
```

#### 2. Configuration for Claude Desktop
Add this to your `claude_desktop_config.json` configuration file (typically `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "bugzilla": {
      "command": "npx",
      "args": [
        "-y",
        "github:torocruzand/mcp_bugzilla"
      ],
      "env": {
        "BUGZILLA_URL": "https://bugzilla.your-instance.com",
        "BUGZILLA_API_KEY": "your_bugzilla_api_key",
        "BUGZILLA_ALLOW_READ": "true",
        "BUGZILLA_ALLOW_WRITE": "false"
      }
    }
  }
}
```

---

### Method B: Manual Setup (Build from Source)

Use this method if you want to run the server from local code or edit its implementation.

#### 1. Clone & Build the Project
```bash
git clone https://github.com/torocruzand/mcp_bugzilla.git
cd mcp_bugzilla
npm install
npm run build
```

#### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
BUGZILLA_URL=https://bugzilla.your-instance.com
BUGZILLA_API_KEY=your_bugzilla_api_key

# Permissions (Optional Security Controls)
BUGZILLA_ALLOW_READ=true      # Default is true
BUGZILLA_ALLOW_WRITE=false     # Default is false (set to true to enable creating/updating bugs)
BUGZILLA_ALLOW_DELETE=false    # Default is false
```

#### 3. Client Configuration (Local Source)
Point your client configuration to the built file:

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
