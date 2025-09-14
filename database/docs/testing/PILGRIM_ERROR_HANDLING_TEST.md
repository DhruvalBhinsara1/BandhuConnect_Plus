# Pilgrim App Error Handling Test Plan

**Date**: September 6, 2025  
**App**: BandhuConnect+ Pilgrim  
**Focus**: Authentication Error Handling Validation

## 🎯 **Test Setup**

### **Mock Test Accounts Created:**

1. **Valid Pilgrim**: `test.pilgrim@bandhuconnect.com` / `password123`
2. **Wrong Role (Volunteer)**: `test.volunteer@bandhuconnect.com` / `password123`
3. **Unverified Email**: `test.unverified@bandhuconnect.com` / `password123`

### **Setup Instructions:**

1. Run the mock data script: `database/testing/create_mock_test_data.sql`
2. Open the **Pilgrim app** (not volunteer/admin)
3. Navigate to the login screen

---

## 🧪 **Pilgrim-Specific Test Cases**

### **Test Case 1: Wrong Password** ❗ HIGH PRIORITY

- **Action**: Enter `test.pilgrim@bandhuconnect.com` with password `wrongpassword`
- **Expected Result**:
  - 🔴 Red error card appears
  - Title: "Sign In Failed"
  - Message: "The email or password you entered is incorrect. Please double-check and try again."
  - Dismiss button (X) works
- **What to Check**: Clear, non-accusatory error message

### **Test Case 2: Non-existent Email** ❗ HIGH PRIORITY

- **Action**: Enter `nonexistent@example.com` with any password
- **Expected Result**: Same as Test Case 1 (for security)
- **What to Check**: Consistent messaging for security

### **Test Case 3: Empty Email Field**

- **Action**: Leave email empty, enter any password, tap Sign In
- **Expected Result**:
  - 🔴 Red border around email field
  - Inline error below email: "Email address is required"
  - No main error card
  - Button remains enabled but form doesn't submit
- **What to Check**: Immediate validation feedback

### **Test Case 4: Invalid Email Format**

- **Action**: Enter `notanemail` (no @ symbol)
- **Expected Result**:
  - Inline error: "Please enter a valid email address"
  - Red border around email field
- **What to Check**: Real-time email validation

### **Test Case 5: Empty Password**

- **Action**: Enter valid email but leave password empty
- **Expected Result**:
  - Inline error: "Password is required"
  - Red border around password field
- **What to Check**: Password validation

### **Test Case 6: Short Password**

- **Action**: Enter password with 3 characters: `123`
- **Expected Result**:
  - Inline error: "Password must be at least 6 characters"
- **What to Check**: Password length validation

### **Test Case 7: Wrong Role Access** ❗ HIGH PRIORITY

- **Action**: Enter `test.volunteer@bandhuconnect.com` / `password123`
- **Expected Result**:
  - 🔴 Red error card
  - Title: "Access Denied"
  - Message: "This account is not authorized for pilgrim access. Please use the correct login portal for your account type."
  - User automatically signed out
- **What to Check**: Role-based access control

### **Test Case 8: Successful Login** ✅ VALIDATION

- **Action**: Enter `test.pilgrim@bandhuconnect.com` / `password123`
- **Expected Result**:
  - Login succeeds
  - No error messages
  - Navigates to pilgrim dashboard
- **What to Check**: Normal flow still works

### **Test Case 9: Network Error Simulation**

- **Action**: Turn off WiFi/mobile data, try to login
- **Expected Result**:
  - 🟠 Orange warning card
  - Title: "Connection Problem"
  - Message: "Please check your internet connection and try again."
- **What to Check**: Network error handling

### **Test Case 10: Error State Clearing**

- **Action**:
  1. Trigger an error (wrong password)
  2. Start typing in email field
- **Expected Result**:
  - Main error card disappears when typing starts
  - Red borders clear when fields become valid
- **What to Check**: Error state management

---

## 📱 **Visual Design Checks**

### **Error Card Appearance:**

- ✅ Appears below header, above form fields
- ✅ Has red left border for errors, orange for warnings
- ✅ Shows alert-circle icon for errors
- ✅ Has dismiss button (X) that works
- ✅ Text is readable and properly wrapped

### **Inline Error Appearance:**

- ✅ Appears directly under input fields
- ✅ Red text with alert icon
- ✅ Doesn't break layout
- ✅ Clears when field becomes valid

### **Input Field States:**

- ✅ Red border when error
- ✅ Normal border when valid
- ✅ Proper touch targets maintained

---

## 📋 **Testing Instructions**

### **For Each Test Case:**

1. **Clear app state** (restart app or logout first)
2. **Navigate to Pilgrim Login screen**
3. **Perform the test action**
4. **Take screenshot** of result
5. **Report**: ✅ PASS / ❌ FAIL / ⚠️ PARTIAL

### **Response Format:**

```
Test Case 1 (Wrong Password): ✅ PASS
- Error card appeared correctly
- Message was user-friendly
- Dismiss button worked

Test Case 3 (Empty Email): ❌ FAIL
- No red border appeared
- Inline error was missing
- [Include description of what actually happened]
```

---

## 🗑️ **Cleanup After Testing**

When testing is complete, run:

```sql
-- Remove all test data
\i database/testing/cleanup_mock_test_data.sql
```

This will remove all mock accounts and related data.

---

## 🎯 **Success Criteria**

Error handling is ready when:

- ✅ All 10 test cases pass
- ✅ No generic "Something went wrong" messages
- ✅ Visual design is consistent and professional
- ✅ Error states clear appropriately
- ✅ Normal login flow still works perfectly

**Next Steps After Testing:**

1. Fix any failing test cases
2. Apply same system to other auth screens
3. Move to location/map error handling
4. Continue with UI improvements (Option B)

Let's get this thoroughly tested! 🚀
