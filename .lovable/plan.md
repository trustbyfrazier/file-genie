

## Plan: Add Password Reset Flow

The Auth page currently has no "Forgot password?" option, and there's no `/reset-password` page. Two things are needed:

### Step 1: Add "Forgot Password" to Auth page (`src/pages/Auth.tsx`)
- Add a third view state: `login`, `signup`, `forgot`
- In `forgot` mode, show only the email field with a "Send reset link" button
- Call `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' })`
- Add a "Forgot password?" link below the sign-in button
- Show success toast: "Check your email for a password reset link"

### Step 2: Add `resetPasswordForEmail` to auth hook (`src/hooks/useAuth.tsx`)
- Add a `resetPassword(email: string)` method that calls `supabase.auth.resetPasswordForEmail`
- Expose it from the context

### Step 3: Create Reset Password page (`src/pages/ResetPassword.tsx`)
- New page at `/reset-password`
- Detects `type=recovery` in URL hash (Supabase redirect)
- Shows a form with new password + confirm password fields
- Calls `supabase.auth.updateUser({ password })` to set the new password
- On success, redirects to `/dashboard`

### Step 4: Add route (`src/App.tsx`)
- Add `<Route path="/reset-password" element={<ResetPassword />} />`

### Technical Details
- Uses existing `ThreeBackground`, `Logo`, and UI components for consistent styling
- The reset password page must be a public route (not behind auth guard)
- Supabase handles the email sending and token verification automatically

