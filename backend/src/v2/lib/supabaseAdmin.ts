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
  },
  global: {
    headers: {
      Authorization: `Bearer ${supabaseServiceKey}`
    }
  }
});

export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Ensures required Supabase Storage buckets exist.
 * Supabase returns a misleading "row-level security" error when uploading
 * to a non-existent bucket. Call this once at server startup.
 */
export async function ensureStorageBuckets(): Promise<void> {
  // Test if we can list buckets - if this fails, the service role key is likely invalid or is actually an anon key
  const { data: testBuckets, error: testError } = await supabaseAdmin.storage.listBuckets();
  if (testError) {
    console.error('[Storage] ERROR: Failed to list buckets. Your SUPABASE_SERVICE_ROLE_KEY might be invalid or an anon key:', testError.message);
    // Don't throw here, let it try to create buckets just in case, but the warning is prominent
  }

  const buckets = [
    { name: process.env.SUPABASE_ID_CARD_BUCKET_NAME || 'mentor-docs', isPublic: false },
    { name: process.env.SUPABASE_PROFILE_PICTURE_BUCKET_NAME || 'mentivo-profile-pictures', isPublic: true },
  ];

  for (const bucket of buckets) {
    const { error } = await supabaseAdmin.storage.createBucket(bucket.name, {
      public: bucket.isPublic,
    });
    if (error) {
      if (error.message.includes('already exists')) {
        console.log(`[Storage] Bucket "${bucket.name}" already exists — OK`);
      } else {
        console.error(`[Storage] CRITICAL: Failed to create/verify bucket "${bucket.name}":`, error.message);
        console.error(`[Storage] This will cause "row-level security" errors during upload if the bucket doesn't exist.`);
      }
    } else {
      console.log(`[Storage] Created bucket "${bucket.name}" successfully`);
    }
  }
}