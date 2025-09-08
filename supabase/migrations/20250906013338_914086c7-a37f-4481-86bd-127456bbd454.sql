-- Fix infinite recursion in profiles RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Lecturers and admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create simplified, non-recursive policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create a security definer function to check if user is lecturer/admin without recursion
CREATE OR REPLACE FUNCTION public.is_lecturer_or_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE user_id = check_user_id 
    AND role IN ('lecturer', 'admin')
  );
$$;

-- Create policy for lecturers and admins to view all profiles (using the function)
CREATE POLICY "Lecturers and admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR public.is_lecturer_or_admin(auth.uid())
);