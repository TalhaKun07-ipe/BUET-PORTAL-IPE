import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

console.log('--- BUET Student Portal Section and CR Audit & Fix ---');

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

// Helper function to resolve expected section from Roll number
function getExpectedSection(rollNum) {
  if (rollNum >= 1 && rollNum <= 30) return 'A1';
  if (rollNum >= 31 && rollNum <= 60) return 'A2';
  if (rollNum >= 61 && rollNum <= 90) return 'B1';
  if (rollNum >= 91 && rollNum <= 120) return 'B2';
  return null;
}

// Designated CR configurations
const designatedCRs = {
  '202508013': { role: 'cr', section: 'A1' },
  '202508037': { role: 'cr', section: 'A2' },
  '202508061': { role: 'cr', section: 'B1' },
  '202508111': { role: 'cr', section: 'B2' }
};

async function auditAndFix() {
  console.log('Fetching all profiles...');
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, student_id, email, role, section');

  if (error) {
    console.error('Error fetching profiles:', error.message);
    process.exit(1);
  }

  // Filter out any admin/non-student account if needed, but let's count 120 student accounts specifically
  const studentProfiles = profiles.filter(p => p.student_id && p.student_id.startsWith('202508'));
  console.log(`\nAudit Summary:\nTotal accounts found: ${profiles.length}`);
  console.log(`Total BUET IPE '25 student profiles: ${studentProfiles.length}`);

  let mismatchesFound = 0;
  let fixedCount = 0;

  for (const profile of studentProfiles) {
    const rollMatch = profile.student_id.match(/202508(\d{3})/);
    if (!rollMatch) continue;

    const rollNum = parseInt(rollMatch[1], 10);
    const expectedSection = getExpectedSection(rollNum);
    
    // Check if this student is a designated CR
    const isCR = designatedCRs[profile.student_id];
    let expectedRole = 'student';
    
    // Check if they are a known administrator (skip overriding admin role to cr/student if already set to admin)
    if (profile.role === 'admin') {
      expectedRole = 'admin';
    } else if (isCR) {
      expectedRole = 'cr';
    }

    const sectionMismatch = profile.section !== expectedSection;
    const roleMismatch = profile.role !== expectedRole;

    if (sectionMismatch || roleMismatch) {
      mismatchesFound++;
      console.log(`[MISMATCH] ${profile.email} (${profile.student_id}): current role='${profile.role}', section='${profile.section}' vs expected role='${expectedRole}', section='${expectedSection}'`);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          role: expectedRole,
          section: expectedSection
        })
        .eq('id', profile.id);

      if (updateError) {
        console.error(`[FAILED] Failed to update ${profile.email}:`, updateError.message);
      } else {
        fixedCount++;
      }
    }
  }

  console.log(`\nAudit Complete:`);
  console.log(`Mismatches found: ${mismatchesFound}`);
  console.log(`Profiles successfully fixed: ${fixedCount}`);
}

auditAndFix();
