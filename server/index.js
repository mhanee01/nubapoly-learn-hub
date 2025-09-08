import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Simple in-memory data for demonstration. Replace with DB queries in production.
// ratings: { userId, courseId, rating }
// courses: { id, title, categories, tags }
const ratings = [];
const courses = [];

// naive cache: userId -> { expiresAt, results }
const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function cosineSimilarity(vecA, vecB) {
  let dot = 0, normA = 0, normB = 0;
  for (const key of new Set([...Object.keys(vecA), ...Object.keys(vecB)])) {
    const a = vecA[key] || 0;
    const b = vecB[key] || 0;
    dot += a * b;
    normA += a * a;
    normB += b * b;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function buildUserVectors(ratingsList) {
  const userToVector = new Map();
  for (const r of ratingsList) {
    if (!userToVector.has(r.userId)) userToVector.set(r.userId, {});
    userToVector.get(r.userId)[r.courseId] = r.rating;
  }
  return userToVector;
}

function recommendForUser(userId, ratingsList) {
  const userVectors = buildUserVectors(ratingsList);
  const targetVec = userVectors.get(userId) || {};
  const targetCourses = new Set(Object.keys(targetVec).map(Number));

  // find similar users
  const similarities = [];
  for (const [otherId, vec] of userVectors.entries()) {
    if (Number(otherId) === Number(userId)) continue;
    const sim = cosineSimilarity(targetVec, vec);
    if (sim > 0) similarities.push({ userId: Number(otherId), sim });
  }
  similarities.sort((a, b) => b.sim - a.sim);

  // aggregate scores from top similar users
  const scores = new Map();
  for (const { userId: similarId, sim } of similarities.slice(0, 50)) {
    const vec = userVectors.get(similarId) || {};
    for (const [courseIdStr, rating] of Object.entries(vec)) {
      const courseId = Number(courseIdStr);
      if (targetCourses.has(courseId)) continue; // skip already taken
      const curr = scores.get(courseId) || 0;
      scores.set(courseId, curr + sim * rating);
    }
  }

  // If no scores, fallback to popular courses the user hasn't taken
  if (scores.size === 0) {
    const popularity = new Map(); // courseId -> count
    for (const r of ratingsList) {
      if (targetCourses.has(r.courseId)) continue;
      popularity.set(r.courseId, (popularity.get(r.courseId) || 0) + 1);
    }
    return Array.from(popularity.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([courseId, count]) => ({ courseId, score: count }));
  }

  return Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([courseId, score]) => ({ courseId, score }));
}

// Seed endpoints for demo/testing
app.post('/api/seed/ratings', (req, res) => {
  const list = req.body;
  if (!Array.isArray(list)) return res.status(400).json({ error: 'Expected array' });
  ratings.length = 0;
  ratings.push(...list);
  res.json({ ok: true, count: ratings.length });
});

app.post('/api/seed/courses', (req, res) => {
  const list = req.body;
  if (!Array.isArray(list)) return res.status(400).json({ error: 'Expected array' });
  courses.length = 0;
  courses.push(...list);
  res.json({ ok: true, count: courses.length });
});

app.get('/api/recommendations/:userId', (req, res) => {
  const userId = Number(req.params.userId);
  if (Number.isNaN(userId)) return res.status(400).json({ error: 'Invalid userId' });

  const cached = cache.get(userId);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return res.json(cached.results);
  }

  const recs = recommendForUser(userId, ratings);
  const results = recs;
  cache.set(userId, { expiresAt: now + CACHE_TTL_MS, results });
  res.json(results);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Recommendations server listening on http://localhost:${PORT}`);
});


