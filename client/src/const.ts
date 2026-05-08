export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

function getOAuthPortalBase(): string | undefined {
  const raw = import.meta.env.VITE_OAUTH_PORTAL_URL?.trim();
  if (!raw || !/^https?:\/\//i.test(raw)) {
    return undefined;
  }
  return raw.replace(/\/$/, "");
}

function hasGoogleOAuthConfig(): boolean {
  return Boolean(import.meta.env.GOOGLE_CLIENT_ID || import.meta.env.VITE_GOOGLE_CLIENT_ID);
}

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = (): string => {
  if (hasGoogleOAuthConfig()) {
    return `${window.location.origin}/api/auth/google/login`;
  }
  const oauthPortalBase = getOAuthPortalBase();
  const appId = import.meta.env.VITE_APP_ID ?? "";
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  if (!oauthPortalBase) {
    return `${window.location.origin}/`;
  }

  const url = new URL(`${oauthPortalBase}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
