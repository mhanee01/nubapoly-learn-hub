-- Remove admin approval requirement for students
-- Update RLS policies to allow unapproved students to access their accounts

-- Drop existing policies that might be checking approval status
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Recreate policies without approval checks for basic profile access
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

-- Update the trigger to automatically approve students upon registration
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
    COALESCE((new.raw_user_meta_data ->> 'role')::user_role, 'student'::user_role),
    CASE 
      WHEN COALESCE((new.raw_user_meta_data ->> 'role')::user_role, 'student'::user_role) = 'student'::user_role 
      THEN true  -- Auto-approve students
      ELSE false -- Lecturers and admins still need approval
    END
  );
  RETURN new;
END;
$$;