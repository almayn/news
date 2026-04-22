import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("supabaseUrl is required.");
}

if (!supabaseServiceKey) {
  throw new Error("supabaseKey is required.");
}

export const supabaseServer = createClient(
  supabaseUrl,
  supabaseServiceKey
);