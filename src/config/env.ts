/**
 * Which copy of the portal this is. Set by VITE_APP_ENV on each Vercel project:
 *   production → https://dis.hiteffect.store, the real one
 *   uat        → https://dis-uat.hiteffect.store, for testing changes before they go to production
 * `npm run dev` and builds without it count as local.
 */
export type AppEnv = 'production' | 'uat' | 'local'

const raw = import.meta.env.VITE_APP_ENV
export const APP_ENV: AppEnv = raw === 'production' || raw === 'uat' ? raw : 'local'

/** The backend each environment talks to, including the /api prefix. */
export const BACKEND_URL: Record<AppEnv, string> = {
  production: 'https://hiteffect-dis-backend-prod.vercel.app/api',
  uat: 'https://hiteffect-dis-backend.vercel.app/api',
  // The Vite dev server forwards /api to the local backend on localhost:3000 (see vite.config.ts).
  local: import.meta.env.DEV ? '/api' : 'https://hiteffect-dis-backend.vercel.app/api',
}
