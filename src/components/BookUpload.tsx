import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Book, Loader2 } from 'lucide-react';

interface BookUploadProps {
  onUploadSuccess?: () => void;
}

export function BookUpload({ onUploadSuccess }: BookUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [bookData, setBookData] = useState({
    title: '',
    author: '',
    category: '',
    description: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      const allowedTypes = ['application/pdf', 'text/plain', 'application/epub+zip'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a PDF, TXT, or EPUB file.',
          variant: 'destructive',
        });
        return;
      }
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please upload a file smaller than 10MB.',
          variant: 'destructive',
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !user) return;

    setIsUploading(true);
    try {
      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('books')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('books')
        .getPublicUrl(fileName);

      // Create book record
      const { data: bookRecord, error: bookError } = await supabase
        .from('books')
        .insert({
          title: bookData.title,
          author: bookData.author || null,
          category: bookData.category || null,
          description: bookData.description || null,
          file_name: selectedFile.name,
          file_url: publicUrl,
          file_size: selectedFile.size,
          content_type: selectedFile.type,
          user_id: user.id,
          is_processed: false,
        })
        .select()
        .single();

      if (bookError) throw bookError;

      toast({
        title: 'Book uploaded successfully!',
        description: 'Your book has been uploaded and is ready for processing.',
      });

      // Reset form
      setBookData({ title: '', author: '', category: '', description: '' });
      setSelectedFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      onUploadSuccess?.();

    } catch (error) {
      console.error('Error uploading book:', error);
      toast({
        title: 'Upload failed',
        description: 'There was an error uploading your book. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Book className="h-5 w-5" />
          Upload Book
        </CardTitle>
        <CardDescription>
          Upload a PDF, TXT, or EPUB file to add to your library. AI will process it to create summaries, flashcards, and quizzes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file-upload">Book File</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".pdf,.txt,.epub"
              onChange={handleFileChange}
              required
            />
            {selectedFile && (
              <p className="text-sm text-muted-foreground">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={bookData.title}
              onChange={(e) => setBookData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter book title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="author">Author</Label>
            <Input
              id="author"
              value={bookData.author}
              onChange={(e) => setBookData(prev => ({ ...prev, author: e.target.value }))}
              placeholder="Enter author name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={bookData.category}
              onChange={(e) => setBookData(prev => ({ ...prev, category: e.target.value }))}
              placeholder="e.g., Science, History, Fiction"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={bookData.description}
              onChange={(e) => setBookData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the book"
              rows={3}
            />
          </div>

          <Button type="submit" disabled={!selectedFile || isUploading} className="w-full">
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Book
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}