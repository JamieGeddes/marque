/**
 * Resolve a public/ asset against Vite's base URL. Needed because runtime
 * string paths (GLBs, HDRI, troika fonts) are not rewritten at build time
 * the way HTML/CSS references are — and GitHub Pages serves the app from
 * a /<repo>/ subpath.
 */
export function assetUrl(path: string): string {
  return import.meta.env.BASE_URL + path.replace(/^\//, '')
}
