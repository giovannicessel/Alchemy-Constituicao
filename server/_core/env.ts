function trimEnv(value: string | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "local-app",
  cookieSecret: trimEnv(process.env.JWT_SECRET) || "dev-local-secret-change-me",
  databaseUrl: trimEnv(process.env.DATABASE_URL),
  oAuthServerUrl: trimEnv(process.env.OAUTH_SERVER_URL),
  ownerOpenId: trimEnv(process.env.OWNER_OPEN_ID),
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: trimEnv(process.env.BUILT_IN_FORGE_API_URL),
  forgeApiKey: trimEnv(process.env.BUILT_IN_FORGE_API_KEY),
  googleClientId: trimEnv(process.env.GOOGLE_CLIENT_ID),
  googleClientSecret: trimEnv(process.env.GOOGLE_CLIENT_SECRET),
  /** Tem de coincidir com o usado em `api/google-login.ts` (trim); espaços na Vercel quebravam só o callback. */
  googleRedirectUri: trimEnv(process.env.GOOGLE_REDIRECT_URI),
};
