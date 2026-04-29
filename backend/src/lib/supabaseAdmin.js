import { createClient } from '@supabase/supabase-js';
import 'dotenv/config'
// Use non-null assertion (!) because we know these must exist for the app to run
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * WARNING: This client bypasses Row Level Security (RLS).
 * Use only in the backend. Never expose to the frontend.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});