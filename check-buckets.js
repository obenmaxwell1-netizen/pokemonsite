const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://ilrqpxstoawgimorypmz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlscnFweHN0b2F3Z2ltb3J5cG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NDc0MjEsImV4cCI6MjA5MzUyMzQyMX0.jwxGO_Q0dFDv1eSy8BgEXzD2LlMBONR48OAOcQQzbQE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  const { data, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error("Error listing buckets:", error.message);
  } else {
    console.log("Buckets:", data.map(b => b.name));
  }
}
main();
