import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

console.log('--- BUET Student Portal User Pre-Provisioning Script ---');

// Parse keys from .env.local if present
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

if (!supabaseUrl) {
  console.error('Error: VITE_SUPABASE_URL is missing. Make sure it is defined in .env.local or environment variables.');
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY is missing.');
  console.log('To run this script, you must obtain your Supabase service_role key from settings (API keys) and run:');
  console.log('  Windows Powershell: $env:SUPABASE_SERVICE_ROLE_KEY="your-key-here"; node scratch/seed_users.js');
  console.log('  Or add it to your .env.local file as: SUPABASE_SERVICE_ROLE_KEY=your-key-here');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const defaultPassword = 'password123';

async function seedUsers() {
  console.log(`Initializing batch seeding of 120 users on ${supabaseUrl}...`);
  let createdCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (let i = 1; i <= 120; i++) {
    const rollSuffix = String(i).padStart(3, '0');
    const email = `2508${rollSuffix}@ipe.buet.ac.bd`;
    const studentId = `202508${rollSuffix}`;
    const fullName = `Student ${rollSuffix}`;

    try {
      // Create new user using admin credentials
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password: defaultPassword,
        email_confirm: true, // Bypass verification code triggers
        user_metadata: {
          full_name: fullName,
          student_id: studentId
        }
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('exists') || msg.includes('registered') || msg.includes('taken')) {
          console.log(`[SKIPPED] User ${rollSuffix} (${email}) already exists.`);
          skippedCount++;
        } else {
          console.error(`[FAILED] User ${rollSuffix} (${email}): ${error.message}`);
          failedCount++;
        }
      } else {
        console.log(`[CREATED] User ${rollSuffix} (${email}) - ID: ${data.user.id}`);
        createdCount++;
      }
    } catch (err) {
      console.error(`[EXCEPTION] User ${rollSuffix} (${email}):`, err.message);
      failedCount++;
    }

    // Wait slightly to avoid rate-limiting spikes
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('\n--- Seeding Process Completed ---');
  console.log(`Created: ${createdCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log(`Failed:  ${failedCount}`);
}

seedUsers();
