import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Users, Calendar, Pin, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Discussion {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  course_id: string;
  author_id: string;
  courses: {
    title: string;
    code: string;
  };
  profiles: {
    first_name: string;
    last_name: string;
    role: string;
  };
  _count?: {
    replies: number;
  };
}

export default function Forum() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDiscussions();
  }, [profile]);

  const fetchDiscussions = async () => {
    if (!profile) return;

    try {
      let query = supabase
        .from('forum_discussions')
        .select(`
          *,
          courses (title, code),
          profiles:author_id (first_name, last_name, role)
        `)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (profile.role === 'student') {
        // Get discussions for enrolled courses
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('course_id')
          .eq('student_id', profile.id)
          .eq('status', 'active');

        const courseIds = enrollments?.map(e => e.course_id) || [];
        query = query.in('course_id', courseIds);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch reply counts for each discussion
      const discussionsWithCounts = await Promise.all(
        (data || []).map(async (discussion) => {
          const { count } = await supabase
            .from('forum_replies')
            .select('id', { count: 'exact' })
            .eq('discussion_id', discussion.id);

          return {
            ...discussion,
            _count: {
              replies: count || 0
            }
          };
        })
      );

      setDiscussions(discussionsWithCounts);
    } catch (error) {
      console.error('Error fetching discussions:', error);
      toast({
        title: "Error",
        description: "Failed to load forum discussions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'lecturer': return 'default';
      case 'admin': return 'destructive';
      default: return 'secondary';
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
          <h1 className="text-3xl font-bold tracking-tight">Course Forum</h1>
          <p className="text-muted-foreground">
            Participate in course discussions and Q&A
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Discussion
        </Button>
      </div>

      <div className="space-y-4">
        {discussions.map((discussion) => (
          <Card key={discussion.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {discussion.is_pinned && (
                      <Pin className="h-4 w-4 text-yellow-600" />
                    )}
                    <CardTitle className="text-lg hover:text-primary transition-colors">
                      {discussion.title}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">
                      {discussion.courses.title} ({discussion.courses.code})
                    </Badge>
                    <Badge variant={getRoleBadgeVariant(discussion.profiles.role)}>
                      {discussion.profiles.first_name} {discussion.profiles.last_name}
                    </Badge>
                    {discussion.is_pinned && (
                      <Badge variant="secondary">Pinned</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    <span>{discussion._count?.replies || 0}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {discussion.content}
              </p>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  <span>Posted {formatDate(discussion.created_at)}</span>
                </div>
                <Button variant="ghost" size="sm">
                  View Discussion
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {discussions.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No discussions yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              {profile?.role === 'student' 
                ? "No discussions found for your enrolled courses. Be the first to start a conversation!"
                : "No discussions have been created yet. Start engaging with your students!"}
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Start First Discussion
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}