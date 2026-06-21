import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

console.log('--- BUET Student Portal Promote User Script ---');

const envPath = path.resolve(process.cwd(), '.env.local');
let supabaseUrl = process.env.VITE_SUPABASE_URL;
let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      if (key === 'VITE_SUPABASE_URL') supabaseUrl = val;
      if (key === 'SUPABASE_SERVICE_ROLE_KEY') serviceRoleKey = val;
    }
  });
}

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: Supabase configuration missing. Ensure environment variables or .env.local are configured.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const targetEmail = '2508059@ipe.buet.ac.bd';

async function promoteUser() {
  console.log(`Searching for user with email ${targetEmail} in auth.users...`);
  
  // Find user by listing users in batches
  let targetUser = null;
  let page = 1;
  const perPage = 50;
  
  while (true) {
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({
      page: page,
      perPage: perPage
    });
    
    if (listError) {
      console.error('Error listing users:', listError.message);
      process.exit(1);
    }
    
    if (!users || users.length === 0) {
      break;
    }
    
    console.log(`Checking page ${page} containing ${users.length} users...`);
    const found = users.find(u => u.email === targetEmail);
    if (found) {
      targetUser = found;
      break;
    }
    
    if (users.length < perPage) {
      break;
    }
    page++;
  }
  
  if (!targetUser) {
    console.error(`User with email ${targetEmail} not found in Auth!`);
    process.exit(1);
  }

  console.log(`Found User ID: ${targetUser.id}. Promoting to 'admin' in public.profiles...`);

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', targetUser.id);

  if (updateError) {
    console.error('Error updating profile role:', updateError.message);
    process.exit(1);
  }

  console.log(`Successfully promoted ${targetEmail} (ID: ${targetUser.id}) to admin role!`);
}

promoteUser();
