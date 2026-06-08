const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://zkjgefkwrixevtdxrqgm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpramdlZmt3cml4ZXZ0ZHhycWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1ODI2ODYsImV4cCI6MjA5NjE1ODY4Nn0.KcrFr8FjzwjL7sDGDDq8x_NoTvTW2jk9fQ6nGTn4Aq8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  console.log("Fetching...");
  const { data, error: fetchError } = await supabase.from('projects_store').select('data').eq('id', 1).single();
  if (fetchError) {
    console.error("Fetch error:", fetchError);
    return;
  }
  console.log("Fetch success. Length of data:", JSON.stringify(data).length);
  
  console.log("Upserting...");
  const { error: upsertError } = await supabase.from('projects_store').upsert({ id: 1, data: data.data });
  if (upsertError) {
    console.error("Upsert error:", upsertError);
  } else {
    console.log("Upsert success!");
  }
}

test();
