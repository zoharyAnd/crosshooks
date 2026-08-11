// Public VAPID key — safe to ship to the browser. In a real app this usually
// comes from an env var (e.g. NEXT_PUBLIC_VAPID_KEY); it's hardcoded here so the
// hosted demo works with zero configuration. The matching *private* key — only
// needed by a server that actually sends push messages — is intentionally not
// part of this repo.
export const VAPID_PUBLIC_KEY =
  'BPhkg-GsqX_M9yuGGpjgywnVtZtsMJ-Vn0oLM5b9_jUU9W0-TteetZgW8GfLvdD4NIv43xypWZ1ZjJNjBmkEzzM';
