import { createClient } from '@supabase/supabase-js';
import 'dotenv/config'
// Use non-null assertion (!) because we know these must exist for the app to run
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

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

export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Ensures required Supabase Storage buckets exist.
 * Supabase returns a misleading "row-level security" error when uploading
 * to a non-existent bucket. Call this once at server startup.
 */
export async function ensureStorageBuckets(): Promise<void> {
  const buckets = [
    { name: process.env.SUPABASE_ID_CARD_BUCKET_NAME || 'Mentivo ID-Card', isPublic: false },
    { name: process.env.SUPABASE_PROFILE_PICTURE_BUCKET_NAME || 'Mentivo Profile-Picture', isPublic: true },
  ];

  for (const bucket of buckets) {
    const { error } = await supabaseAdmin.storage.createBucket(bucket.name, {
      public: bucket.isPublic,
    });
    if (error && !error.message.includes('already exists')) {
      console.error(`[Storage] Failed to create bucket "${bucket.name}":`, error.message);
    } else if (!error) {
      console.log(`[Storage] Created bucket "${bucket.name}"`);
    } else {
      console.log(`[Storage] Bucket "${bucket.name}" already exists — OK`);
    }
  }
}