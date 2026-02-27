/**
 * Roblox OAuth 2.0 + OpenID Connect configuration.
 * @see https://create.roblox.com/docs/cloud/auth/oauth2-reference
 * @see https://create.roblox.com/docs/cloud/auth/oauth2-develop
 * Endpoints: GET v1/authorize, POST v1/token, GET v1/userinfo
 * Discovery: GET .well-known/openid-configuration (issuer: https://apis.roblox.com/oauth/)
 */

const ISSUER = process.env.ROBLOX_OIDC_ISSUER ?? "https://apis.roblox.com/oauth/";

/** Trim trailing slash for base URL; no slash at end. */
function baseUrl(): string {
  const url = process.env.APP_BASE_URL ?? process.env.BASE_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return url.replace(/\/$/, "");
}

export function getRedirectUri(): string {
  return `${baseUrl()}/auth/callback`;
}

export function getAuthorizeUrl(state: string, codeChallenge: string): string {
  const clientId = process.env.ROBLOX_OAUTH_CLIENT_ID;
  if (!clientId) throw new Error("ROBLOX_OAUTH_CLIENT_ID is required");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    scope: "openid profile",
    response_type: "code",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  return `${ISSUER.replace(/\/$/, "")}v1/authorize?${params.toString()}`;
}

/** Whether to use confidential client (client_secret in token exchange). */
export function useConfidentialClient(): boolean {
  const secret = process.env.ROBLOX_OAUTH_CLIENT_SECRET;
  return Boolean(secret && secret.length > 0);
}

export function getTokenEndpoint(): string {
  return `${ISSUER.replace(/\/$/, "")}v1/token`;
}

export function getUserInfoEndpoint(): string {
  return `${ISSUER.replace(/\/$/, "")}v1/userinfo`;
}

export function getClientId(): string {
  const id = process.env.ROBLOX_OAUTH_CLIENT_ID;
  if (!id) throw new Error("ROBLOX_OAUTH_CLIENT_ID is required");
  return id;
}

export function getClientSecret(): string | undefined {
  return process.env.ROBLOX_OAUTH_CLIENT_SECRET;
}
