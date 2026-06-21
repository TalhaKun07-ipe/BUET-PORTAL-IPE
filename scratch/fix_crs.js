import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

console.log('--- BUET Student Portal CR Role Checker & Fixer ---');

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

// Designated CR configurations
const designatedCRs = [
  { studentId: '202508013', expectedRole: 'cr', expectedSection: 'A1', email: '2508013@ipe.buet.ac.bd' },
  { studentId: '202508037', expectedRole: 'cr', expectedSection: 'A2', email: '2508037@ipe.buet.ac.bd' },
  { studentId: '202508061', expectedRole: 'cr', expectedSection: 'B1', email: '2508061@ipe.buet.ac.bd' },
  { studentId: '202508111', expectedRole: 'cr', expectedSection: 'B2', email: '2508111@ipe.buet.ac.bd' }
];

async function checkAndFixCRs() {
  console.log('Fetching all profiles...');
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, student_id, email, role, section');

  if (error) {
    console.error('Error fetching profiles:', error.message);
    process.exit(1);
  }

  console.log(`Fetched ${profiles.length} profiles. Verifying CR assignments...`);

  for (const cr of designatedCRs) {
    const profile = profiles.find(p => p.student_id === cr.studentId || p.email === cr.email);
    
    if (!profile) {
      console.log(`[WARNING] Profile for ${cr.email} (${cr.studentId}) not found!`);
      continue;
    }

    if (profile.role !== cr.expectedRole || profile.section !== cr.expectedSection) {
      console.log(`[MISMATCH] ${cr.email}: current role='${profile.role}', section='${profile.section}' vs expected role='${cr.expectedRole}', section='${cr.expectedSection}'`);
      console.log(`Updating ${cr.email} to correct role and section...`);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          role: cr.expectedRole,
          section: cr.expectedSection
        })
        .eq('id', profile.id);

      if (updateError) {
        console.error(`[FAILED] Failed to update ${cr.email}:`, updateError.message);
      } else {
        console.log(`[SUCCESS] Correctly updated ${cr.email} to CR role and section ${cr.expectedSection}.`);
      }
    } else {
      console.log(`[CORRECT] ${cr.email} is already CR for section ${cr.expectedSection}.`);
    }
  }
}

checkAndFixCRs();
