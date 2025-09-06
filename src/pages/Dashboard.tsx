import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, ClipboardList, Users, Award, Calendar, Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

interface DashboardStats {
  totalCourses: number;
  totalAssignments: number;
  totalStudents: number;
  recentAnnouncements: any[];
}

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    totalAssignments: 0,
    totalStudents: 0,
    recentAnnouncements: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [profile]);

  const fetchDashboardData = async () => {
    if (!profile) return;
    
    setLoading(true);
    try {
      if (profile.role === 'student') {
        // Optimize: Use parallel queries for student data
        const [enrollmentsResult, announcementsResult] = await Promise.all([
          supabase
            .from('enrollments')
            .select(`
              course_id,
              courses(id, title)
            `)
            .eq('student_id', profile.id),
          supabase
            .from('announcements')
            .select(`
              id, title, content, created_at, is_pinned,
              courses(title)
            `)
            .order('created_at', { ascending: false })
            .limit(5)
        ]);

        const courseIds = enrollmentsResult.data?.map(e => e.course_id) || [];
        
        // Only fetch assignments if there are enrolled courses
        const assignmentsResult = courseIds.length > 0 
          ? await supabase
              .from('assignments')
              .select('id, title, due_date, course_id')
              .in('course_id', courseIds)
          : { data: [] };

        setStats({
          totalCourses: enrollmentsResult.data?.length || 0,
          totalAssignments: assignmentsResult.data?.length || 0,
          totalStudents: 0,
          recentAnnouncements: announcementsResult.data || []
        });

      } else if (profile.role === 'lecturer') {
        // Optimize: Use parallel queries for lecturer data
        const [coursesResult, announcementsResult] = await Promise.all([
          supabase
            .from('courses')
            .select('id, title, code')
            .eq('lecturer_id', profile.id),
          supabase
            .from('announcements')
            .select(`
              id, title, content, created_at, is_pinned,
              courses(title)
            `)
            .eq('lecturer_id', profile.id)
            .order('created_at', { ascending: false })
            .limit(5)
        ]);

        const courseIds = coursesResult.data?.map(c => c.id) || [];
        
        // Parallel fetch of assignments and enrollments if there are courses
        const promises = [];
        if (courseIds.length > 0) {
          promises.push(
            supabase
              .from('assignments')
              .select('id')
              .in('course_id', courseIds),
            supabase
              .from('enrollments')
              .select('student_id')
              .in('course_id', courseIds)
          );
        } else {
          promises.push(
            Promise.resolve({ data: [] }),
            Promise.resolve({ data: [] })
          );
        }

        const [assignmentsResult, enrollmentsResult] = await Promise.all(promises);

        setStats({
          totalCourses: coursesResult.data?.length || 0,
          totalAssignments: assignmentsResult.data?.length || 0,
          totalStudents: new Set(enrollmentsResult.data?.map(e => e.student_id)).size || 0,
          recentAnnouncements: announcementsResult.data || []
        });

      } else if (profile.role === 'admin') {
        // Optimize: Use parallel queries for admin data
        const [coursesResult, usersResult, announcementsResult] = await Promise.all([
          supabase
            .from('courses')
            .select('id, title'),
          supabase
            .from('profiles')
            .select('id, role')
            .eq('role', 'student'),
          supabase
            .from('announcements')
            .select(`
              id, title, content, created_at, is_pinned,
              courses(title)
            `)
            .order('created_at', { ascending: false })
            .limit(5)
        ]);

        setStats({
          totalCourses: coursesResult.data?.length || 0,
          totalAssignments: 0, // Admin doesn't need assignment count for performance
          totalStudents: usersResult.data?.length || 0,
          recentAnnouncements: announcementsResult.data || []
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set empty stats on error to prevent infinite loading
      setStats({
        totalCourses: 0,
        totalAssignments: 0,
        totalStudents: 0,
        recentAnnouncements: []
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {profile?.first_name}!
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening in your {profile?.role} dashboard today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {profile?.role === 'student' ? 'Enrolled Courses' : 
               profile?.role === 'lecturer' ? 'My Courses' : 'Total Courses'}
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
          </CardContent>
        </Card>

        {profile?.role !== 'admin' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {profile?.role === 'student' ? 'Assignments' : 'Created Assignments'}
              </CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAssignments}</div>
            </CardContent>
          </Card>
        )}

        {profile?.role !== 'student' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {profile?.role === 'lecturer' ? 'Total Students' : 'Registered Students'}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Announcements</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentAnnouncements.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Frequently used actions for your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            {profile?.role === 'student' && (
              <>
                <Button asChild>
                  <Link to="/courses">Browse Courses</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/assignments">View Assignments</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/grades">Check Grades</Link>
                </Button>
              </>
            )}
            
            {profile?.role === 'lecturer' && (
              <>
                <Button asChild>
                  <Link to="/create-course">Create Course</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/manage-assignments">Manage Assignments</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/upload-materials">Upload Materials</Link>
                </Button>
              </>
            )}
            
            {profile?.role === 'admin' && (
              <>
                <Button asChild>
                  <Link to="/users">Manage Users</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/all-courses">View All Courses</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/analytics">View Analytics</Link>
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Announcements */}
      {stats.recentAnnouncements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Announcements</CardTitle>
            <CardDescription>
              Latest updates and announcements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentAnnouncements.map((announcement) => (
                <div key={announcement.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                  <Bell className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{announcement.title}</h4>
                      {announcement.is_pinned && (
                        <Badge variant="secondary">Pinned</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {announcement.content}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{announcement.courses?.title}</span>
                      <span>{formatDate(announcement.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}