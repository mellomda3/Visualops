import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isDemoMode =
  !url ||
  !anonKey ||
  url.includes('YOUR_PROJECT') ||
  anonKey.includes('YOUR_ANON_KEY')

export const supabase: SupabaseClient | null = isDemoMode
  ? null
  : createClient(url!, anonKey!)
