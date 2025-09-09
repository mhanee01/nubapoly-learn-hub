import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, BarChart3, Settings, BookOpen, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { BookUpload } from '@/components/BookUpload';
import { BookLibrary } from '@/components/BookLibrary';

interface DashboardStats {
  totalStudents: number;
  totalBooks: number;
  totalFlashcards: number;
  totalQuizzes: number;
}

export default function Dashboard() {
  const { profile } = useAuth();
  
  // Redirect admins to admin dashboard
  if (profile?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalBooks: 0,
    totalFlashcards: 0,
    totalQuizzes: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, [profile]);

  const fetchDashboardData = async () => {
    if (!profile) return;
    
    setLoading(true);
    try {
      // Student dashboard - fetch student stats
      const [booksResult, flashcardsResult, quizzesResult] = await Promise.all([
        supabase.from('books').select('id').eq('user_id', profile.user_id),
        supabase.from('flashcards').select('id').eq('user_id', profile.user_id),
        supabase.from('quiz_questions').select('id').eq('user_id', profile.user_id)
      ]);

      setStats({
        totalStudents: 0,
        totalBooks: booksResult.data?.length || 0,
        totalFlashcards: flashcardsResult.data?.length || 0,
        totalQuizzes: quizzesResult.data?.length || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setStats({
        totalStudents: 0,
        totalBooks: 0,
        totalFlashcards: 0,
        totalQuizzes: 0
      });
    } finally {
      setLoading(false);
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
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {profile?.first_name}!
        </h1>
        <p className="text-muted-foreground">
          Here's your student dashboard.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Books</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBooks}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flashcards</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFlashcards}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quiz Questions</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQuizzes}</div>
          </CardContent>
        </Card>
      </div>

      {/* Student Features */}
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <BookUpload onUploadSuccess={() => {
            setRefreshTrigger(prev => prev + 1);
            fetchDashboardData();
          }} />
          
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Manage your learning materials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground mb-4">
                Upload books and let AI create summaries, flashcards, and quizzes for enhanced learning.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">AI-Powered Summaries</Badge>
                <Badge variant="outline">Smart Flashcards</Badge>
                <Badge variant="outline">Interactive Quizzes</Badge>
                <Badge variant="outline">Book Recommendations</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>My Library</CardTitle>
            <CardDescription>
              View and manage your uploaded books
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BookLibrary refreshTrigger={refreshTrigger} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}