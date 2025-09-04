# Authentication Debug Guide

## Quick Login Test Steps

### Step 1: Check Console Logs
When you attempt to login, check your development console for these specific log messages:

```
[AuthService] SignIn attempt for email: your-email@demo.com
[AuthService] Password length: 11
[AuthService] Email trimmed: your-email@demo.com
[AuthService] Supabase auth response: { user: 'user-id', session: true/false, error: null/error }
```

### Step 2: Common Issues & Solutions

#### Issue 1: "Invalid login credentials"
**Possible Causes:**
- Account doesn't exist in Supabase Auth
- Email not confirmed (check email for confirmation link)
- Wrong password
- Email case sensitivity

**Solution:**
```bash
# Check if you can create the account first
# Go to your app's signup screen and try creating the account
# Check your email for confirmation link
```

#### Issue 2: Email Confirmation Required
**Symptoms:** Login fails with "Email not confirmed"
**Solution:** Check your email inbox for Supabase confirmation email

#### Issue 3: Account Exists but No Profile
**Symptoms:** Login succeeds but app crashes or shows errors
**Solution:** Profile needs to be created in database

### Step 3: Manual Account Creation

If demo accounts don't exist, create them manually:

1. **Go to Supabase Dashboard** → Authentication → Users
2. **Create new user** with:
   - Email: `dr.rajesh.medical@demo.com`
   - Password: `password123`
   - Auto Confirm: ✅ (important!)

3. **Go to Table Editor** → profiles table
4. **Insert new row**:
   ```sql
   id: [user-id-from-auth]
   email: dr.rajesh.medical@demo.com
   name: Dr. Rajesh Patel
   role: volunteer
   skills: ["medical", "first_aid"]
   is_active: true
   volunteer_status: available
   ```

### Step 4: Test Environment Variables

Check your `.env` file or app.config.js:

```javascript
// Should have these values
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Step 5: Debug Commands

Run these in your development environment:

```bash
# Clear Expo cache
npx expo start --clear

# Check environment variables are loaded
console.log(process.env.EXPO_PUBLIC_SUPABASE_URL)
```

### Step 6: Quick Fix - Reset Password

If account exists but password doesn't work:

1. Go to Supabase Dashboard → Authentication → Users
2. Find the user
3. Click "Send password reset email"
4. Use the reset link to set a new password
5. Try logging in with the new password

## Expected Console Output for Successful Login:

```
[AuthService] SignIn attempt for email: dr.rajesh.medical@demo.com
[AuthService] Password length: 11
[AuthService] Email trimmed: dr.rajesh.medical@demo.com
[AuthService] Supabase auth response: { user: 'abc123...', session: true, error: null }
[AuthService] Device registered: device-id-123
```

## Expected Console Output for Failed Login:

```
[AuthService] SignIn attempt for email: dr.rajesh.medical@demo.com
[AuthService] Password length: 11
[AuthService] Email trimmed: dr.rajesh.medical@demo.com
[AuthService] Supabase auth response: { user: null, session: false, error: [Error Object] }
[AuthService] Auth error details: {
  message: "Invalid login credentials",
  status: 400,
  code: "invalid_credentials"
}
```

## Next Steps:

1. Try logging in and check console for the exact error
2. Share the console output so I can identify the specific issue
3. If needed, we'll create the demo accounts manually in Supabase
