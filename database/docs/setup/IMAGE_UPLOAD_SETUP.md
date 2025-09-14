# Image Upload Setup Guide

## Issues Fixed

### 1. Storage Service Implementation
- **Problem**: React Native blob handling incompatibility with Supabase
- **Solution**: Updated to use ArrayBuffer for reliable file uploads
- **Changes**: Modified `storageService.uploadImage()` method

### 2. Database Storage Configuration
- **Problem**: Missing storage bucket and RLS policies
- **Solution**: Created comprehensive storage setup script
- **File**: `database/fix-storage-complete.sql`

### 3. Error Handling
- **Problem**: Generic error messages made debugging difficult
- **Solution**: Added specific error handling for common issues
- **Features**: Authentication checks, file validation, detailed logging

## Setup Instructions

### Step 1: Run Database Setup
Execute the following SQL script in your Supabase dashboard:

```sql
-- Run this in Supabase SQL Editor
\i database/fix-storage-complete.sql
```

Or copy and paste the contents of `database/fix-storage-complete.sql` into the SQL Editor.

### Step 2: Verify Storage Bucket
After running the script, verify in Supabase dashboard:
1. Go to Storage section
2. Check that `request-photos` bucket exists
3. Verify it's set to public
4. Check file size limit is 10MB

### Step 3: Test Upload Functionality
1. Open the app and navigate to Create Request
2. Tap "Add Photo" 
3. Select image from gallery or take photo
4. Submit the request
5. Check console logs for detailed upload progress

## Key Improvements

### Storage Service (`src/services/storageService.ts`)
- Uses ArrayBuffer for React Native compatibility
- Includes user ID in filename for uniqueness
- Better error handling with specific messages
- Comprehensive logging for debugging

### Database Setup (`database/fix-storage-complete.sql`)
- Creates `request-photos` bucket with proper configuration
- Sets up RLS policies for authenticated uploads
- Allows public read access for image display
- Includes verification queries

## Troubleshooting

### Common Errors

1. **"Storage permissions error"**
   - Run the database setup script
   - Check RLS policies in Supabase dashboard

2. **"Storage bucket not found"**
   - Verify bucket creation in Supabase Storage
   - Check bucket name matches 'request-photos'

3. **"User not authenticated"**
   - Ensure user is logged in
   - Check authentication in app

4. **"Failed to read image file"**
   - Check image picker permissions
   - Verify image URI is valid

### Debug Steps
1. Check console logs for detailed error messages
2. Verify Supabase connection and authentication
3. Test with different image formats (JPG, PNG)
4. Check network connectivity

## File Structure
```
src/services/storageService.ts     # Updated upload implementation
database/fix-storage-complete.sql # Database setup script
src/screens/pilgrim/CreateRequest.tsx # Uses storage service
```

## Next Steps
- Test with various image sizes and formats
- Monitor upload performance
- Consider adding image compression for large files
- Implement progress indicators for uploads
