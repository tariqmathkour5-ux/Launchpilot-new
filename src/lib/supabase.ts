import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Public client — safe to use in browser with anon key
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-only client — uses service role key for privileged operations.
// Never call this from client components.
export function createServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = serviceRoleKey ?? supabaseAnonKey;
  return createClient(supabaseUrl, key, {
    auth: { persistSession: false },
  });
}

