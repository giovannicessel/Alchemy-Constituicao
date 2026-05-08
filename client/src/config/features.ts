/**
 * Fluxo completo (DB + progresso + analytics) é o padrão.
 * Defina VITE_STATIC_STUDY=true apenas quando quiser forçar modo local estático.
 */
export const STATIC_STUDY_MODE =
  import.meta.env.VITE_STATIC_STUDY === "true" ||
  import.meta.env.VITE_STATIC_STUDY === "1";
