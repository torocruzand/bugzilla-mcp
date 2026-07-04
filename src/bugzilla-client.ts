import axios, { AxiosInstance, AxiosError } from 'axios';

export interface BugzillaConfig {
  baseUrl: string;
  apiKey?: string;
  login?: string;
  password?: string;
}

export interface BugSearchParameters {
  summary?: string;
  status?: string;
  assigned_to?: string;
  product?: string;
  component?: string;
  severity?: string;
  priority?: string;
  creation_time?: string;
}

export interface Bug {
  id: number;
  summary: string;
  status: string;
  resolution: string;
  product: string;
  component: string;
  version: string;
  priority: string;
  severity: string;
  assigned_to: string;
  creator: string;
  creation_time: string;
  last_change_time: string;
  [key: string]: any; // Allow other properties returned by Bugzilla
}

export interface BugHistory {
  bugs: Array<{
    id: number;
    alias: string[];
    history: Array<{
      when: string;
      who: string;
      changes: Array<{
        field_name: string;
        removed: string;
        added: string;
        attachment_id?: number;
      }>;
    }>;
  }>;
}

export interface Attachment {
  id: number;
  bug_id: number;
  file_name: string;
  summary: string;
  content_type: string;
  creation_time: string;
  last_change_time: string;
  size: number;
  creator: string;
  is_private: boolean;
  is_obsolete: boolean;
  data?: string; // Base64 data if requested
}

export interface Comment {
  id: number;
  bug_id: number;
  text: string;
  creator: string;
  time: string;
  creation_time: string;
  is_private: boolean;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  components: Array<{
    name: string;
    description: string;
  }>;
}

export interface FieldValue {
  name: string;
  sort_key: number;
  is_active: boolean;
  description?: string;
}

export interface BugField {
  id: number;
  name: string;
  type: number;
  display_name: string;
  is_custom: boolean;
  values?: FieldValue[];
}

export class BugzillaClient {
  private client: AxiosInstance;

