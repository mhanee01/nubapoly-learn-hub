import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsData {
  userGrowth: Array<{ date: string; users: number }>;
  bookStats: Array<{ category: string; count: number }>;
  activityStats: {
    totalBooks: number;
    totalFlashcards: number;
    totalQuizzes: number;
    activeUsers: number;
  };
}

export default function Analytics() {
  const { profile, loading } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    userGrowth: [],
    bookStats: [],
    activityStats: {
      totalBooks: 0,
      totalFlashcards: 0,
      totalQuizzes: 0,
      activeUsers: 0
    }
  });
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchAnalytics();
    }
  }, [profile]);

  const fetchAnalytics = async () => {
    try {
      // Get user growth data (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: users } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at');

      // Process user growth data
      const growthData = [];
      const now = new Date();
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const usersOnDate = users?.filter(user => 
          user.created_at.startsWith(dateStr)
        ).length || 0;
        
        growthData.push({
          date: dateStr,
          users: usersOnDate
        });
      }

      // Get book statistics by category
      const { data: books } = await supabase
        .from('books')
        .select('category');

      const categoryStats = books?.reduce((acc: any, book) => {
        const category = book.category || 'Uncategorized';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {}) || {};

      const bookStats = Object.entries(categoryStats).map(([category, count]) => ({
        category,
        count: count as number
      }));

      // Get activity statistics
      const { count: totalBooks } = await supabase
        .from('books')
        .select('*', { count: 'exact', head: true });

      const { count: totalFlashcards } = await supabase
        .from('flashcards')
        .select('*', { count: 'exact', head: true });

      const { count: totalQuizzes } = await supabase
        .from('quiz_questions')
        .select('*', { count: 'exact', head: true });

      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      setAnalytics({
        userGrowth: growthData,
        bookStats,
        activityStats: {
          totalBooks: totalBooks || 0,
          totalFlashcards: totalFlashcards || 0,
          totalQuizzes: totalQuizzes || 0,
          activeUsers: activeUsers || 0
        }
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (profile?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          System analytics and usage statistics
        </p>
      </div>

      {loadingAnalytics ? (
        <div className="space-y-6">
          <div className="h-64 bg-muted animate-pulse rounded"></div>
          <div className="h-64 bg-muted animate-pulse rounded"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Activity Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {analytics.activityStats.totalBooks}
                </div>
                <div className="text-sm text-muted-foreground">Total Books</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {analytics.activityStats.totalFlashcards}
                </div>
                <div className="text-sm text-muted-foreground">Flashcards</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {analytics.activityStats.totalQuizzes}
                </div>
                <div className="text-sm text-muted-foreground">Quiz Questions</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {analytics.activityStats.activeUsers}
                </div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </CardContent>
            </Card>
          </div>

          {/* User Growth Chart */}
          <Card>
            <CardHeader>
              <CardTitle>User Growth (Last 30 Days)</CardTitle>
              <CardDescription>Daily new user registrations</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="users" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Book Categories Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Books by Category</CardTitle>
              <CardDescription>Distribution of books across categories</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.bookStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}