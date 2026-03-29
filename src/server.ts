import 'dotenv/config';
import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import type { ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { protectedResourceMetadata } from './metadata.js';
import { requireMcpAuth, type AuthenticatedRequest } from './auth.js';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use(protectedResourceMetadata());
app.use('/mcp', requireMcpAuth);

const API_BASE_URL = process.env.RAILS_API_URL || '';

const REAL_LOCATIONS = [
  'Afghanistan',
  'Alabama',
  'Alaska',
  'Albania',
  'Andorra',
  'Angola',
  'Argentina',
  'Arizona',
  'Arkansas',
  'Armenia',
  'Aruba',
  'Australia',
  'Austria',
  'Azerbaijan',
  'Bahamas',
  'Bahrain',
  'Bangladesh',
  'Belarus',
  'Belgium',
  'Belize',
  'Benin',
  'Berlin',
  'Bhutan',
  'Bolivia',
  'Bosnia and Herzegovina',
  'Brazil',
  'British Virgin Islands',
  'Bulgaria',
  'California',
  'Cambodia',
  'Cameroon',
  'Canada',
  'Chad',
  'Chicago',
  'Chile',
  'China',
  'Colombia',
  'Colorado',
  'Connecticut',
  'Costa Rica',
  "Côte d'Ivoire",
  'Croatia',
  'Cuba',
  'Cyprus',
  'Czech Republic',
  'Delaware',
  'Denmark',
  'Djibouti',
  'Dominica',
  'Ecuador',
  'Egypt',
  'Estonia',
  'Ethiopia',
  'Europe',
  'Fiji',
  'Finland',
  'Florida',
  'France',
  'Gambia',
  'Georgia',
  'Georgia (US)',
  'Germany',
  'Ghana',
  'Great Britain',
  'Greece',
  'Haiti',
  'Hawaii',
  'Honduras',
  'Hong Kong',
  'Houston',
  'Hungary',
  'Iceland',
  'Idaho',
  'Illinois',
  'India',
  'Indiana',
  'Indonesia',
  'Iowa',
  'Iran',
  'Iraq',
  'Ireland',
  'Israel',
  'Italy',
  'Jamaica',
  'Japan',
  'Jordan',
  'Kansas',
  'Kazakhstan',
  'Kentucky',
  'Kenya',
  'Latvia',
  'Lebanon',
  'Liberia',
  'Liechtenstein',
  'Lithuania',
  'London',
  'Los Angeles',
  'Louisiana',
  'Luxembourg',
  'Macedonia',
  'Madagascar',
  'Maine',
  'Malaysia',
  'Maldives',
  'Mali',
  'Malta',
  'Maryland',
  'Massachusetts',
  'Mauritania',
  'Mauritius',
  'Mexico',
  'Miami',
  'Michigan',
  'Minnesota',
  'Mississippi',
  'Missouri',
  'Moldova',
  'Monaco',
  'Mongolia',
  'Montana',
  'Montenegro',
  'Morocco',
  'Moscow',
  'Mozambique',
  'Myanmar',
  'Nebraska',
  'Netherlands',
  'Nevada',
  'New Hampshire',
  'New Jersey',
  'New Mexico',
  'New York',
  'New Zealand',
  'Nigeria',
  'North Carolina',
  'North Dakota',
  'Norway',
  'Ohio',
  'Oklahoma',
  'Oman',
  'Oregon',
  'Pakistan',
  'Panama',
  'Paraguay',
  'Pennsylvania',
  'Peru',
  'Philippines',
  'Poland',
  'Portugal',
  'Puerto Rico',
  'Qatar',
  'Rhode Island',
  'Romania',
  'Russia',
  'Saudi Arabia',
  'Senegal',
  'Serbia',
  'Seychelles',
  'Singapore',
  'Slovakia',
  'Slovenia',
  'South Africa',
  'South Carolina',
  'South Dakota',
  'South Korea',
  'South Sudan',
  'Spain',
  'Sudan',
  'Sweden',
  'Switzerland',
  'Syria',
  'Taiwan',
  'Tennessee',
  'Texas',
  'Thailand',
  'Togo',
  'Trinidad and Tobago',
  'Tunisia',
  'Turkey',
  'Turkmenistan',
  'UAE',
  'Uganda',
  'Ukraine',
  'United Kingdom',
  'Uruguay',
  'US',
  'USA',
  'Utah',
  'Uzbekistan',
  'Vermont',
  'Vietnam',
  'Virginia',
  'Washington',
  'West Virginia',
  'Wisconsin',
  'Wyoming',
  'Yemen',
  'Zambia',
  'Zimbabwe'
] as const;

const keyValueSchema = z.object({
  key: z.string().describe('Header/Cookie key.'),
  value: z.string().describe('Header/Cookie value.')
});

const multiStepActionSchema = z.object({
  type: z.enum([
    'click',
    'hover',
    'change',
    'redirect',
    'javascript',
    'evaluateJs',
    'css',
    'text_field',
    'select',
    'checkbox',
    'submit',
    'wait',
    'wait_for_selector'
  ]),
  selector: z.string().optional().describe('CSS selector for actions that target elements.'),
  value: z.union([z.string(), z.number(), z.boolean()]).optional().describe('Value for actions (input value, wait ms, URL, JS, or CSS).'),
  custom_id: z.string().optional().describe('Optional change-alert id (server-managed).'),
  send_to: z.enum(['slack', 'webhook']).optional().describe('For change alerts: where to send notifications.'),
  url: z.string().optional().describe('For change alerts: webhook URL.')
});

const sharedScreenshotOptionsSchema = z.object({
  time_zone: z.string().optional().describe('ICU timezone ID (e.g., US/Eastern, Europe/Berlin, Asia/Tokyo).'),
  selectors: z.string().optional().describe('Capture only the element matching this CSS selector.'),
  hover_on_selected: z.boolean().optional().describe('Requires selectors. Applies :hover styles before capture.'),
  wait: z.number().int().max(20000).optional().describe('Milliseconds to wait before capture (max 20000).'),
  wait_for: z.string().optional().describe('CSS selector that must appear before capture.'),
  incremental_scroll: z.boolean().optional().describe('Slowly scroll to trigger lazy-loaded content.'),
  fullpage: z.boolean().optional().describe('Capture the entire page.'),
  fullpage_advanced: z.boolean().optional().describe('Advanced fullpage capture (slower).'),
  page_width: z.number().int().optional().describe('Viewport width in pixels (default 1920).'),
  page_height: z.number().int().optional().describe('Viewport height in pixels (default 1000).'),
  image_format: z.enum(['jpeg', 'png', 'webp']).optional().describe('Output image format.'),
  quality: z.number().int().min(1).max(100).optional().describe('JPEG quality (1-100). Ignored for PNG/WebP.'),
  scale_factor: z.enum(['1', '2']).optional().describe('Scale factor (e.g., 2 for Retina).'),
  placeholder_url: z.string().optional().describe('Image URL shown until the first screenshot is captured.'),
  thumb_width: z.number().int().optional().describe('Thumbnail width in pixels.'),
  thumb_height: z.number().int().optional().describe('Thumbnail height in pixels.'),
  css_inject: z.string().optional().describe('Inject custom CSS into the page.'),
  js_inject: z.string().optional().describe('Inject custom JavaScript into the page.'),
  multi_step_actions: z.array(multiStepActionSchema).optional().describe('Multi-step browser actions to run before the screenshot.'),
  real_location: z.enum(REAL_LOCATIONS).optional().describe('Capture from a supported city, country, or US state.'),
  analyze_image_with_ai: z.boolean().optional().describe('Enables AI image analysis. When set to true, an AI processes the screenshot image and provide insights based on the provided ai_prompt.'),
  ai_prompt: z.string().optional().describe('A custom text prompt that guides the AI in analyzing the screenshot image.'),
  headers: z.array(keyValueSchema).optional().describe('Additional HTTP headers.'),
  cookies: z.array(keyValueSchema).optional().describe('Custom cookies.'),
  accept_language: z.string().optional().describe('Preferred language for localized pages.'),
  user_agent: z.string().optional().describe('Custom user agent string.'),
  latitude: z.string().optional().describe('Latitude for geolocation.'),
  longitude: z.string().optional().describe('Longitude for geolocation.'),
  accuracy: z.number().optional().describe('Geolocation accuracy.'),
  no_ads: z.boolean().optional().describe('Block ads.'),
  no_tracking: z.boolean().optional().describe('Block tracking scripts.'),
  no_cookie_banners: z.boolean().optional().describe('Hide cookie consent banners.'),
  disable_js: z.boolean().optional().describe('Disable JavaScript.'),
  disable_third_party_js: z.boolean().optional().describe('Disable third-party JavaScript.'),
  custom_title: z.string().optional().describe('Custom screenshot configuration title.'),
  custom_description: z.string().optional().describe('Custom screenshot configuration description.'),
  html_only: z.boolean().optional().describe('Return fully rendered HTML instead of an image (uses 1 credit).')
});

const sharedPaginationParamsSchema = z.object({
  page: z.number().int().min(1).optional().describe('Page number (default 1).'),
  limit: z.number().int().min(1).max(1000).optional().describe('Records per page (default 1000).'),
  after: z.string().optional().describe('Only return records created after this unix timestamp.'),
  before: z.string().optional().describe('Only return records created before this unix timestamp.'),
  order: z.enum(['ASC', 'DESC']).optional().describe('Sort order (default DESC).')
});

const buildAuthHeaders = (extra: RequestHandlerExtra<ServerRequest, ServerNotification>) => {
  const authToken = extra.authInfo?.token;
  const subject = extra.authInfo?.extra?.sub as string | undefined;
  return {
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(subject ? { 'X-MCP-Subject': subject } : {})
  };
};

const normalizeQuery = (params: Record<string, unknown> | undefined) => {
  const query = new URLSearchParams();
  if (!params) return query;
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    query.set(key, String(value));
  }
  return query;
};

