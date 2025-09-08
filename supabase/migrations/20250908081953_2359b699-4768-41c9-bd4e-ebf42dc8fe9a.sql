-- Create books table for student uploads
CREATE TABLE public.books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT,
  description TEXT,
  file_url TEXT,
  file_name TEXT,
  file_size BIGINT,
  content_type TEXT,
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_processed BOOLEAN DEFAULT FALSE,
  summary TEXT,
  tags TEXT[],
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create flashcards table
CREATE TABLE public.flashcards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz questions table
CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of answer options
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  question_type TEXT DEFAULT 'multiple_choice',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reading progress table
CREATE TABLE public.reading_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, book_id)
);

-- Create book recommendations table
CREATE TABLE public.book_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recommended_book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  based_on_book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  similarity_score DECIMAL(3,2) DEFAULT 0.0,
  recommendation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_recommendations ENABLE ROW LEVEL SECURITY;

-- Create policies for books
CREATE POLICY "Users can view their own books" 
ON public.books FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own books" 
ON public.books FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own books" 
ON public.books FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own books" 
ON public.books FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for flashcards
CREATE POLICY "Users can view their own flashcards" 
ON public.flashcards FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own flashcards" 
ON public.flashcards FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flashcards" 
ON public.flashcards FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flashcards" 
ON public.flashcards FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for quiz questions
CREATE POLICY "Users can view their own quiz questions" 
ON public.quiz_questions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quiz questions" 
ON public.quiz_questions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quiz questions" 
ON public.quiz_questions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quiz questions" 
ON public.quiz_questions FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for reading progress
CREATE POLICY "Users can view their own reading progress" 
ON public.reading_progress FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reading progress" 
ON public.reading_progress FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reading progress" 
ON public.reading_progress FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reading progress" 
ON public.reading_progress FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for recommendations
CREATE POLICY "Users can view their own recommendations" 
ON public.book_recommendations FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own recommendations" 
ON public.book_recommendations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create storage bucket for book files
INSERT INTO storage.buckets (id, name, public) VALUES ('books', 'books', false);

-- Create storage policies for book uploads
CREATE POLICY "Users can view their own book files" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'books' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own book files" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'books' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own book files" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'books' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own book files" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'books' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create triggers for timestamp updates
CREATE TRIGGER update_books_updated_at
BEFORE UPDATE ON public.books
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reading_progress_updated_at
BEFORE UPDATE ON public.reading_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();