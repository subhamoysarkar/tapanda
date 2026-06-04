const SUPABASE_URL = 'https://zkjgefkwrixevtdxrqgm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpramdlZmt3cml4ZXZ0ZHhycWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1ODI2ODYsImV4cCI6MjA5NjE1ODY4Nn0.KcrFr8FjzwjL7sDGDDq8x_NoTvTW2jk9fQ6nGTn4Aq8';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

window.supabaseClient = supabase;
