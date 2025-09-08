import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRecommendations } from '@/hooks/useRecommendations';

export default function Recommendations() {
  const { loading, error, items } = useRecommendations();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Recommended for You</h1>
        <p className="text-muted-foreground">Courses you may like based on similar users.</p>
      </div>

      {loading && (
        <div className="text-sm text-muted-foreground">Loading recommendations...</div>
      )}
      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <Card key={`${it.courseId}`} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">
                {it.course?.title || `Course ${it.courseId}`}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Score: {it.score.toFixed(2)}</div>
              <Button size="sm">View</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}


