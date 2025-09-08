import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { GraduationCap, BookOpen, Users, Award } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-8">
            <GraduationCap className="h-20 w-20 text-primary" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            SPY Learning System
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Smart Personal Yield - An intelligent learning system that adapts to your reading habits. 
            Upload books, get AI-powered summaries, flashcards, and personalized recommendations.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button size="lg" asChild>
              <Link to="/auth">Get Started</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>
          
          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center p-6 bg-card rounded-lg shadow-sm">
              <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Course Management</h3>
              <p className="text-muted-foreground">
                Browse courses, access materials, and track your learning progress
              </p>
            </div>
            
            <div className="text-center p-6 bg-card rounded-lg shadow-sm">
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Collaborative Learning</h3>
              <p className="text-muted-foreground">
                Participate in forums, discussions, and group activities
              </p>
            </div>
            
            <div className="text-center p-6 bg-card rounded-lg shadow-sm">
              <Award className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Assessment & Grading</h3>
              <p className="text-muted-foreground">
                Submit assignments, take quizzes, and view your academic grades
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
