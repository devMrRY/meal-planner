import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const MISSING_MSG =
  'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in the .env file. Supabase client is not configured.';

let supabase: any;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(MISSING_MSG);
  // Provide a proxy that throws a clear error when any method is accessed.
  supabase = new Proxy(
    {},
    {
      get() {
        throw new Error(MISSING_MSG);
      }
    }
  );
} else {
  console.log('[Supabase] Initializing Supabase client');
  supabase = createClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string);
  console.log('[Supabase] Client created successfully');
}

export { supabase };

export type DbRecipe = {
  id: string;
  title: string;
  summary?: string;
  image?: string;
  description?: string;
  ingredients?: string[];
  steps?: string[];
  category?: string;
  subcategory?: string;
  is_deleted?: boolean;
  isDeleted?: boolean;
  created_by?: string | null;
  created_at?: string | null;
};
