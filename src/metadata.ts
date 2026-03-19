import { Router } from 'express';

export function protectedResourceMetadata(): Router {
  const router = Router();

  router.get('/.well-known/oauth-protected-resource', (_req, res) => {
    res.json({
      resource: process.env.MCP_SERVER_URL,
      authorization_servers: [process.env.RAILS_ISSUER_URL],
      scopes_supported: ['mcp_read', 'mcp_write', 'mcp_admin'],
      bearer_methods_supported: ['header']
    });
  });

  return router;
}
