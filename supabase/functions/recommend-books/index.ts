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
    const { bookId } = await req.json();
    console.log(`Generating recommendations based on book: ${bookId}`);

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

    // Get the source book details
    const { data: sourceBook, error: sourceBookError } = await supabase
      .from('books')
      .select('title, author, category, tags, summary, description')
      .eq('id', bookId)
      .eq('user_id', user.id)
      .single();

    if (sourceBookError || !sourceBook) {
      throw new Error('Source book not found');
    }

    // Get all other books by the same user
    const { data: userBooks, error: userBooksError } = await supabase
      .from('books')
      .select('id, title, author, category, tags, summary, description')
      .eq('user_id', user.id)
      .neq('id', bookId);

    if (userBooksError) {
      throw new Error('Error fetching user books');
    }

    if (!userBooks || userBooks.length === 0) {
      return new Response(JSON.stringify({ recommendations: [], message: 'Not enough books to generate recommendations' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use OpenAI to analyze similarity and generate recommendations
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `You are an expert book recommendation system. Analyze the source book and compare it with the user's other books to find the most similar ones based on:
1. Category/genre similarity
2. Topic/content similarity  
3. Author similarity
4. Thematic connections
5. Educational value

Return ONLY a JSON array of objects with "bookId", "similarityScore" (0-1), and "reason" fields, ordered by similarity score (highest first). Include only books with similarity score > 0.3.`
          },
          {
            role: 'user',
            content: `SOURCE BOOK:
Title: ${sourceBook.title}
Author: ${sourceBook.author || 'Unknown'}
Category: ${sourceBook.category || 'None'}
Tags: ${sourceBook.tags?.join(', ') || 'None'}
Summary: ${sourceBook.summary || 'No summary available'}
Description: ${sourceBook.description || 'No description available'}

OTHER BOOKS TO COMPARE:
${userBooks.map(book => `
ID: ${book.id}
Title: ${book.title}
Author: ${book.author || 'Unknown'}
Category: ${book.category || 'None'}
Tags: ${book.tags?.join(', ') || 'None'}
Summary: ${book.summary || 'No summary available'}
Description: ${book.description || 'No description available'}
`).join('\n')}

Return only valid JSON with recommendations ordered by similarity score.`
          }
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const recommendationsText = aiData.choices[0].message.content.trim();
    
    try {
      const aiRecommendations = JSON.parse(recommendationsText);
      
      // Insert recommendations into database
      const recommendationsToInsert = aiRecommendations.map((rec: any) => ({
        user_id: user.id,
        recommended_book_id: rec.bookId,
        based_on_book_id: bookId,
        similarity_score: rec.similarityScore,
        recommendation_reason: rec.reason
      }));

      // Delete existing recommendations for this book combination
      await supabase
        .from('book_recommendations')
        .delete()
        .eq('user_id', user.id)
        .eq('based_on_book_id', bookId);

      if (recommendationsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('book_recommendations')
          .insert(recommendationsToInsert);

        if (insertError) {
          console.error('Error inserting recommendations:', insertError);
          throw insertError;
        }
      }

      // Fetch the complete book details for recommendations
      const recommendedBookIds = aiRecommendations.map((rec: any) => rec.bookId);
      const { data: recommendedBooks } = await supabase
        .from('books')
        .select('id, title, author, category, tags, summary')
        .in('id', recommendedBookIds)
        .eq('user_id', user.id);

      // Combine AI recommendations with book details
      const finalRecommendations = aiRecommendations.map((rec: any) => {
        const bookDetails = recommendedBooks?.find(book => book.id === rec.bookId);
        return {
          ...bookDetails,
          similarityScore: rec.similarityScore,
          reason: rec.reason
        };
      }).filter(rec => rec.id); // Only include books that were found

      console.log(`Generated ${finalRecommendations.length} recommendations`);
      return new Response(JSON.stringify({ 
        recommendations: finalRecommendations,
        count: finalRecommendations.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (parseError) {
      console.error('Error parsing recommendations JSON:', parseError);
      throw new Error('Failed to parse recommendations response');
    }

  } catch (error) {
    console.error('Error in recommend-books function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});