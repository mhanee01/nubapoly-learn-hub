import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, Clock, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface Course {
  id: string;
  title: string;
  code: string;
  description: string;
  credits: number;
  is_active: boolean;
  lecturer_id: string;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

export default function Courses() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([]);

  useEffect(() => {
    fetchCourses();
    if (profile?.role === 'student') {
      fetchEnrolledCourses();
    }
  }, [profile]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          profiles:lecturer_id (
            first_name,
            last_name
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: "Error",
        description: "Failed to load courses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrolledCourses = async () => {
    if (!profile) return;
    
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('student_id', profile.id)
        .eq('status', 'active');

      if (error) throw error;
      setEnrolledCourses(data?.map(e => e.course_id) || []);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    }
  };

  const enrollInCourse = async (courseId: string) => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('enrollments')
        .insert({
          student_id: profile.id,
          course_id: courseId,
          status: 'active'
        });

      if (error) throw error;

      setEnrolledCourses([...enrolledCourses, courseId]);
      toast({
        title: "Success",
        description: "Successfully enrolled in course",
      });
    } catch (error) {
      console.error('Error enrolling in course:', error);
      toast({
        title: "Error",
        description: "Failed to enroll in course",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Available Courses</h1>
        <p className="text-muted-foreground">
          Browse and enroll in available courses
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => {
          const isEnrolled = enrolledCourses.includes(course.id);
          
          return (
            <Card key={course.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                    <CardDescription className="font-mono text-sm">
                      {course.code}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">{course.credits} Credits</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {course.description}
                </p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Instructor: {course.profiles?.first_name} {course.profiles?.last_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Created: {new Date(course.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {profile?.role === 'student' && (
                  <div className="flex gap-2">
                    {isEnrolled ? (
                      <Badge className="w-full justify-center">Enrolled</Badge>
                    ) : (
                      <Button 
                        onClick={() => enrollInCourse(course.id)}
                        className="w-full"
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        Enroll
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {courses.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No courses available</h3>
            <p className="text-muted-foreground text-center">
              There are currently no active courses to display.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}