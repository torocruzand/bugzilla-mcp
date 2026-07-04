import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import dotenv from 'dotenv';
import { BugzillaClient } from './bugzilla-client.js';

// Load environment variables
dotenv.config();

const BUGZILLA_URL = process.env.BUGZILLA_URL || '';
const BUGZILLA_API_KEY = process.env.BUGZILLA_API_KEY;
const BUGZILLA_LOGIN = process.env.BUGZILLA_LOGIN;
const BUGZILLA_PASSWORD = process.env.BUGZILLA_PASSWORD;

// Permission security system
const ALLOW_READ = process.env.BUGZILLA_ALLOW_READ !== 'false';
const ALLOW_WRITE = process.env.BUGZILLA_ALLOW_WRITE === 'true';
const ALLOW_DELETE = process.env.BUGZILLA_ALLOW_DELETE === 'true';

function checkPermission(type: 'read' | 'write' | 'delete'): void {
  if (type === 'read' && !ALLOW_READ) {
    throw new Error('Permission Denied: Read operations are disabled on this MCP server.');
  }
  if (type === 'write' && !ALLOW_WRITE) {
    throw new Error('Permission Denied: Write operations are disabled on this MCP server.');
  }
  if (type === 'delete' && !ALLOW_DELETE) {
    throw new Error('Permission Denied: Delete operations are disabled on this MCP server.');
  }
}

if (!BUGZILLA_URL) {
  console.error('Warning: BUGZILLA_URL environment variable is not defined.');
}

const client = new BugzillaClient({
  baseUrl: BUGZILLA_URL,
  apiKey: BUGZILLA_API_KEY,
  login: BUGZILLA_LOGIN,
  password: BUGZILLA_PASSWORD,
});

