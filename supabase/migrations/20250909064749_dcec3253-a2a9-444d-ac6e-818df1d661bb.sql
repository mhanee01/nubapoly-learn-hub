-- Re-add role system for admin/student functionality
CREATE TYPE public.user_role AS ENUM ('student', 'admin');

-- Add role column back to profiles
ALTER TABLE public.profiles 
ADD COLUMN role user_role NOT NULL DEFAULT 'student';

-- Create is_admin function
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE user_id = check_user_id 
    AND role = 'admin'
  );
$$;

-- Update handle_new_user function to include role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- Update RLS policies to include admin access
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING ((auth.uid() = user_id) OR is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING ((auth.uid() = user_id) OR is_admin(auth.uid()))
WITH CHECK ((auth.uid() = user_id) OR is_admin(auth.uid()));

-- Create predefined admin account
-- First, insert into auth.users (this will be handled by the signup process)
-- We'll create a profile for admin with a specific user_id that we'll use
INSERT INTO public.profiles (
  user_id,
  email,
  first_name,
  last_name,
  role,
  is_approved
) VALUES (
  '00000000-0000-0000-0000-000000000001', -- Placeholder UUID for admin
  'admin@elearning.com',
  'System',
  'Administrator',
  'admin'::user_role,
  true
) ON CONFLICT (user_id) DO NOTHING;