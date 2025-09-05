import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, BookOpen, Calendar, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Grade {
  id: string;
  grade: number;
  feedback: string;
  graded_at: string;
  assignments: {
    title: string;
    max_points: number;
    type: string;
    courses: {
      title: string;
      code: string;
      credits: number;
    };
  };
}

interface CourseGrade {
  course_id: string;
  course_title: string;
  course_code: string;
  credits: number;
  final_grade: number;
  assignments: Grade[];
  average: number;
}

export default function Grades() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [courseGrades, setCourseGrades] = useState<CourseGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallGPA, setOverallGPA] = useState<number>(0);

  useEffect(() => {
    fetchGrades();
  }, [profile]);

  const fetchGrades = async () => {
    if (!profile || profile.role !== 'student') return;

    try {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          id,
          grade,
          feedback,
          graded_at,
          assignments (
            title,
            max_points,
            type,
            courses (
              title,
              code,
              credits
            )
          )
        `)
        .eq('student_id', profile.id)
        .not('grade', 'is', null)
        .order('graded_at', { ascending: false });

      if (error) throw error;

      const gradesData = data || [];
      setGrades(gradesData);

      // Group grades by course and calculate averages
      const courseMap = new Map<string, any>();
      
      gradesData.forEach((grade) => {
        const courseId = grade.assignments.courses.title;
        if (!courseMap.has(courseId)) {
          courseMap.set(courseId, {
            course_id: courseId,
            course_title: grade.assignments.courses.title,
            course_code: grade.assignments.courses.code,
            credits: grade.assignments.courses.credits,
            assignments: [],
            total_points: 0,
            max_total_points: 0
          });
        }
        
        const course = courseMap.get(courseId);
        course.assignments.push(grade);
        course.total_points += grade.grade;
        course.max_total_points += grade.assignments.max_points;
      });

      // Get final grades from enrollments
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id, final_grade, courses(title)')
        .eq('student_id', profile.id);

      const finalGradesMap = new Map();
      enrollments?.forEach(enrollment => {
        if (enrollment.final_grade) {
          finalGradesMap.set(enrollment.courses.title, enrollment.final_grade);
        }
      });

      const coursesWithGrades = Array.from(courseMap.values()).map(course => ({
        ...course,
        average: course.max_total_points > 0 ? (course.total_points / course.max_total_points) * 100 : 0,
        final_grade: finalGradesMap.get(course.course_title) || null
      }));

      setCourseGrades(coursesWithGrades);

      // Calculate overall GPA (assuming 4.0 scale)
      if (coursesWithGrades.length > 0) {
        const totalCredits = coursesWithGrades.reduce((sum, course) => sum + course.credits, 0);
        const weightedSum = coursesWithGrades.reduce((sum, course) => {
          const gradePoint = course.final_grade || course.average;
          return sum + (gradePoint / 25) * course.credits; // Convert percentage to 4.0 scale
        }, 0);
        setOverallGPA(totalCredits > 0 ? weightedSum / totalCredits : 0);
      }

    } catch (error) {
      console.error('Error fetching grades:', error);
      toast({
        title: "Error",
        description: "Failed to load grades",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getGradeLetter = (percentage: number) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  if (profile?.role !== 'student') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Award className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
          <p className="text-muted-foreground text-center">
            Grade information is only available to students.
          </p>
        </CardContent>
      </Card>
    );
  }

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
        <h1 className="text-3xl font-bold tracking-tight">My Grades</h1>
        <p className="text-muted-foreground">
          View your academic performance and course grades
        </p>
      </div>

      {/* Overall GPA Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Academic Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {overallGPA.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Overall GPA</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {courseGrades.length}
              </div>
              <div className="text-sm text-muted-foreground">Courses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {grades.length}
              </div>
              <div className="text-sm text-muted-foreground">Graded Assignments</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course Grades */}
      <div className="grid gap-6">
        {courseGrades.map((course) => (
          <Card key={course.course_id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {course.course_title}
                  </CardTitle>
                  <CardDescription>{course.course_code} • {course.credits} Credits</CardDescription>
                </div>
                <div className="text-right">
                  {course.final_grade ? (
                    <div>
                      <div className={`text-2xl font-bold ${getGradeColor(course.final_grade)}`}>
                        {getGradeLetter(course.final_grade)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {course.final_grade.toFixed(1)}%
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className={`text-2xl font-bold ${getGradeColor(course.average)}`}>
                        {course.average.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Current Avg</div>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {course.assignments.map((assignment) => {
                  const percentage = (assignment.grade / assignment.assignments.max_points) * 100;
                  
                  return (
                    <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{assignment.assignments.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {assignment.assignments.type} • 
                          Graded {new Date(assignment.graded_at).toLocaleDateString()}
                        </div>
                        {assignment.feedback && (
                          <div className="text-sm text-muted-foreground mt-1">
                            <span className="font-medium">Feedback:</span> {assignment.feedback}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${getGradeColor(percentage)}`}>
                          {assignment.grade}/{assignment.assignments.max_points}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {courseGrades.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Award className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No grades yet</h3>
            <p className="text-muted-foreground text-center">
              Your graded assignments will appear here once instructors have evaluated your work.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}