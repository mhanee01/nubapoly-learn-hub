-- Remove lecturer role and update to auto-approve students
-- Update user_role enum to only have 'student' and 'admin'
ALTER TYPE user_role RENAME TO user_role_old;
CREATE TYPE user_role AS ENUM ('student', 'admin');

-- Update profiles table to use new enum, converting any lecturers to students
ALTER TABLE profiles ALTER COLUMN role DROP DEFAULT;
ALTER TABLE profiles ALTER COLUMN role TYPE user_role USING 
  CASE 
    WHEN role::text = 'lecturer' THEN 'student'::user_role
    WHEN role::text = 'admin' THEN 'admin'::user_role
    ELSE 'student'::user_role
  END;
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'student'::user_role;

-- Update the handle_new_user function to auto-approve all students
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
$function$;

-- Drop old enum
DROP TYPE user_role_old;