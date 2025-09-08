import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Calendar, Clock, FileText, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  max_points: number;
  type: string;
  course_id: string;
  created_at: string;
  courses: {
    title: string;
    code: string;
  };
  submissions?: {
    id: string;
    grade: number;
    submitted_at: string;
  }[];
}

export default function Assignments() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchAssignments();
  }, [profile]);

  const fetchAssignments = async () => {
    if (!profile) return;

    try {
      let query = supabase
        .from('assignments')
        .select(`
          *,
          courses (title, code),
          submissions (id, grade, submitted_at)
        `)
        .order('due_date', { ascending: true });

      if (profile.role === 'student') {
        // Get assignments for enrolled courses
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
      setAssignments(data || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast({
        title: "Error",
        description: "Failed to load assignments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const submitAssignmentFile = async (assignmentId: string, file: File) => {
    if (!profile) return;
    setUploadingFor(assignmentId);
    try {
      const folder = `submissions/${assignmentId}/${profile.id}`;
      const path = `${folder}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from('user-uploads').upload(path, file, { upsert: false });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('user-uploads').getPublicUrl(path);
      const publicUrl = data.publicUrl;

      const { error: upsertError } = await supabase
        .from('submissions')
        .upsert({ assignment_id: assignmentId, student_id: profile.id, file_url: publicUrl }, { onConflict: 'assignment_id,student_id' });
      if (upsertError) throw upsertError;

      toast({ title: 'Submitted', description: 'Assignment file submitted.' });
      await fetchAssignments();
    } catch (error) {
      toast({ title: 'Error', description: 'Submission failed.', variant: 'destructive' });
    } finally {
      setUploadingFor(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
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

  const getDaysUntilDue = (dueDateString: string) => {
    const dueDate = new Date(dueDateString);
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusBadge = (assignment: Assignment) => {
    const hasSubmission = assignment.submissions && assignment.submissions.length > 0;
    const daysUntilDue = getDaysUntilDue(assignment.due_date);

    if (hasSubmission) {
      const submission = assignment.submissions[0];
      const grade = submission.grade;
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Submitted {grade !== null ? `(${grade}/${assignment.max_points})` : ''}
        </Badge>
      );
    }

    if (daysUntilDue < 0) {
      return <Badge variant="destructive">Overdue</Badge>;
    }

    if (daysUntilDue <= 3) {
      return <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 border-yellow-200">Due Soon</Badge>;
    }

    return <Badge variant="outline">Pending</Badge>;
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
        <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
        <p className="text-muted-foreground">
          View and submit your course assignments
        </p>
      </div>

      <div className="space-y-4">
        {assignments.map((assignment) => {
          const daysUntilDue = getDaysUntilDue(assignment.due_date);
          
          return (
            <Card key={assignment.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{assignment.title}</CardTitle>
                    <CardDescription>
                      {assignment.courses.title} ({assignment.courses.code})
                    </CardDescription>
                  </div>
                  {getStatusBadge(assignment)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {assignment.description}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Due: {formatDate(assignment.due_date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {daysUntilDue > 0 ? `${daysUntilDue} days left` : 
                       daysUntilDue === 0 ? 'Due today' : 
                       `${Math.abs(daysUntilDue)} days overdue`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>Max Points: {assignment.max_points}</span>
                  </div>
                </div>

                <div className="flex gap-2 items-center">
                  <Button size="sm">
                    View Details
                  </Button>
                  {profile?.role === 'student' && (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) submitAssignmentFile(assignment.id, file);
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingFor === assignment.id}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadingFor === assignment.id ? 'Uploading...' : 'Submit Assignment'}
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {assignments.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No assignments</h3>
            <p className="text-muted-foreground text-center">
              {profile?.role === 'student' 
                ? "You don't have any assignments yet. Enroll in courses to see assignments."
                : "No assignments found."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}