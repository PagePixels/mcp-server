import type { Request, Response, NextFunction } from 'express';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import { TokenIntrospector } from './introspection.js';

const introspector = new TokenIntrospector();
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || '';

export interface AuthenticatedRequest extends Request {
  tokenInfo?: {
    sub: string;
    scope: string;
    clientId: string;
  };
  auth?: AuthInfo;
}

export async function requireMcpAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401);
    if (MCP_SERVER_URL) {
      res.setHeader(
        'WWW-Authenticate',
        `Bearer resource_metadata="${MCP_SERVER_URL}/.well-known/oauth-protected-resource"`
      );
    }
    res.json({ error: 'unauthorized' });
    return;
  }

  const token = authHeader.slice(7);
  const result = await introspector.introspect(token);

  if (!result.active) {
    console.warn('MCP auth failed: token inactive', {
      tokenPrefix: token.slice(0, 6)
    });
    res.status(401).json({ error: 'invalid_token' });
    return;
  }

  const scopes = (result.scope || '').split(' ');
  const hasMcpScope = scopes.some((scope) => scope.startsWith('mcp_'));
  if (!hasMcpScope) {
    console.warn('MCP auth failed: missing MCP scope', {
      scopes
    });
    res.status(403);
    res.setHeader('WWW-Authenticate', 'Bearer scope="mcp_read"');
    res.json({
      error: 'insufficient_scope',
      error_description: 'Token must include an MCP scope'
    });
    return;
  }

  if (result.exp && result.exp < Math.floor(Date.now() / 1000)) {
    res.status(401).json({ error: 'token_expired' });
    return;
  }

  req.tokenInfo = {
    sub: result.sub || '',
    scope: result.scope || '',
    clientId: result.client_id || ''
  };
  req.auth = {
    token,
    clientId: result.client_id || '',
    scopes,
    expiresAt: result.exp,
    extra: { sub: result.sub || '' }
  };

  next();
}

export function requireScope(scope: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const scopes = (req.tokenInfo?.scope || '').split(' ');
    if (!scopes.includes(scope)) {
      res.status(403);
      res.setHeader('WWW-Authenticate', `Bearer scope="${scope}"`);
      res.json({ error: 'insufficient_scope' });
      return;
    }
    next();
  };
}
