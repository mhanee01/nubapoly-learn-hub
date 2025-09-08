import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Book, 
  Download, 
  Lightbulb, 
  FileText, 
  HelpCircle, 
  Loader2,
  Star,
  ThumbsUp
} from 'lucide-react';

interface BookData {
  id: string;
  title: string;
  author: string | null;
  category: string | null;
  description: string | null;
  file_name: string | null;
  file_url: string | null;
  file_size: number | null;
  summary: string | null;
  is_processed: boolean;
  upload_date: string;
}

interface BookLibraryProps {
  refreshTrigger?: number;
}

export function BookLibrary({ refreshTrigger }: BookLibraryProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [books, setBooks] = useState<BookData[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingBooks, setProcessingBooks] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchBooks();
    }
  }, [user, refreshTrigger]);

  const fetchBooks = async () => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', user?.id)
        .order('upload_date', { ascending: false });

      if (error) throw error;
      setBooks(data || []);
    } catch (error) {
      console.error('Error fetching books:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your books. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const processBookContent = async (bookId: string, action: 'summarize' | 'generate_flashcards' | 'generate_quiz') => {
    setProcessingBooks(prev => new Set(prev).add(bookId));
    
    try {
      // For demo purposes, we'll use placeholder content
      // In a real implementation, you'd extract text from the uploaded file
      const placeholderContent = "This is placeholder content for the book. In a real implementation, this would be extracted from the uploaded PDF, TXT, or EPUB file.";
      
      const { data, error } = await supabase.functions.invoke('process-content', {
        body: {
          bookId,
          content: placeholderContent,
          action
        }
      });

      if (error) throw error;

      let message = '';
      switch (action) {
        case 'summarize':
          message = 'Summary generated successfully!';
          break;
        case 'generate_flashcards':
          message = `${data.count} flashcards created successfully!`;
          break;
        case 'generate_quiz':
          message = `${data.count} quiz questions created successfully!`;
          break;
      }

      toast({
        title: 'Processing Complete',
        description: message,
      });

      // Refresh books to show updated data
      fetchBooks();
    } catch (error) {
      console.error(`Error processing book (${action}):`, error);
      toast({
        title: 'Processing Failed',
        description: `Failed to ${action.replace('_', ' ')} book content. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setProcessingBooks(prev => {
        const newSet = new Set(prev);
        newSet.delete(bookId);
        return newSet;
      });
    }
  };

  const generateRecommendations = async (bookId: string) => {
    setProcessingBooks(prev => new Set(prev).add(bookId));
    
    try {
      const { data, error } = await supabase.functions.invoke('recommend-books', {
        body: { bookId }
      });

      if (error) throw error;

      toast({
        title: 'Recommendations Generated',
        description: `Found ${data.count} similar books in your library!`,
      });
    } catch (error) {
      console.error('Error generating recommendations:', error);
      toast({
        title: 'Recommendation Failed',
        description: 'Failed to generate book recommendations. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessingBooks(prev => {
        const newSet = new Set(prev);
        newSet.delete(bookId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading your books...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (books.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No books uploaded yet. Upload your first book to get started!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {books.map((book) => (
        <Card key={book.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Book className="h-5 w-5" />
                  {book.title}
                </CardTitle>
                <CardDescription>
                  {book.author && `by ${book.author}`}
                  {book.category && ` • ${book.category}`}
                  {book.file_size && ` • ${(book.file_size / 1024 / 1024).toFixed(2)} MB`}
                </CardDescription>
              </div>
              <Badge variant={book.is_processed ? 'default' : 'secondary'}>
                {book.is_processed ? 'Processed' : 'Pending'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {book.description && (
              <p className="text-sm text-muted-foreground mb-4">{book.description}</p>
            )}
            
            {book.summary && (
              <div className="bg-muted p-3 rounded-md mb-4">
                <h4 className="font-medium mb-2">AI Summary:</h4>
                <p className="text-sm">{book.summary}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {book.file_url && (
                <Button size="sm" variant="outline" asChild>
                  <a href={book.file_url} download={book.file_name} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </a>
                </Button>
              )}
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => processBookContent(book.id, 'summarize')}
                disabled={processingBooks.has(book.id)}
              >
                {processingBooks.has(book.id) ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-1" />
                )}
                {book.summary ? 'Re-summarize' : 'Summarize'}
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => processBookContent(book.id, 'generate_flashcards')}
                disabled={processingBooks.has(book.id)}
              >
                {processingBooks.has(book.id) ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Lightbulb className="h-4 w-4 mr-1" />
                )}
                Flashcards
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => processBookContent(book.id, 'generate_quiz')}
                disabled={processingBooks.has(book.id)}
              >
                {processingBooks.has(book.id) ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <HelpCircle className="h-4 w-4 mr-1" />
                )}
                Quiz
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => generateRecommendations(book.id)}
                disabled={processingBooks.has(book.id)}
              >
                {processingBooks.has(book.id) ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <ThumbsUp className="h-4 w-4 mr-1" />
                )}
                Recommend
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}