const server = new Server(
  {
    name: 'bugzilla-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Definition of tool schemas using Zod for validation
const SearchBugsSchema = z.object({
  summary: z.string().optional().describe('Substring search for bug summary/title'),
  status: z.string().optional().describe('Bug status (e.g., CONFIRMED, IN_PROGRESS, RESOLVED)'),
  assigned_to: z.string().optional().describe('Email address of the assignee'),
  product: z.string().optional().describe('Product name'),
  component: z.string().optional().describe('Component name'),
  severity: z.string().optional().describe('Severity (e.g., blocker, critical, major, normal, minor, trivial)'),
  priority: z.string().optional().describe('Priority (e.g., Highest, High, Normal, Low, Lowest)'),
  creation_time: z.string().optional().describe('Limit to bugs created after this timestamp (e.g., 2026-01-01T00:00:00Z)'),
});

const GetBugSchema = z.object({
  id: z.number().describe('The numeric ID of the bug'),
  include_history: z.boolean().optional().default(false).describe('Whether to fetch bug history'),
  include_attachments: z.boolean().optional().default(false).describe('Whether to fetch attachments list'),
});

const CreateBugSchema = z.object({
  product: z.string().describe('Product name'),
  component: z.string().describe('Component name'),
  summary: z.string().describe('One-sentence summary of the bug'),
  version: z.string().describe('Product version (e.g., unspecified, 1.0, trunk)'),
  description: z.string().describe('Detailed description of the bug'),
  op_sys: z.string().optional().describe('Operating System (e.g., All, Windows, Mac, Linux)'),
  platform: z.string().optional().describe('Hardware platform (e.g., All, PC, Macintosh)'),
  priority: z.string().optional().describe('Priority'),
  severity: z.string().optional().describe('Severity'),
  assigned_to: z.string().optional().describe('Email of assignee (leave empty to assign to component owner)'),
});

const UpdateBugSchema = z.object({
  id: z.number().describe('The numeric ID of the bug to modify'),
  status: z.string().optional().describe('New bug status (e.g., RESOLVED, CONFIRMED)'),
  resolution: z.string().optional().describe('Resolution (if status is RESOLVED, e.g., FIXED, DUPLICATE, WONTFIX)'),
  assigned_to: z.string().optional().describe('New assignee email'),
  priority: z.string().optional().describe('New priority'),
  severity: z.string().optional().describe('New severity'),
  summary: z.string().optional().describe('New bug summary/title'),
});

const GetCommentsSchema = z.object({
  id: z.number().describe('The numeric ID of the bug'),
});

const AddCommentSchema = z.object({
  id: z.number().describe('The numeric ID of the bug'),
  comment: z.string().describe('The text comment to add'),
  is_private: z.boolean().optional().default(false).describe('Whether the comment should be private'),
});

const AddAttachmentSchema = z.object({
  id: z.number().describe('The numeric ID of the bug'),
  data: z.string().describe('Base64 encoded string of the file contents'),
  file_name: z.string().describe('The file name of the attachment'),
  summary: z.string().describe('A brief description/summary of the attachment'),
  content_type: z.string().describe('The MIME type of the file (e.g., text/plain, image/png)'),
});

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search_bugs',
        description: 'Advanced search for bugs using multiple filtering criteria. Returns a list of matching bugs.',
        inputSchema: {
          type: 'object',
          properties: {
            summary: { type: 'string', description: 'Substring search for bug summary/title' },
            status: { type: 'string', description: 'Bug status (e.g., CONFIRMED, IN_PROGRESS, RESOLVED)' },
            assigned_to: { type: 'string', description: 'Email address of the assignee' },
            product: { type: 'string', description: 'Product name' },
            component: { type: 'string', description: 'Component name' },
            severity: { type: 'string', description: 'Severity (e.g., blocker, critical, major, normal, minor, trivial)' },
            priority: { type: 'string', description: 'Priority (e.g., Highest, High, Normal, Low, Lowest)' },
            creation_time: { type: 'string', description: 'Limit to bugs created after this timestamp (e.g., 2026-01-01T00:00:00Z)' },
          },
        },
      },
      {
        name: 'get_bug',
        description: 'Retrieve detailed information of a specific bug by ID, optionally including history and attachments.',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'The numeric ID of the bug' },
            include_history: { type: 'boolean', description: 'Whether to fetch bug history' },
            include_attachments: { type: 'boolean', description: 'Whether to fetch attachments list' },
          },
          required: ['id'],
        },
      },
      {
        name: 'create_bug',
        description: 'Create a new bug in Bugzilla. Requires product, component, summary, version, and description.',
        inputSchema: {
          type: 'object',
          properties: {
            product: { type: 'string', description: 'Product name' },
            component: { type: 'string', description: 'Component name' },
            summary: { type: 'string', description: 'One-sentence summary of the bug' },
            version: { type: 'string', description: 'Product version (e.g., unspecified, 1.0, trunk)' },
            description: { type: 'string', description: 'Detailed description of the bug' },
            op_sys: { type: 'string', description: 'Operating System' },
            platform: { type: 'string', description: 'Hardware platform' },
            priority: { type: 'string', description: 'Priority' },
            severity: { type: 'string', description: 'Severity' },
            assigned_to: { type: 'string', description: 'Email of assignee' },
          },
          required: ['product', 'component', 'summary', 'version', 'description'],
        },
      },
      {
        name: 'update_bug',
        description: 'Modify one or more fields of an existing bug.',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'The numeric ID of the bug to modify' },
            status: { type: 'string', description: 'New bug status' },
            resolution: { type: 'string', description: 'Resolution (if status is RESOLVED)' },
            assigned_to: { type: 'string', description: 'New assignee email' },
            priority: { type: 'string', description: 'New priority' },
            severity: { type: 'string', description: 'New severity' },
            summary: { type: 'string', description: 'New bug summary/title' },
          },
          required: ['id'],
        },
      },
      {
        name: 'get_comments',
        description: 'Retrieve all comments for a specific bug by ID.',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'The numeric ID of the bug' },
          },
          required: ['id'],
        },
      },
      {
        name: 'add_comment',
        description: 'Add a new text comment to a specific bug.',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'The numeric ID of the bug' },
            comment: { type: 'string', description: 'The text comment to add' },
            is_private: { type: 'boolean', description: 'Whether the comment should be private' },
          },
          required: ['id', 'comment'],
        },
      },
      {
        name: 'add_attachment',
        description: 'Upload a base64 encoded attachment to a specific bug.',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'The numeric ID of the bug' },
            data: { type: 'string', description: 'Base64 encoded string of the file contents' },
            file_name: { type: 'string', description: 'The file name of the attachment' },
            summary: { type: 'string', description: 'A brief description/summary of the attachment' },
            content_type: { type: 'string', description: 'The MIME type of the file' },
          },
          required: ['id', 'data', 'file_name', 'summary', 'content_type'],
        },
      },
      {
        name: 'get_products',
        description: 'Retrieve the list of products and components available in this Bugzilla instance.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_fields',
        description: 'Retrieve valid fields, status values, priorities, etc., for the Bugzilla instance.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'search_bugs': {
        checkPermission('read');
        const params = SearchBugsSchema.parse(args);
        const bugs = await client.searchBugs(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(bugs, null, 2),
            },
          ],
        };
      }

      case 'get_bug': {
        checkPermission('read');
        const { id, include_history, include_attachments } = GetBugSchema.parse(args);
        const result = await client.getBug(id, include_history, include_attachments);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'create_bug': {
        checkPermission('write');
        const bugData = CreateBugSchema.parse(args);
        const result = await client.createBug(bugData);
        return {
          content: [
            {
              type: 'text',
              text: `Bug successfully created with ID: ${result.id}`,
            },
          ],
        };
      }

      case 'update_bug': {
        checkPermission('write');
        const { id, ...updates } = UpdateBugSchema.parse(args);
        const result = await client.updateBug(id, updates);
        return {
          content: [
            {
              type: 'text',
              text: `Bug ${id} successfully updated. Changes: ${JSON.stringify(result.changes, null, 2)}`,
            },
          ],
        };
      }

      case 'get_comments': {
        checkPermission('read');
        const { id } = GetCommentsSchema.parse(args);
        const comments = await client.getComments(id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(comments, null, 2),
            },
          ],
        };
      }

      case 'add_comment': {
        checkPermission('write');
        const { id, comment, is_private } = AddCommentSchema.parse(args);
        const result = await client.addComment(id, comment, is_private);
        return {
          content: [
            {
              type: 'text',
              text: `Comment successfully added to bug ${id}. Comment ID: ${result.id}`,
            },
          ],
        };
      }

      case 'add_attachment': {
        checkPermission('write');
        const { id, data, file_name, summary, content_type } = AddAttachmentSchema.parse(args);
        const result = await client.addAttachment(id, { data, file_name, summary, content_type });
        return {
          content: [
            {
              type: 'text',
              text: `Attachment successfully uploaded to bug ${id}. Attachment ID: ${result.id}`,
            },
          ],
        };
      }

      case 'get_products': {
        checkPermission('read');
        const products = await client.getProducts();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(products, null, 2),
            },
          ],
        };
      }

      case 'get_fields': {
        checkPermission('read');
        const fields = await client.getFields();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(fields, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: error.message || String(error),
        },
      ],
    };
  }
});

// Run server using stdio transport
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Bugzilla MCP Server running on stdio');
}

run().catch((error) => {
  console.error('Fatal error running server:', error);
  process.exit(1);
});
