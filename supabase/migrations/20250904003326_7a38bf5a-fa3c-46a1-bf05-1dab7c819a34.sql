-- Add missing RLS policies for assignments
CREATE POLICY "Students can view assignments for enrolled courses"
ON public.assignments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.enrollments e 
    JOIN public.profiles p ON p.id = e.student_id
    WHERE p.user_id = auth.uid() 
    AND e.course_id = assignments.course_id
  )
);

CREATE POLICY "Lecturers can manage assignments for their courses"
ON public.assignments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.courses c 
    JOIN public.profiles p ON p.id = c.lecturer_id
    WHERE p.user_id = auth.uid() 
    AND c.id = course_id
  )
);

-- Add missing RLS policies for submissions
CREATE POLICY "Students can view their own submissions"
ON public.submissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.id = student_id
  )
);

CREATE POLICY "Students can create their own submissions"
ON public.submissions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.id = student_id
  )
);

CREATE POLICY "Lecturers can view and grade submissions for their courses"
ON public.submissions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.assignments a
    JOIN public.courses c ON c.id = a.course_id
    JOIN public.profiles p ON p.id = c.lecturer_id
    WHERE p.user_id = auth.uid() 
    AND a.id = assignment_id
  )
);

-- Add missing RLS policies for learning materials
CREATE POLICY "Students can view materials for enrolled courses"
ON public.learning_materials FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.enrollments e 
    JOIN public.profiles p ON p.id = e.student_id
    WHERE p.user_id = auth.uid() 
    AND e.course_id = learning_materials.course_id
  )
);

CREATE POLICY "Lecturers can manage materials for their courses"
ON public.learning_materials FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.courses c 
    JOIN public.profiles p ON p.id = c.lecturer_id
    WHERE p.user_id = auth.uid() 
    AND c.id = course_id
  )
);

-- Add missing RLS policies for announcements
CREATE POLICY "Students can view announcements for enrolled courses"
ON public.announcements FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.enrollments e 
    JOIN public.profiles p ON p.id = e.student_id
    WHERE p.user_id = auth.uid() 
    AND e.course_id = announcements.course_id
  )
);

CREATE POLICY "Lecturers can manage announcements for their courses"
ON public.announcements FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.courses c 
    JOIN public.profiles p ON p.id = c.lecturer_id
    WHERE p.user_id = auth.uid() 
    AND c.id = course_id
  )
);

-- Add missing RLS policies for forum discussions
CREATE POLICY "Students can view discussions for enrolled courses"
ON public.forum_discussions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.enrollments e 
    JOIN public.profiles p ON p.id = e.student_id
    WHERE p.user_id = auth.uid() 
    AND e.course_id = forum_discussions.course_id
  )
);

CREATE POLICY "Students can create discussions for enrolled courses"
ON public.forum_discussions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.enrollments e 
    JOIN public.profiles p ON p.id = e.student_id
    WHERE p.user_id = auth.uid() 
    AND e.course_id = course_id
    AND p.id = author_id
  )
);

CREATE POLICY "Lecturers can manage discussions for their courses"
ON public.forum_discussions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.courses c 
    JOIN public.profiles p ON p.id = c.lecturer_id
    WHERE p.user_id = auth.uid() 
    AND c.id = course_id
  )
);

-- Add missing RLS policies for forum replies
CREATE POLICY "Students can view replies for enrolled courses"
ON public.forum_replies FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.forum_discussions fd
    JOIN public.enrollments e ON e.course_id = fd.course_id
    JOIN public.profiles p ON p.id = e.student_id
    WHERE p.user_id = auth.uid() 
    AND fd.id = discussion_id
  )
);

CREATE POLICY "Students can create replies for enrolled courses"
ON public.forum_replies FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.forum_discussions fd
    JOIN public.enrollments e ON e.course_id = fd.course_id
    JOIN public.profiles p ON p.id = e.student_id
    WHERE p.user_id = auth.uid() 
    AND fd.id = discussion_id
    AND p.id = author_id
  )
);

CREATE POLICY "Lecturers can manage replies for their courses"
ON public.forum_replies FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.forum_discussions fd
    JOIN public.courses c ON c.id = fd.course_id
    JOIN public.profiles p ON p.id = c.lecturer_id
    WHERE p.user_id = auth.uid() 
    AND fd.id = discussion_id
  )
);