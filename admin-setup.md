# Admin Account Setup

## Creating the Admin Account

To create the admin account for the E-Learning Recommendation System, follow these steps:

### Option 1: Manual Admin Creation via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to Authentication > Users
3. Click "Add User" 
4. Create user with these credentials:
   - **Email**: `admin@elearning.com`
   - **Password**: `AdminPass123!`
5. After creating the user, go to SQL Editor and run:

```sql
UPDATE public.profiles 
SET role = 'admin'::user_role 
WHERE email = 'admin@elearning.com';
```

### Option 2: Sign Up Through the App

1. Go to the sign-up page
2. Register with:
   - **Email**: `admin@elearning.com`
   - **Password**: `AdminPass123!`
   - **First Name**: System
   - **Last Name**: Administrator
3. After registration, run this SQL query in Supabase SQL Editor:

```sql
UPDATE public.profiles 
SET role = 'admin'::user_role 
WHERE email = 'admin@elearning.com';
```

## Admin Credentials

- **Email**: `admin@elearning.com`
- **Password**: `AdminPass123!`

## Admin Features Available

Once logged in as admin, you'll have access to:

1. **Admin Dashboard** - Comprehensive system overview
2. **User Management** - View, edit, and manage all users
3. **Analytics** - System usage statistics and reports
4. **Content Management** - Access to all books and learning materials
5. **Role Management** - Change user roles between Student and Admin

## Security Notes

- Change the admin password after first login
- The admin account has full system access
- Regular users are automatically created as "Student" role
- Only admins can change user roles and access admin features