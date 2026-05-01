# PagePixels Screenshots MCP Server

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server for the [PagePixels](https://pagepixels.com) Screenshot API. Enables AI assistants to capture instant and scheduled screenshots, generate images from raw HTML, take screenshots after performing browser actions, and run AI-powered website domain research using natural language.

## Features

- **Instant Screenshots** — Capture any URL or render raw HTML to an image on demand
- **Multi-Step Browser Actions** — Click, type, submit forms, navigate pages, and wait for elements before capturing
- **Scheduled Screenshots** — Create recurring capture configurations on minute, hour, day, week, month, or year intervals
- **Real Location Screenshots** — Screenshot from 150+ geographical locations (countries, US states, and major cities)
- **AI Analysis Screenshots** — Capture screenshots and have AI analyze the images guided by custom text prompts
- **Custom HTML Screenshots** — Create screenshots from HTML and data available in the MCP client
- **Multiple Image AI Analysis** — Have AI compare up to 5 images and 5 prompts
- **Extract HTML** — Enable AI to find CSS Selectors and get HTML content from websites that generate their HTML using JavaScript 
- **Website Domain Research** — AI-powered structured data extraction across multiple domains
- **Full Configuration Management** — Create, read, update, delete, and list screenshot configurations programmatically
- **OAuth 2.1 Authentication** — Secure, spec-compliant MCP auth via Streamable HTTP transport

## Requirements

- A [PagePixels](https://pagepixels.com) account (free tier available — no payment info required)

## Quick Start

### MCP Server URL

Connect over Streamable HTTP by pointing your client at:

```
https://mcp.pagepixels.com/mcp
```

### Example: Claude.ai Web 

1. Open **Customize** (toolbox icon).
2. Select **Connectors**.
3. Click **Add**. Select **Add custom connector** option.
3. Enter the server URL:
   ```
   https://mcp.pagepixels.com/mcp
   ```
4. Complete the OAuth authorization when prompted in the browser.

Once connected, PagePixels tools will be available in all new conversations.

## Tools

### Capture Instant Screenshots

| Tool | Description |
|---|---|
| `snap` | Capture a screenshot of any URL with full control over viewport, format, quality, wait conditions, JS/CSS injection, multi-step browser actions, AI analysis, and geo-location. |
| `snap_html` | Render raw HTML content into a screenshot with the same capture options as the `snap` tool. |
| `capture_screenshot` | Trigger an immediate capture for an existing screenshot configuration. |

### Scheduled Screenshots

| Tool | Description |
|---|---|
| `create_screenshot_config` | Create a new screenshot configuration with optional interval scheduling (minutes, hours, days, months years). |
| `get_screenshot_config` | Retrieve a screenshot configuration by ID. |
| `update_screenshot_config` | Update any property of an existing screenshot configuration. |
| `delete_screenshot_config` | Delete a screenshot configuration and all its captured screenshots. |
| `list_screenshot_configs` | List all screenshot configurations in the account with pagination and time filters. |
| `get_job_status` | Check if a screenshot job has completed. |

### Screenshot History

| Tool | Description |
|---|---|
| `list_config_screenshots` | List all screenshots for a specific configuration. |
| `list_all_screenshots` | List all screenshots across the account. |

### Real Locations

| Tool | Description |
|---|---|
| `list_real_locations` | List all 150+ supported geo-locations for screenshot capture. |

### Multiple Image AI Analysis

| Tool | Description |
|---|---|
| `analyze_any_image_with_ai` | Submit up to 5 images and 5 prompts for an AI to analyze. |

### Website Domain Research

| Tool | Description |
|---|---|
| `create_domain_research` | Submit an AI-powered data extraction job across one or more domains with custom field definitions. |
| `get_domain_research_status` | Check the status of a domain research job. |
| `get_domain_research_report` | Download completed research results as JSON or CSV. |
| `list_domain_research_reports` | List all domain research reports in the account. |

### Change Notifications

| Tool | Description |
|---|---|
| `list_config_change_notifications` | List change notifications for a specific configuration. |
| `list_all_change_notifications` | List all change notifications across the account. |

### Account & Utilities

| Tool | Description |
|---|---|
| `get_account_limits` | Get current usage and account limits. |

## Usage Examples

Once connected, interact naturally with your AI assistant:

**Take a screenshot:**
> "Take a screenshot of https://example.com in PNG format at 540px wide and remove cookie banners"

**Multi-step capture:**
> "Go to https://example.com, fill in the search field with 'text to search for', submit the form, then take a full-page screenshot"

**Scheduled monitoring:**
> "Capture a screenshot of https://example.com/pricing every 6 hours"

**Geo-located capture:**
> "Screenshot https://example.com from Japan and wait 6000ms before taking the screenshot"

**Domain research:**
> "Research these 5 competitor domains and extract their pricing tiers, founding year, and team size"

**Account overview:**
> "Show me my current usage and remaining credits"

## Capture Options

The `snap` and `snap_html` tools support extensive configuration:

- **Viewport:** `page_width`, `page_height`, `scale_factor` (1x or 2x Retina)
- **Output:** `image_format` (jpeg, png, webp, pdf), `quality` (1–100 for JPEG), thumbnails
- **Full Page:** `fullpage`, `fullpage_advanced`, `incremental_scroll` for lazy-loaded content
- **Element Capture:** `selectors` to screenshot a specific DOM element
- **Timing:** `wait` (ms delay before capture), `wait_for` (CSS selector to appear)
- **Custom Styles:** `css_inject`
- **Scripting:** `js_inject`
- **Remove/disable:** `no_ads`, `no_cookie_banners`, `no_tracking`
- **Geo-Location:** `real_location` (150+ locations), `time_zone`, `accept_language`
- **AI Analysis:** `analyze_image_with_ai` and `ai_prompt` to analyze a screenshot guided by a custom text prompt
- **Auth & headers:** `cookies`, `headers`, `user_agent`
- **HTML Extraction:** `html_only` to return fully rendered HTML instead of an image
- **Caching:** `ttl` to control cache duration (0 for always fresh)

[See full list of screenshot options](https://pagepixels.com/app/screenshots-api-documentation#api-options).

## Multi-Step Actions

Automate browser interactions before capturing with `multi_step_actions`:

```json
[
  { "type": "wait_for_selector", "selector": "#email" }
  { "type": "text_field", "selector": "#email", "value": "user@example.com" },
  { "type": "text_field", "selector": "#password", "value": "secret" },
  { "type": "submit" },
  { "type": "wait", "value": "8000" },
  { "type": "click", "selector": ".chart-filter" }
]
```

Supported action types: `click`, `hover`, `change`, `redirect`, `javascript`, `evaluateJs`, `css`, `text_field`, `select`, `checkbox`, `submit`, `wait`, `wait_for_selector`

[See Multi-Step section of MCP Help Guide](https://pagepixels.com/help/mcp#multi-step-actions)

## Authentication

Authentication is handled through the standard MCP OAuth 2.1 flow with PKCE and uses DCR (Dynamic Client Registration). When connecting through Claude.ai, Cursor, or other OAuth-capable MCP clients, authorize through the browser prompt when first connecting. No manual API key configuration is needed.

For programmatic access outside of MCP, see the [PagePixels API documentation](https://pagepixels.com/app/documentation).

## Transport

This server uses the MCP Streamable HTTP transport, hosted at:

```
https://mcp.pagepixels.com/mcp
```

All MCP clients that support remote Streamable HTTP servers can connect directly. OAuth 2.1 with PKCE is enforced on all connections.

## Resources

- [Screenshot MCP Server Help Guide](https://pagepixels.com/help/mcp) — Guide to using the PagePixels MCP Server
- [PagePixels Documentation](https://pagepixels.com/app/documentation) — Full API reference
- [Model Context Protocol](https://modelcontextprotocol.io) — MCP specification

## Support

Contact PagePixels anytime by email: 

```
support-tickets@pagepixels.com
```

Or contact us through our [Support Form](https://pagepixels.com/support).

## License

MIT
