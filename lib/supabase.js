import { createClient } from '@supabase/supabase-js';

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL  || 'https://vwwdmzdknmdsiowmjkzf.supabase.co';
const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3d2RtemRrbm1kc2lvd21qa3pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNTYyMDksImV4cCI6MjA5NTczMjIwOX0.6ARLv36BVAiD0MP1MZRJ6WZ5DTqtP82F1NkJ_6W2GEE';

export const supabase = createClient(url, key);
