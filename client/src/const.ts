export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

function getOAuthPortalBase(): string | undefined {
  const raw = import.meta.env.VITE_OAUTH_PORTAL_URL?.trim();
  if (!raw || !/^https?:\/\//i.test(raw)) {
    return undefined;
  }
  return raw.replace(/\/$/, "");
}

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = (): string => {
  const oauthPortalBase = getOAuthPortalBase();
  if (oauthPortalBase) {
    const appId = import.meta.env.VITE_APP_ID ?? "";
    const redirectUri = `${window.location.origin}/api/oauth/callback`;
    const state = btoa(redirectUri);

    const url = new URL(`${oauthPortalBase}/app-auth`);
    url.searchParams.set("appId", appId);
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");

    return url.toString();
  }

  // OAuth Google direto: o servidor valida GOOGLE_CLIENT_ID — não depende do ID embutido no bundle.
  return `${window.location.origin}/api/auth/google/login`;
};