const requestApi = async (
  extra: RequestHandlerExtra<ServerRequest, ServerNotification>,
  {
    method,
    path,
    body,
    query
  }: {
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    path: string;
    body?: Record<string, unknown>;
    query?: Record<string, unknown>;
  }
) => {
  if (!API_BASE_URL) {
    return {
      status: 500,
      ok: false,
      data: { error: 'missing_api_base_url', message: 'RAILS_API_URL is not configured.' }
    };
  }

  const url = new URL(`${API_BASE_URL}${path}`);
  const queryParams = normalizeQuery(query);
  if (queryParams.size > 0) {
    url.search = queryParams.toString();
  }

  const headers = {
    ...(body ? { 'Content-Type': 'application/json' } : {}),
    ...buildAuthHeaders(extra)
  };

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await response.text();
  let data: unknown = text;
  try {
    data = JSON.parse(text);
  } catch {
    // keep raw text
  }

  return { status: response.status, ok: response.ok, data };
};

const createMcpServer = () => {
  const mcpServer = new McpServer({
    name: 'pagepixels-mcp',
    version: '1.0.0'
  });

  mcpServer.registerTool(
    'snap',
    {
      description: 'Generate a screenshot via PagePixels /snap (JSON response).',
      annotations: { readOnlyHint: true, destructiveHint: false },
      inputSchema: sharedScreenshotOptionsSchema.extend({
        url: z.string().url().describe('The URL to capture (e.g., https://wikipedia.com).'),
        json: z.boolean().optional().describe('When true, returns JSON instead of raw image.'),
        ttl: z.number().int().optional().describe('Cache duration in seconds (default 86400). Use 0 to always capture fresh.')
      })
    },
    async (
      args: Record<string, unknown>,
      extra: RequestHandlerExtra<ServerRequest, ServerNotification>
    ) => {
      const payload = {
        json: true,
        mcp: true,
        ...args
      };

      const result = await requestApi(extra, {
        method: 'POST',
        path: '/snap',
        body: payload
      });

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        structuredContent: result
      };
    }
  );

  mcpServer.registerTool(
    'snap_html',
    {
      description: 'Render provided HTML into a screenshot via PagePixels /snap_html (JSON response).',
      annotations: { readOnlyHint: true, destructiveHint: false },
      inputSchema: sharedScreenshotOptionsSchema
        .omit({ html_only: true })
        .extend({
          html_content: z.string().describe('The HTML content to render.'),
          json: z.boolean().optional().describe('When true, returns JSON instead of raw image.')
        })
    },
    async (
      args: Record<string, unknown>,
      extra: RequestHandlerExtra<ServerRequest, ServerNotification>
    ) => {
      const payload = {
        json: true,
        mcp: true,
        ...args
      };

      const result = await requestApi(extra, {
        method: 'POST',
        path: '/snap_html',
        body: payload
      });

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        structuredContent: result
      };
    }
  );

  mcpServer.registerTool(
    'create_screenshot_config',
    {
      description: 'Create a new screenshot configuration with optional scheduling.',
      annotations: { readOnlyHint: false, destructiveHint: false },
      inputSchema: sharedScreenshotOptionsSchema.extend({
        url: z.string().url().describe('The URL to capture.'),
        scheduled_screenshot: z.boolean().optional().describe('Enable or disable scheduling.'),
        scheduled_every: z.number().int().min(1).optional().describe('Frequency number (>= 1).'),
        scheduled_interval: z.enum(['minutes', 'hours', 'days', 'weeks', 'months', 'years']).optional().describe('Frequency unit.')
      })
    },
    async (
      args: Record<string, unknown>,
      extra: RequestHandlerExtra<ServerRequest, ServerNotification>
    ) => {
      const result = await requestApi(extra, {
        method: 'POST',
        path: '/screenshot_configs',
        body: { mcp: true, ...args }
      });

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        structuredContent: result
      };
    }
  );

  mcpServer.registerTool(
    'capture_screenshot',
    {
      description: 'Trigger the next screenshot for a configuration immediately.',
      annotations: { readOnlyHint: false, destructiveHint: false },
      inputSchema: z.object({
        screenshot_configuration_id: z.string().describe('Screenshot configuration id.')
      })
    },
    async (
      args: Record<string, unknown>,
      extra: RequestHandlerExtra<ServerRequest, ServerNotification>
    ) => {
      const { screenshot_configuration_id } = args as { screenshot_configuration_id: string };
      const result = await requestApi(extra, {
        method: 'POST',
        path: `/screenshot_configs/${screenshot_configuration_id}/capture`,
        body: { mcp: true }
      });

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        structuredContent: result
      };
    }
  );

  mcpServer.registerTool(
    'get_screenshot_config',
    {
      description: 'Retrieve a screenshot configuration by id.',
      annotations: { readOnlyHint: true, destructiveHint: false },
      inputSchema: z.object({
        screenshot_configuration_id: z.string().describe('Screenshot configuration id.')
      })
    },
    async (
      args: Record<string, unknown>,
      extra: RequestHandlerExtra<ServerRequest, ServerNotification>
    ) => {
      const { screenshot_configuration_id } = args as { screenshot_configuration_id: string };
      const result = await requestApi(extra, {
        method: 'GET',
        path: `/screenshot_configs/${screenshot_configuration_id}`
      });

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        structuredContent: result
      };
    }
  );

  mcpServer.registerTool(
    'update_screenshot_config',
    {
      description: 'Update an existing screenshot configuration.',
      annotations: { readOnlyHint: false, destructiveHint: false },
      inputSchema: sharedScreenshotOptionsSchema.extend({
        screenshot_configuration_id: z.string().describe('Screenshot configuration id.'),
        url: z.string().url().optional().describe('The URL to capture.'),
        scheduled_screenshot: z.boolean().optional().describe('Enable or disable scheduling.'),
        scheduled_every: z.number().int().min(1).optional().describe('Frequency number (>= 1).'),
        scheduled_interval: z.enum(['minutes', 'hours', 'days', 'weeks', 'months', 'years']).optional().describe('Frequency unit.')
      })
    },
    async (
      args: Record<string, unknown>,
      extra: RequestHandlerExtra<ServerRequest, ServerNotification>
    ) => {
      const { screenshot_configuration_id, ...payload } = args as {
        screenshot_configuration_id: string;
        [key: string]: unknown;
      };

      const result = await requestApi(extra, {
        method: 'PATCH',
        path: `/screenshot_configs/${screenshot_configuration_id}`,
        body: { mcp: true, ...payload }
      });

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        structuredContent: result
      };
    }
  );

  mcpServer.registerTool(
    'get_job_status',
    {
      description: 'Check if a screenshot job has completed.',
      annotations: { readOnlyHint: true, destructiveHint: false },
      inputSchema: z.object({
        job_id: z.string().describe('Screenshot job id.')
      })
    },
    async (
      args: Record<string, unknown>,
      extra: RequestHandlerExtra<ServerRequest, ServerNotification>
    ) => {
      const { job_id } = args as { job_id: string };
      const result = await requestApi(extra, {
        method: 'GET',
        path: `/jobs/${job_id}`
      });

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        structuredContent: result
      };
    }
  );

  mcpServer.registerTool(
    'list_config_screenshots',
    {
      description: 'List all screenshots for a specific configuration.',
      annotations: { readOnlyHint: true, destructiveHint: false },
      inputSchema: sharedPaginationParamsSchema.extend({
        screenshot_configuration_id: z.string().describe('Screenshot configuration id.')
      })
    },
    async (
      args: Record<string, unknown>,
      extra: RequestHandlerExtra<ServerRequest, ServerNotification>
    ) => {
      const { screenshot_configuration_id, ...pagination } = args as {
        screenshot_configuration_id: string;
        [key: string]: unknown;
      };
      const result = await requestApi(extra, {
        method: 'GET',
        path: `/screenshot_configs/${screenshot_configuration_id}/screenshots`,
        query: pagination
      });

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        structuredContent: result
      };
    }
  );

  mcpServer.registerTool(
    'list_screenshot_configs',
    {
      description: 'List all screenshot configurations in the account.',
      annotations: { readOnlyHint: true, destructiveHint: false },
      inputSchema: sharedPaginationParamsSchema
    },
    async (
      args: Record<string, unknown>,
      extra: RequestHandlerExtra<ServerRequest, ServerNotification>
    ) => {
      const result = await requestApi(extra, {
        method: 'GET',
        path: '/screenshot_configs',
        query: args
      });

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        structuredContent: result
      };
    }
  );

  mcpServer.registerTool(
    'delete_screenshot_config',
    {
      description: 'Delete a screenshot configuration and all captured screenshots.',
      annotations: { readOnlyHint: false, destructiveHint: true },
      inputSchema: z.object({
        screenshot_configuration_id: z.string().describe('Screenshot configuration id.')
      })
    },
    async (
      args: Record<string, unknown>,
      extra: RequestHandlerExtra<ServerRequest, ServerNotification>
    ) => {
      const { screenshot_configuration_id } = args as { screenshot_configuration_id: string };
      const result = await requestApi(extra, {
        method: 'DELETE',
        path: `/screenshot_configs/${screenshot_configuration_id}`
      });

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        structuredContent: result
      };
    }
  );

  mcpServer.registerTool(
    'list_all_screenshots',
    {
      description: 'List all screenshots captured across the account.',
      annotations: { readOnlyHint: true, destructiveHint: false },
      inputSchema: sharedPaginationParamsSchema
    },
    async (
      args: Record<string, unknown>,
      extra: RequestHandlerExtra<ServerRequest, ServerNotification>
    ) => {
      const result = await requestApi(extra, {
        method: 'GET',
        path: '/screenshots',
        query: args
      });

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        structuredContent: result
      };
    }
  );

  mcpServer.registerTool(
    'list_config_change_notifications',
    {
      description: 'List change notifications for a specific configuration.',
      annotations: { readOnlyHint: true, destructiveHint: false },
      inputSchema: sharedPaginationParamsSchema.extend({
        screenshot_configuration_id: z.string().describe('Screenshot configuration id.')
      })
    },
    async (
      args: Record<string, unknown>,
      extra: RequestHandlerExtra<ServerRequest, ServerNotification>
    ) => {
      const { screenshot_configuration_id, ...pagination } = args as {
        screenshot_configuration_id: string;
        [key: string]: unknown;
      };
      const result = await requestApi(extra, {
        method: 'GET',
        path: `/screenshot_configs/${screenshot_configuration_id}/change_notifications`,
        query: pagination
      });

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        structuredContent: result
      };
    }
  );

  mcpServer.registerTool(
    'list_all_change_notifications',
    {
      description: 'List all change notifications across the account.',
      annotations: { readOnlyHint: true, destructiveHint: false },
      inputSchema: sharedPaginationParamsSchema
    },
    async (
      args: Record<string, unknown>,
      extra: RequestHandlerExtra<ServerRequest, ServerNotification>
    ) => {
      const result = await requestApi(extra, {
        method: 'GET',
        path: '/change_notifications',
        query: args
      });

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        structuredContent: result
      };
    }
  );

  mcpServer.registerTool(
    'list_real_locations',
    {
      description: 'List all supported real locations for screenshots.',
      annotations: { readOnlyHint: true, destructiveHint: false },
      inputSchema: z.object({})
    },
    async (
      _args: Record<string, unknown>,
      extra: RequestHandlerExtra<ServerRequest, ServerNotification>
    ) => {
      const result = await requestApi(extra, {
        method: 'GET',
        path: '/real_locations'
      });

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        structuredContent: result
      };
    }
  );

  mcpServer.registerTool(
    'get_account_limits',
    {
      description: 'Get current usage and account limits.',
      annotations: { readOnlyHint: true, destructiveHint: false },
      inputSchema: z.object({})
    },
    async (
      _args: Record<string, unknown>,
      extra: RequestHandlerExtra<ServerRequest, ServerNotification>
    ) => {
      const result = await requestApi(extra, {
        method: 'GET',
        path: '/account_limits'
      });

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        structuredContent: result
      };
    }
  );

  mcpServer.registerTool(
    'create_domain_research',
    {
      description: 'Submit a domain research request for AI-powered data extraction.',
      annotations: { readOnlyHint: false, destructiveHint: false },
      inputSchema: z.object({
        name: z.string().optional().describe('Name for the research job.'),
        additional_notes: z.string().optional().describe('Additional notes for the research job.'),
        domains: z.array(z.string()).min(1).describe('Domains to analyze. Each domain = 1 credit.'),
        structures: z.array(
          z.object({
            data_type: z.enum(['string', 'array', 'boolean', 'number']).describe('Expected data type.'),
            data_field_name: z.string().max(100).describe('Field name (max 100 chars).'),
            data_field_prompt_description: z.string().max(2000).describe('What to extract (max 2000 chars).')
          })
        ).min(1).describe('Data fields to extract (max 100).')
      })
    },
    async (
      args: Record<string, unknown>,
      extra: RequestHandlerExtra<ServerRequest, ServerNotification>
    ) => {
      const result = await requestApi(extra, {
        method: 'POST',
        path: '/api/domain_research_requests',
        body: args
      });

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        structuredContent: result
      };
    }
  );

  mcpServer.registerTool(
    'get_domain_research_status',
    {
      description: 'Get the status of a domain research job.',
      annotations: { readOnlyHint: true, destructiveHint: false },
      inputSchema: z.object({
        job_id: z.string().describe('Domain research job id.')
      })
    },
    async (
      args: Record<string, unknown>,
      extra: RequestHandlerExtra<ServerRequest, ServerNotification>
    ) => {
      const { job_id } = args as { job_id: string };
      const result = await requestApi(extra, {
        method: 'GET',
        path: `/api/domain_research_requests/${job_id}/status`
      });

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        structuredContent: result
      };
    }
  );

  mcpServer.registerTool(
    'get_domain_research_report',
    {
      description: 'Download results of a completed domain research job (JSON or CSV).',
      annotations: { readOnlyHint: true, destructiveHint: false },
      inputSchema: z.object({
        job_id: z.string().describe('Domain research job id.'),
        format: z.string().optional().describe('Use "csv" for CSV output; omit for JSON.')
      })
    },
    async (
      args: Record<string, unknown>,
      extra: RequestHandlerExtra<ServerRequest, ServerNotification>
    ) => {
      const { job_id, format } = args as { job_id: string; format?: string };
      const result = await requestApi(extra, {
        method: 'GET',
        path: `/api/domain_research_requests/${job_id}/report`,
        query: { ...(format ? { format } : {}) }
      });

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        structuredContent: result
      };
    }
  );

  mcpServer.registerTool(
    'list_domain_research_reports',
    {
      description: 'List all domain research reports in the account.',
      annotations: { readOnlyHint: true, destructiveHint: false },
      inputSchema: sharedPaginationParamsSchema
    },
    async (
      args: Record<string, unknown>,
      extra: RequestHandlerExtra<ServerRequest, ServerNotification>
    ) => {
      const result = await requestApi(extra, {
        method: 'GET',
        path: '/api/domain_research_requests',
        query: args
      });

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        structuredContent: result
      };
    }
  );

  mcpServer.registerTool(
    'analyze_any_image_with_ai',
    {
      description: 'Run AI Analysis on up to 5 images and 5 custom prompts.',
      annotations: { readOnlyHint: false, destructiveHint: false },
      inputSchema: z.object({
        urls: z.array(z.string()).min(1).describe('Array of image URLs to be analyzed. Each image URL can be a direct link to a PNG, JPEG, WEBP, or GIF image file no larger than 20MB.'),
        prompts: z.array(z.string()).min(1).describe('Corresponding array of AI prompts. Prompts can reference any image and each prompt can be up to 2500 characters in length.'),
      })
    },
    async (
      args: Record<string, unknown>,
      extra: RequestHandlerExtra<ServerRequest, ServerNotification>
    ) => {
      const result = await requestApi(extra, {
        method: 'POST',
        path: '/ai/analyze',
        body: args
      });

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        structuredContent: result
      };
    }
  );

  return mcpServer;
};

app.all('/mcp', async (req: AuthenticatedRequest, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined
  });
  const mcpServer = createMcpServer();
  await mcpServer.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, () => {
  console.log(`MCP server listening on port ${PORT}`);
});
