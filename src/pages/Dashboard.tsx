import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, BarChart3, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

interface DashboardStats {
  totalStudents: number;
}

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [profile]);

  const fetchDashboardData = async () => {
    if (!profile) return;
    
    setLoading(true);
    try {
      if (profile.role === 'admin') {
        const { data: usersResult } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('role', 'student');

        setStats({
          totalStudents: usersResult?.length || 0
        });
      } else {
        // Student dashboard - simplified
        setStats({
          totalStudents: 0
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setStats({
        totalStudents: 0
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
          Here's your {profile?.role} dashboard.
        </p>
      </div>

      {/* Stats Cards - Only for admins */}
      {profile?.role === 'admin' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Registered Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
            </CardContent>
          </Card>
        </div>
      )}

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
              <div className="text-center py-8">
                <h3 className="text-lg font-semibold mb-2">Student Dashboard</h3>
                <p className="text-muted-foreground">
                  Welcome to your student dashboard. Additional features will be available soon.
                </p>
              </div>
            )}
            
            {profile?.role === 'admin' && (
              <>
                <Button asChild>
                  <Link to="/users">Manage Users</Link>
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}