  constructor(config: BugzillaConfig) {
    if (!config.baseUrl) {
      throw new Error('BUGZILLA_URL configuration is required.');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // 1. API Key Auth
    if (config.apiKey) {
      headers['Bugzilla-API-Key'] = config.apiKey;
    } 
    // 2. Login/Password Auth
    else if (config.login && config.password) {
      headers['X-Bugzilla-Login'] = config.login;
      headers['X-Bugzilla-Password'] = config.password;
    }

    this.client = axios.create({
      baseURL: config.baseUrl.replace(/\/$/, ''),
      headers,
    });
  }

  private handleError(error: unknown, context: string): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;
      const bugzillaError = axiosError.response?.data;
      
      let message = `Bugzilla API error during ${context}: `;
      if (bugzillaError && bugzillaError.message) {
        message += `${bugzillaError.message} (Code: ${bugzillaError.code})`;
      } else {
        message += `${axiosError.message} (Status: ${axiosError.response?.status})`;
      }
      throw new Error(message);
    }
    throw new Error(`Unexpected error during ${context}: ${(error as Error).message}`);
  }

  async searchBugs(params: BugSearchParameters): Promise<Bug[]> {
    try {
      // Map params and filter undefined
      const queryParams: Record<string, string> = {};
      
      if (params.summary) queryParams.summary = params.summary;
      if (params.status) queryParams.status = params.status;
      if (params.assigned_to) queryParams.assigned_to = params.assigned_to;
      if (params.product) queryParams.product = params.product;
      if (params.component) queryParams.component = params.component;
      if (params.severity) queryParams.severity = params.severity;
      if (params.priority) queryParams.priority = params.priority;
      if (params.creation_time) queryParams.creation_time = params.creation_time;

      const response = await this.client.get('/rest/bug', { params: queryParams });
      return response.data.bugs || [];
    } catch (error) {
      this.handleError(error, 'searching bugs');
    }
  }

  async getBug(id: number, includeHistory = false, includeAttachments = false): Promise<{ bug: Bug; history?: BugHistory['bugs'][0]['history']; attachments?: Attachment[] }> {
    try {
      const response = await this.client.get(`/rest/bug/${id}`);
      const bug = response.data.bugs?.[0];
      if (!bug) {
        throw new Error(`Bug with ID ${id} not found.`);
      }

      let history: BugHistory['bugs'][0]['history'] | undefined;
      let attachments: Attachment[] | undefined;

      if (includeHistory) {
        try {
          const histResponse = await this.client.get(`/rest/bug/${id}/history`);
          history = histResponse.data.bugs?.[0]?.history;
        } catch (e) {
          // If history fails, we still return the bug but with warning/empty
          console.error(`Failed to fetch history for bug ${id}:`, e);
        }
      }

      if (includeAttachments) {
        try {
          const attachResponse = await this.client.get(`/rest/bug/${id}/attachment`);
          // Attachment response structure is typically { bugs: { "bug_id": [attachments] } }
          const bugAttachments = attachResponse.data.bugs?.[id] || attachResponse.data.attachments?.[id];
          attachments = bugAttachments || [];
        } catch (e) {
          console.error(`Failed to fetch attachments for bug ${id}:`, e);
        }
      }

      return { bug, history, attachments };
    } catch (error) {
      this.handleError(error, `fetching bug ${id}`);
    }
  }

  async createBug(bugData: {
    product: string;
    component: string;
    summary: string;
    version: string;
    description: string;
    op_sys?: string;
    platform?: string;
    priority?: string;
    severity?: string;
    assigned_to?: string;
  }): Promise<{ id: number }> {
    try {
      const response = await this.client.post('/rest/bug', bugData);
      return { id: response.data.id };
    } catch (error) {
      this.handleError(error, 'creating bug');
    }
  }

  async updateBug(id: number, updates: {
    status?: string;
    resolution?: string;
    assigned_to?: string;
    priority?: string;
    severity?: string;
    summary?: string;
    [key: string]: any;
  }): Promise<{ id: number; changes: any }> {
    try {
      const response = await this.client.put(`/rest/bug/${id}`, updates);
      return { 
        id, 
        changes: response.data.bugs?.[0] || response.data 
      };
    } catch (error) {
      this.handleError(error, `updating bug ${id}`);
    }
  }

  async getComments(bugId: number): Promise<Comment[]> {
    try {
      const response = await this.client.get(`/rest/bug/${bugId}/comment`);
      // Response shape: { bugs: { "bug_id": { comments: [...] } } }
      const bugData = response.data.bugs?.[bugId];
      return bugData?.comments || [];
    } catch (error) {
      this.handleError(error, `fetching comments for bug ${bugId}`);
    }
  }

  async addComment(bugId: number, comment: string, isPrivate = false): Promise<{ id: number }> {
    try {
      const response = await this.client.post(`/rest/bug/${bugId}/comment`, {
        comment,
        is_private: isPrivate,
      });
      return { id: response.data.id };
    } catch (error) {
      this.handleError(error, `adding comment to bug ${bugId}`);
    }
  }

  async addAttachment(bugId: number, attachmentData: {
    data: string;
    file_name: string;
    summary: string;
    content_type: string;
  }): Promise<{ id: number }> {
    try {
      const response = await this.client.post(`/rest/bug/${bugId}/attachment`, {
        ids: [bugId],
        data: attachmentData.data,
        file_name: attachmentData.file_name,
        summary: attachmentData.summary,
        content_type: attachmentData.content_type,
      });
      return { id: response.data.id || response.data.ids?.[0] };
    } catch (error) {
      this.handleError(error, `adding attachment to bug ${bugId}`);
    }
  }

  async getProducts(): Promise<Product[]> {
    try {
      // In Bugzilla, you can get all products or accessible products
      const response = await this.client.get('/rest/product?type=accessible');
      return response.data.products || [];
    } catch (error) {
      this.handleError(error, 'fetching products');
    }
  }

  async getFields(): Promise<BugField[]> {
    try {
      const response = await this.client.get('/rest/field/bug');
      return response.data.fields || [];
    } catch (error) {
      this.handleError(error, 'fetching fields');
    }
  }
}
