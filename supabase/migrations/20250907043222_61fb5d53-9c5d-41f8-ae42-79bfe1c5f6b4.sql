-- Remove lecturer role and lecturer-specific functionality
-- This app is now student-only

-- Drop all lecturer-related tables and their dependencies
DROP TABLE IF EXISTS learning_materials CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS forum_replies CASCADE;
DROP TABLE IF EXISTS forum_discussions CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS courses CASCADE;

-- Drop all functions that depend on user_role first
DROP FUNCTION IF EXISTS is_lecturer_or_admin(uuid);
DROP FUNCTION IF EXISTS get_user_role(uuid);

-- First remove the default constraint on role column
ALTER TABLE profiles ALTER COLUMN role DROP DEFAULT;

-- Update user_role enum to only include student and admin
ALTER TYPE user_role RENAME TO user_role_old;
CREATE TYPE user_role AS ENUM ('student', 'admin');

-- Update profiles table to use new enum
ALTER TABLE profiles 
ALTER COLUMN role TYPE user_role USING 
CASE 
  WHEN role::text = 'lecturer' THEN 'admin'::user_role
  ELSE role::text::user_role
END;

-- Set new default for role column
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'student'::user_role;

-- Drop old enum with cascade
DROP TYPE user_role_old CASCADE;

-- Create new simplified function for admin check
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE user_id = check_user_id 
    AND role = 'admin'
  );
$$;

-- Update handle_new_user function for student-only app
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    email,
    first_name,
    last_name,
    role,
    is_approved
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(new.raw_user_meta_data ->> 'last_name', ''),
    'student'::user_role,
    true -- Auto-approve all students
  );
  RETURN new;
END;
$$;