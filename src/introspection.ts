export interface IntrospectionResult {
  active: boolean;
  sub?: string;
  scope?: string;
  client_id?: string;
  exp?: number;
  iat?: number;
  token_type?: string;
  code_challenge?: string;
  code_challenge_method?: string;
}

interface TokenCacheEntry {
  result: IntrospectionResult;
  cachedAt: number;
}

const TOKEN_CACHE = new Map<string, TokenCacheEntry>();
const CACHE_TTL_MS = 60_000;

export class TokenIntrospector {
  private railsUrl: string;
  private clientId: string;
  private clientSecret: string;

  constructor() {
    this.railsUrl = process.env.RAILS_ISSUER_URL || '';
    this.clientId = process.env.MCP_INTROSPECTION_CLIENT_ID || '';
    this.clientSecret = process.env.MCP_INTROSPECTION_CLIENT_SECRET || '';
  }

  async introspect(token: string): Promise<IntrospectionResult> {
    const cached = TOKEN_CACHE.get(token);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return cached.result;
    }

    if (!this.railsUrl || !this.clientId || !this.clientSecret) {
      console.warn('Introspection credentials not configured', {
        railsUrl: this.railsUrl || '(missing)',
        clientIdConfigured: Boolean(this.clientId),
        clientSecretConfigured: Boolean(this.clientSecret)
      });
      return { active: false };
    }

    const credentials = Buffer.from(
      `${this.clientId}:${this.clientSecret}`
    ).toString('base64');

    let response: Response;
    try {
      console.debug('Introspecting token', {
        railsUrl: this.railsUrl,
        tokenPrefix: token.slice(0, 6)
      });
      response = await fetch(`${this.railsUrl}/oauth/introspect`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({ token })
      });
    } catch (error) {
      console.warn('Token introspection request failed', {
        railsUrl: this.railsUrl,
        error
      });
      return { active: false };
    }

    if (!response.ok) {
      let errorBody = '';
      try {
        errorBody = await response.text();
      } catch (error) {
        errorBody = `Unable to read response body: ${String(error)}`;
      }
      console.warn('Token introspection response not OK', {
        status: response.status,
        statusText: response.statusText,
        body: errorBody.slice(0, 500)
      });
      return { active: false };
    }

    let result: IntrospectionResult;
    try {
      result = await response.json();
    } catch (error) {
      console.warn('Token introspection response was not JSON', {
        error
      });
      return { active: false };
    }

    console.debug('Token introspection result', {
      active: result.active,
      scope: result.scope,
      clientId: result.client_id,
      sub: result.sub,
      exp: result.exp
    });

    if (result.active) {
      TOKEN_CACHE.set(token, { result, cachedAt: Date.now() });
    }

    return result;
  }
}
