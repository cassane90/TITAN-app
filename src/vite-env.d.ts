/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_GEMINI_API_KEY: string
  readonly VITE_GOOGLE_PLACES_API_KEY_1: string
  readonly VITE_GOOGLE_PLACES_API_KEY_2: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}