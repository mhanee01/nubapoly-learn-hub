export interface RecommendationItem {
  courseId: number;
  score: number;
}

export interface CourseMeta {
  id: string;
  title: string;
  category?: string | null;
  tags?: string[] | null;
}

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export function useRecommendations(apiBase: string = 'http://localhost:4000') {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<(RecommendationItem & { course?: CourseMeta })[]>([]);

  useEffect(() => {
    const run = async () => {
      if (!profile) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${apiBase}/api/recommendations/${profile.id}`);
        if (!res.ok) throw new Error(`Failed to fetch recommendations (${res.status})`);
        const data: RecommendationItem[] = await res.json();

        // Resolve course metadata from Supabase courses table
        const courseIds = data.map(d => d.courseId);
        let courseMetaMap = new Map<number, CourseMeta>();
        if (courseIds.length > 0) {
          const { data: courseRows } = await supabase
            .from('courses')
            .select('id, title')
            .in('id', courseIds as any);
          (courseRows || []).forEach((c: any) => {
            courseMetaMap.set(Number(c.id), { id: c.id, title: c.title });
          });
        }

        setItems(data.map(d => ({ ...d, course: courseMetaMap.get(Number(d.courseId)) })));
      } catch (e: any) {
        setError(e?.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [profile?.id, apiBase]);

  return { loading, error, items };
}
