import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vyrnbsybajwqajwmishy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5cm5ic3liYWp3cWFqd21pc2h5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxOTYxMTMsImV4cCI6MjA5MTc3MjExM30.hsaS7FYVMip6SxnE1YipcPrCJJxhw4THjEjN24qIKv8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
