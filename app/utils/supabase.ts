import { createBrowserClient } from '@supabase/ssr';

// These will be replaced with actual environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

// Create client for browser
export const supabase = createBrowserClient(supabaseUrl, supabaseKey); 