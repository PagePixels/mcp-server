import { Router } from 'express';

const DEFAULT_MCP_SERVER_URL = 'https://mcp.pagepixels.com';
const DEFAULT_RAILS_ISSUER_URL = 'https://pagepixels.com';

function normalizedUrl(value: string | undefined, fallback: string): string {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return fallback;
  }

  return trimmedValue.replace(/\/+$/, '');
}

export function protectedResourceMetadata(): Router {
  const router = Router();

  router.get('/.well-known/oauth-protected-resource', (_req, res) => {
    const serverBase = normalizedUrl(process.env.MCP_SERVER_URL, DEFAULT_MCP_SERVER_URL);
    const resource = `${serverBase}/mcp`;
    const authorizationServer = normalizedUrl(
      process.env.RAILS_ISSUER_URL,
      DEFAULT_RAILS_ISSUER_URL
    );

    res.json({
      resource,
      authorization_servers: [authorizationServer],
      scopes_supported: ['mcp_read', 'mcp_write', 'mcp_admin'],
      bearer_methods_supported: ['header']
    });
  });

  router.get('/.well-known/oauth-authorization-server', (_req, res) => {
    const issuer = normalizedUrl(process.env.RAILS_ISSUER_URL, DEFAULT_RAILS_ISSUER_URL);

    res.json({
      issuer,
      authorization_endpoint: `${issuer}/oauth/authorize`,
      token_endpoint: `${issuer}/oauth/token`,
      registration_endpoint: `${issuer}/oauth/register`,
      token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'none'],
      grant_types_supported: ['authorization_code'],
      response_types_supported: ['code'],
      scopes_supported: ['write', 'mcp_write', 'mcp_admin'],
      code_challenge_methods_supported: ['S256'],
      revocation_endpoint: `${issuer}/oauth/revoke`,
      introspection_endpoint: `${issuer}/oauth/introspect`
    });
  });

  return router;
}
