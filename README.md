# pagepixels-screenshots-mcp-server

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server for the [PagePixels](https://pagepixels.com) Screenshot API. Enables AI assistants like Claude, Cursor, Windsurf, and other MCP-compatible clients to capture screenshots, manage screenshot configurations, monitor page changes, and perform AI-powered domain research — all through natural language.

## Features

- **Instant Screenshots** — Capture any URL or render raw HTML to an image on demand
- **Multi-Step Browser Actions** — Click, type, submit forms, navigate pages, and wait for elements before capturing
- **Scheduled Screenshots** — Create recurring capture configurations on minute, hour, day, week, month, or year intervals
- **Geo-Located Captures** — Screenshot from 150+ real locations worldwide (countries, US states, and major cities)
- **Change Notifications** — Monitor pages for visual changes with Slack and webhook alerts
- **Domain Research** — AI-powered structured data extraction across multiple domains
- **Full Configuration Management** — Create, read, update, delete, and list screenshot configurations programmatically
- **OAuth 2.1 Authentication** — Secure, spec-compliant MCP auth via Streamable HTTP transport

## Requirements

- A [PagePixels](https://pagepixels.com) account (free tier available — no payment info required)

## Quick Start

### Claude.ai

1. Open **Settings** (bottom-left) and navigate to **Integrations**
2. Select **Add custom connector**
3. Enter the server URL:
   ```
   https://mcp.pagepixels.com/mcp
   ```
4. Complete the OAuth authorization when prompted in the browser

Once connected, PagePixels tools will be available in all new conversations.

### Cursor / Windsurf / Claude Desktop / Other MCP Clients

Connect over Streamable HTTP by pointing your client at:

```
https://mcp.pagepixels.com/mcp
```

For clients that support remote MCP servers with OAuth, authentication is handled via the standard MCP OAuth 2.1 flow with PKCE — authorize through the browser prompt when first connecting.

## Tools

### Screenshot Capture

| Tool | Description |
|---|---|
| `snap` | Capture a screenshot of any URL with full control over viewport, format, quality, wait conditions, JS/CSS injection, multi-step browser actions, and geo-location |
| `snap_html` | Render raw HTML content into a screenshot with the same capture options as `snap` |
| `capture_screenshot` | Trigger an immediate capture for an existing screenshot configuration |

### Screenshot Configuration Management

| Tool | Description |
|---|---|
| `create_screenshot_config` | Create a new configuration with optional scheduling (minutes through years) |
| `get_screenshot_config` | Retrieve a configuration by ID |
| `update_screenshot_config` | Update any property of an existing configuration |
| `delete_screenshot_config` | Delete a configuration and all its captured screenshots |
| `list_screenshot_configs` | List all configurations in the account with pagination and time filters |

### Screenshot History

| Tool | Description |
|---|---|
| `list_config_screenshots` | List all screenshots for a specific configuration |
| `list_all_screenshots` | List all screenshots across the account |

### Change Notifications

| Tool | Description |
|---|---|
| `list_config_change_notifications` | List change notifications for a specific configuration |
| `list_all_change_notifications` | List all change notifications across the account |

### Domain Research

| Tool | Description |
|---|---|
| `create_domain_research` | Submit an AI-powered data extraction job across one or more domains with custom field definitions |
| `get_domain_research_status` | Check the status of a domain research job |
| `get_domain_research_report` | Download completed research results as JSON or CSV |
| `list_domain_research_reports` | List all domain research reports in the account |

### Account & Utilities

| Tool | Description |
|---|---|
| `get_account_limits` | Get current usage and account limits |
| `get_job_status` | Check if a screenshot job has completed |
| `list_real_locations` | List all 150+ supported geo-locations for screenshot capture |

## Usage Examples

Once connected, interact naturally with your AI assistant:

**Take a screenshot:**
> "Take a screenshot of https://example.com in PNG format at 1440px wide"

**Multi-step capture:**
> "Go to https://example.com, click the login button, fill in the email field with test@example.com, submit the form, then take a full-page screenshot"

**Scheduled monitoring:**
> "Create a screenshot configuration for https://example.com/pricing that captures every 6 hours as JPEG"

**Geo-located capture:**
> "Screenshot https://example.com from Japan with a Retina scale factor"

**Domain research:**
> "Research these 5 competitor domains and extract their pricing tiers, founding year, and team size"

**Account overview:**
> "Show me my current usage and remaining credits"

## Capture Options

The `snap` and `snap_html` tools support extensive configuration:

- **Viewport:** `page_width`, `page_height`, `scale_factor` (1x or 2x Retina)
- **Output:** `image_format` (jpeg, png, webp), `quality` (1–100 for JPEG), thumbnails
- **Full Page:** `fullpage`, `fullpage_advanced`, `incremental_scroll` for lazy-loaded content
- **Timing:** `wait` (ms delay before capture), `wait_for` (CSS selector to appear)
- **Injection:** `js_inject`, `css_inject` for custom page modifications
- **Privacy:** `no_ads`, `no_cookie_banners`, `no_tracking`
- **Scripting:** `disable_js`, `disable_third_party_js`
- **Geo-Location:** `real_location` (150+ locations), `latitude`/`longitude`, `time_zone`
- **Auth & Headers:** `cookies`, `headers`, `user_agent`
- **Element Capture:** `selectors` to capture a specific DOM element
- **HTML Extraction:** `html_only` to return fully rendered HTML instead of an image
- **Caching:** `ttl` to control cache duration (0 for always fresh)

## Multi-Step Actions

Automate browser interactions before capturing with `multi_step_actions`:

```json
[
  { "type": "click", "selector": "#login-btn" },
  { "type": "text_field", "selector": "#email", "value": "user@example.com" },
  { "type": "text_field", "selector": "#password", "value": "secret" },
  { "type": "submit" },
  { "type": "wait_for_selector", "selector": ".dashboard" }
]
```

Supported action types: `click`, `hover`, `change`, `redirect`, `javascript`, `evaluateJs`, `css`, `text_field`, `select`, `checkbox`, `submit`, `wait`, `wait_for_selector`

## Authentication

Authentication is handled through the standard MCP OAuth 2.1 flow with PKCE. When connecting through Claude.ai, Cursor, or other OAuth-capable MCP clients, authorize through the browser prompt when first connecting. No manual API key configuration is needed.

For programmatic access outside of MCP, see the [PagePixels API documentation](https://pagepixels.com/app/documentation).

## Transport

This server uses the MCP Streamable HTTP transport, hosted at:

```
https://mcp.pagepixels.com/mcp
```

All MCP clients that support remote Streamable HTTP servers can connect directly. OAuth 2.1 with PKCE is enforced on all connections.

## Related

- [PagePixels Documentation](https://pagepixels.com/app/documentation) — Full API reference
- [screenshots-pagepixels](https://www.npmjs.com/package/screenshots-pagepixels) — Node.js API client
- [screenshots-pagepixels (PyPI)](https://pypi.org/project/screenshots-pagepixels/) — Python API client
- [screenshots_pagepixels (RubyGems)](https://rubygems.org/gems/screenshots_pagepixels) — Ruby API client
- [Model Context Protocol](https://modelcontextprotocol.io) — MCP specification

## License

MIT