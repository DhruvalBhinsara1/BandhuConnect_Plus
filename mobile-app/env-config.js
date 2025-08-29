// Environment configuration for web builds
const config = {
  SUPABASE_URL: process.env.SUPABASE_URL || 'https://ywntkafcfuugzgcduekj.supabase.co',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3bnRrYWZjZnV1Z3pnY2R1ZWtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NjQ2MDMsImV4cCI6MjA3MjA0MDYwM30.rbKajNQ1bg4LibmwepdQf7Htx2MmzQY4DLwXZRHOVZg'
};

module.exports = config;
