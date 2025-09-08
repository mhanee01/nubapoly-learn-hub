import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookId, content, action } = await req.json();
    console.log(`Processing content for book ${bookId}, action: ${action}`);

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) throw new Error('Unauthorized');

    let response;
    let result = {};

    switch (action) {
      case 'summarize':
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are an expert at creating concise, informative summaries of educational content. Create a comprehensive summary that captures the key concepts, main ideas, and important details.'
              },
              {
                role: 'user',
                content: `Please create a detailed summary of the following content:\n\n${content}`
              }
            ],
            max_tokens: 1000,
            temperature: 0.3,
          }),
        });
        
        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        const summaryData = await response.json();
        result = { summary: summaryData.choices[0].message.content };
        
        // Update book with summary
        await supabase
          .from('books')
          .update({ summary: result.summary })
          .eq('id', bookId)
          .eq('user_id', user.id);
        
        break;

      case 'generate_flashcards':
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are an expert at creating educational flashcards. Create clear, concise flashcards that help students learn key concepts. Return ONLY a JSON array of objects with "question" and "answer" fields.'
              },
              {
                role: 'user',
                content: `Create 10 flashcards based on this content. Return only valid JSON:\n\n${content}`
              }
            ],
            max_tokens: 2000,
            temperature: 0.4,
          }),
        });

        const flashcardsData = await response.json();
        const flashcardsText = flashcardsData.choices[0].message.content.trim();
        
        try {
          const flashcards = JSON.parse(flashcardsText);
          
          // Insert flashcards into database
          const flashcardsToInsert = flashcards.map((fc: any) => ({
            book_id: bookId,
            user_id: user.id,
            question: fc.question,
            answer: fc.answer,
            difficulty_level: 1
          }));

          const { error: insertError } = await supabase
            .from('flashcards')
            .insert(flashcardsToInsert);

          if (insertError) {
            console.error('Error inserting flashcards:', insertError);
            throw insertError;
          }

          result = { flashcards, count: flashcards.length };
        } catch (parseError) {
          console.error('Error parsing flashcards JSON:', parseError);
          throw new Error('Failed to parse flashcards response');
        }
        break;

      case 'generate_quiz':
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are an expert at creating educational multiple-choice quiz questions. Create challenging but fair questions with 4 options each. Return ONLY a JSON array of objects with "question", "options" (array of 4 strings), "correct_answer" (string), and "explanation" fields.'
              },
              {
                role: 'user',
                content: `Create 5 multiple-choice quiz questions based on this content. Return only valid JSON:\n\n${content}`
              }
            ],
            max_tokens: 2000,
            temperature: 0.4,
          }),
        });

        const quizData = await response.json();
        const quizText = quizData.choices[0].message.content.trim();
        
        try {
          const quizQuestions = JSON.parse(quizText);
          
          // Insert quiz questions into database
          const questionsToInsert = quizQuestions.map((q: any) => ({
            book_id: bookId,
            user_id: user.id,
            question: q.question,
            options: q.options,
            correct_answer: q.correct_answer,
            explanation: q.explanation,
            question_type: 'multiple_choice'
          }));

          const { error: insertError } = await supabase
            .from('quiz_questions')
            .insert(questionsToInsert);

          if (insertError) {
            console.error('Error inserting quiz questions:', insertError);
            throw insertError;
          }

          result = { questions: quizQuestions, count: quizQuestions.length };
        } catch (parseError) {
          console.error('Error parsing quiz JSON:', parseError);
          throw new Error('Failed to parse quiz response');
        }
        break;

      default:
        throw new Error('Invalid action specified');
    }

    console.log(`Content processing completed for action: ${action}`);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-content function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});