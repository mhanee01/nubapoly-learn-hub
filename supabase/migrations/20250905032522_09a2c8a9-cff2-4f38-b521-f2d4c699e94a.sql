-- Fix RLS policies to explicitly deny anonymous access and strengthen security

-- Drop existing problematic RLS policies and recreate them with explicit anonymous denial
DROP POLICY IF EXISTS "Lecturers and admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create secure policies for profiles table that explicitly deny anonymous access
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Lecturers and admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('lecturer', 'admin')
  )
);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Ensure anonymous users are completely blocked from profiles
CREATE POLICY "Deny anonymous access to profiles" 
ON public.profiles 
FOR ALL 
TO anon 
USING (false);

-- Fix other sensitive tables to explicitly deny anonymous access

-- Enrollments table - protect academic records
CREATE POLICY "Deny anonymous access to enrollments" 
ON public.enrollments 
FOR ALL 
TO anon 
USING (false);

-- Submissions table - protect grades and submissions
CREATE POLICY "Deny anonymous access to submissions" 
ON public.submissions 
FOR ALL 
TO anon 
USING (false);

-- Learning materials table - protect course content
CREATE POLICY "Deny anonymous access to learning materials" 
ON public.learning_materials 
FOR ALL 
TO anon 
USING (false);

-- Assignments table - protect assignment details
CREATE POLICY "Deny anonymous access to assignments" 
ON public.assignments 
FOR ALL 
TO anon 
USING (false);

-- Announcements table - protect course announcements
CREATE POLICY "Deny anonymous access to announcements" 
ON public.announcements 
FOR ALL 
TO anon 
USING (false);

-- Forum discussions and replies - protect forum content
CREATE POLICY "Deny anonymous access to forum discussions" 
ON public.forum_discussions 
FOR ALL 
TO anon 
USING (false);

CREATE POLICY "Deny anonymous access to forum replies" 
ON public.forum_replies 
FOR ALL 
TO anon 
USING (false);

-- Ensure courses table is properly secured (allow public viewing of active courses only)
DROP POLICY IF EXISTS "Anyone can view active courses" ON public.courses;
CREATE POLICY "Authenticated users can view active courses" 
ON public.courses 
FOR SELECT 
TO authenticated 
USING (is_active = true);

CREATE POLICY "Deny anonymous access to courses" 
ON public.courses 
FOR ALL 
TO anon 
USING (false);