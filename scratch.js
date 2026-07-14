import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://qyzdykrihchdmwfbtypi.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5emR5a3JpaGNoZG13ZmJ0eXBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NjkwMDAsImV4cCI6MjA5OTM0NTAwMH0.p6Fh2EbHrL5VsGGPctlMkspYhXHQ-BzmiO3ukltF7NI";
const supabase = createClient(supabaseUrl, supabaseKey);

async function sendRequests() {
  const { data, error } = await supabase.from('friendships').insert([
    { sender: 'AlphaBot#9901', receiver: 'Atul#4233', status: 'pending' },
    { sender: 'BetaBot#9902', receiver: 'Atul#4233', status: 'pending' },
    { sender: 'GammaBot#9903', receiver: 'Atul#4233', status: 'pending' },
    { sender: 'DeltaBot#9904', receiver: 'Atul#4233', status: 'pending' }
  ]);
  console.log("Error:", error);
  console.log("Data inserted");
}

sendRequests();
