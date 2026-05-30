import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Inicializar el cliente. Usamos placeholders en caso de que aún no se hayan configurado
// para evitar que Next.js falle en tiempo de compilación o arranque inicial.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);

/**
 * Verifica si Supabase cuenta con credenciales reales configuradas.
 * Si es falso, la aplicación usará servicios Mock interactivos en el localStorage.
 */
export const isSupabaseConfigured = (): boolean => {
  return (
    !!supabaseUrl && 
    supabaseUrl !== 'https://placeholder-project.supabase.co' && 
    !!supabaseAnonKey &&
    supabaseAnonKey !== 'placeholder-anon-key'
  );
};
