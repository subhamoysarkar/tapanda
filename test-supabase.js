const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://zkjgefkwrixevtdxrqgm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpramdlZmt3cml4ZXZ0ZHhycWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1ODI2ODYsImV4cCI6MjA5NjE1ODY4Nn0.KcrFr8FjzwjL7sDGDDq8x_NoTvTW2jk9fQ6nGTn4Aq8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSupabase() {
  console.log('Testing DB select...');
  const { data: dbData, error: dbErr } = await supabase.from('projects_store').select('*');
  console.log('DB Result:', dbErr || dbData);

  console.log('\nTesting Storage bucket list...');
  const { data: buckets, error: bucketErr } = await supabase.storage.listBuckets();
  console.log('Buckets Result:', bucketErr || buckets);

  console.log('\nTesting Storage upload...');
  const { data: uploadData, error: uploadErr } = await supabase.storage.from('portfolio').upload('test/test.txt', 'hello world', { upsert: true });
  console.log('Upload Result:', uploadErr || uploadData);
}

testSupabase();
