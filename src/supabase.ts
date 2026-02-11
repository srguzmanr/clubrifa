import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zeickkwyubkhdtjeencz.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplaWNra3d5dWJraGR0amVlbmN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMzc5OTIsImV4cCI6MjA4NDYxMzk5Mn0.mXe_PLw_-w_Dryaw-bOAsdxAl2UpwamkI3mcY4JoYF8';

export const supabase = createClient(supabaseUrl, supabaseKey);
