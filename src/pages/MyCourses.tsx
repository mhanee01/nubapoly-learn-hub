import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, Calendar, Plus, Settings } from 'lucide-react';
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
  created_at: string;
  _count?: {
    enrollments: number;
    assignments: number;
  };
}

export default function MyCourses() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyCourses();
  }, [profile]);

  const fetchMyCourses = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('lecturer_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch enrollment and assignment counts for each course
      const coursesWithCounts = await Promise.all(
        (data || []).map(async (course) => {
          const [enrollmentsResult, assignmentsResult] = await Promise.all([
            supabase
              .from('enrollments')
              .select('id', { count: 'exact' })
              .eq('course_id', course.id)
              .eq('status', 'active'),
            supabase
              .from('assignments')
              .select('id', { count: 'exact' })
              .eq('course_id', course.id)
          ]);

          return {
            ...course,
            _count: {
              enrollments: enrollmentsResult.count || 0,
              assignments: assignmentsResult.count || 0,
            }
          };
        })
      );

      setCourses(coursesWithCounts);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: "Error",
        description: "Failed to load your courses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleCourseStatus = async (courseId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ is_active: !currentStatus })
        .eq('id', courseId);

      if (error) throw error;

      setCourses(courses.map(course => 
        course.id === courseId 
          ? { ...course, is_active: !currentStatus }
          : course
      ));

      toast({
        title: "Success",
        description: `Course ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      console.error('Error updating course status:', error);
      toast({
        title: "Error",
        description: "Failed to update course status",
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
          <p className="text-muted-foreground">
            Manage your courses and track student engagement
          </p>
        </div>
        <Button asChild>
          <Link to="/create-course">
            <Plus className="h-4 w-4 mr-2" />
            Create New Course
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Card key={course.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                  <CardDescription className="font-mono text-sm">
                    {course.code}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary">{course.credits} Credits</Badge>
                  <Badge variant={course.is_active ? "default" : "secondary"}>
                    {course.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {course.description}
              </p>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Students Enrolled</span>
                  </div>
                  <Badge variant="outline">{course._count?.enrollments || 0}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span>Assignments</span>
                  </div>
                  <Badge variant="outline">{course._count?.assignments || 0}</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Created: {new Date(course.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage
                </Button>
                <Button 
                  variant={course.is_active ? "secondary" : "default"}
                  size="sm"
                  onClick={() => toggleCourseStatus(course.id, course.is_active)}
                >
                  {course.is_active ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {courses.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              You haven't created any courses yet. Create your first course to get started.
            </p>
            <Button asChild>
              <Link to="/create-course">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Course
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}