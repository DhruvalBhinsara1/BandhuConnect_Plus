// Debug Authentication Script for BandhuConnect+
// Run this in your development environment to test authentication

import { supabase } from './src/services/supabase.js';

const DEBUG_ACCOUNTS = [
  { email: 'dr.rajesh.medical@demo.com', password: 'password123', role: 'volunteer' },
  { email: 'ramesh.elderly@demo.com', password: 'password123', role: 'pilgrim' },
  { email: 'admin@bandhuconnect.com', password: 'admin123', role: 'admin' }
];

async function debugAuth() {
  console.log('🔍 Starting Authentication Debug...\n');
  
  // Test Supabase connection
  console.log('1. Testing Supabase Connection...');
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return;
    }
    console.log('✅ Supabase connection successful\n');
  } catch (error) {
    console.error('❌ Supabase connection error:', error.message);
    return;
  }

  // Test each demo account
  for (const account of DEBUG_ACCOUNTS) {
    console.log(`2. Testing login for ${account.email}...`);
    
    try {
      // First check if user exists in auth.users
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: account.email.trim().toLowerCase(),
        password: account.password,
      });

      if (authError) {
        console.error(`❌ Auth failed for ${account.email}:`, {
          message: authError.message,
          status: authError.status,
          code: authError.code
        });
        
        // Check if account exists but isn't confirmed
        if (authError.message?.includes('Invalid login credentials')) {
          console.log(`🔍 Checking if account exists in database...`);
          
          // This won't work due to RLS, but we can try
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('email, role')
              .eq('email', account.email.trim().toLowerCase())
              .single();
              
            if (profileData) {
              console.log(`📧 Profile exists: ${profileData.email} (${profileData.role})`);
              console.log(`❗ Possible causes:`);
              console.log(`   - Account not confirmed via email`);
              console.log(`   - Password mismatch`);
              console.log(`   - Account disabled`);
            }
          } catch (profileError) {
            console.log(`❓ Cannot check profile due to RLS policies`);
          }
        }
        
        console.log('');
        continue;
      }

      console.log(`✅ Login successful for ${account.email}`);
      console.log(`   User ID: ${authData.user?.id}`);
      console.log(`   Email confirmed: ${authData.user?.email_confirmed_at ? 'Yes' : 'No'}`);
      
      // Check profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();
        
      if (profileError) {
        console.error(`❌ Profile fetch failed:`, profileError.message);
      } else {
        console.log(`✅ Profile found: ${profile.name} (${profile.role})`);
      }
      
      // Sign out
      await supabase.auth.signOut();
      console.log('');
      
    } catch (error) {
      console.error(`❌ Unexpected error for ${account.email}:`, error.message);
      console.log('');
    }
  }

  // Test account creation
  console.log('3. Testing account creation...');
  const testEmail = `test-${Date.now()}@demo.com`;
  const testPassword = 'testpass123';
  
  try {
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    if (signupError) {
      console.error('❌ Signup failed:', signupError.message);
    } else {
      console.log('✅ Signup successful');
      console.log(`   User ID: ${signupData.user?.id}`);
      console.log(`   Email confirmation required: ${!signupData.session ? 'Yes' : 'No'}`);
      
      // Try to create profile if session exists
      if (signupData.session) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: signupData.user.id,
            email: testEmail,
            name: 'Test User',
            role: 'pilgrim'
          }])
          .select()
          .single();
          
        if (profileError) {
          console.error('❌ Profile creation failed:', profileError.message);
        } else {
          console.log('✅ Profile created successfully');
        }
      }
    }
  } catch (error) {
    console.error('❌ Signup error:', error.message);
  }

  console.log('\n🔍 Debug complete. Check the logs above for issues.');
  console.log('\n💡 Common solutions:');
  console.log('   1. Ensure demo accounts are created and email-confirmed');
  console.log('   2. Check Supabase Auth settings (email confirmation, etc.)');
  console.log('   3. Verify RLS policies allow profile access');
  console.log('   4. Check for typos in email/password');
  console.log('   5. Clear app storage/cache and try again');
}

// Run the debug
debugAuth().catch(console.error);
