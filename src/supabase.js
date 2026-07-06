import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Czy aplikacja ma komplet danych do połączenia z Supabase.
export const isConfigured = Boolean(url && anonKey)

// Klucz "anon" (publishable) jest PUBLICZNY z założenia — trafia do przeglądarki
// i to jest OK. Bezpieczeństwo zapewniają polityki RLS w bazie (patrz
// supabase/schema.sql), a NIE ukrywanie tego klucza. Klucza "service_role"
// nigdy nie umieszczamy we froncie.
export const supabase = isConfigured ? createClient(url, anonKey) : null
