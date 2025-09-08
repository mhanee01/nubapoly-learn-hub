# SPY Elearning system

An e-learning platform for students, lecturers, and admins with courses, assignments, uploads, recommendations, and a built-in learning assistant chatbot.

## Features
- Authentication with Supabase
  - Email/password signup and login
  - Student access without manual approval gate
- Role-aware UI (student, lecturer, admin)
- Dashboard with quick stats and navigation
- Courses and Assignments pages (placeholders ready to extend)
- Student uploads
  - Personal file uploads to Supabase Storage (bucket: `user-uploads`)
  - List/download/delete
- Assignment submission
  - Submit files per assignment; stored in `user-uploads` and recorded in `submissions`
- AI chatbot (client-side helper)
  - Appears only when logged in
  - Quick guidance on navigation and file actions
- Recommendations (collaborative filtering)
  - Separate Node/Express service returns recommended courseIds per user
  - Caching and popularity fallback
  - React hook and page to display recommended courses

## Tech Stack
- Frontend: React + TypeScript + Vite + Tailwind + shadcn-ui
- Auth/DB/Storage: Supabase
- Recommendations API: Node.js + Express

## Data Model (key tables)
- `profiles` (id, user_id, email, first_name, last_name, role, is_approved, ...)
- `courses` (id, title, description, ...)
- `assignments` (id, course_id, title, due_date, max_points, ...)
- `submissions` (id, assignment_id, student_id, file_url, grade, ...)

## App Pages and Routes
- `/` Landing
- `/auth` Sign in / Sign up
- `/dashboard` Main dashboard
- `/courses`, `/assignments`, `/grades`, `/forum` (placeholders, ready to extend)
- `/uploads` Personal file uploads manager
- `/recommendations` Recommended courses for the logged-in user
- Lecturer/Admin: `/my-courses`, `/create-course`, `/students`, `/analytics`, `/users`, etc.

## Sidebar
- Student: Dashboard, Courses, Assignments, Grades, Materials, My Uploads, Forum, Recommendations, Carryover
- Lecturer: Dashboard, My Courses, Create Course, Assignments, Students, Materials, Forum, Analytics
- Admin: Dashboard, Users

## Getting Started (Local Development)

### Prerequisites
- Node.js 18+
- npm 9+
- Supabase project configured (client is set in `src/integrations/supabase/client.ts`)

### 1) Start the Frontend (React)
From the project root:

```bash
npm install
npm run dev
```

- App runs on http://localhost:5173 (or as printed by your dev server)
- Log in/sign up, then use the sidebar to navigate (Dashboard, Courses, Recommendations, etc.)

### 2) Start the Recommendations API (Node/Express)
From the `server/` directory:

```bash
cd server
npm install
npm start
```

- API listens on http://localhost:4000
- Endpoint: `GET /api/recommendations/:userId` → returns array of `{ courseId, score }`
- In-memory caching (5 minutes) and fallback to popular courses when no similar users are found

#### (Optional) Seed sample data for local testing
Use curl or Postman to seed ratings and courses:

```bash
# Seed ratings (users × courses with ratings)
curl -X POST http://localhost:4000/api/seed/ratings \
  -H "Content-Type: application/json" \
  -d '[
    { "userId": 1, "courseId": 101, "rating": 5 },
    { "userId": 1, "courseId": 102, "rating": 4 },
    { "userId": 2, "courseId": 101, "rating": 3 },
    { "userId": 2, "courseId": 103, "rating": 5 }
  ]'

# Seed courses metadata (ids should match above)
curl -X POST http://localhost:4000/api/seed/courses \
  -H "Content-Type: application/json" \
  -d '[
    { "id": 101, "title": "Intro to Programming" },
    { "id": 102, "title": "Data Structures" },
    { "id": 103, "title": "Databases" }
  ]'
```

## Where recommendations appear in the UI
- Hook: `src/hooks/useRecommendations.ts`
- Page: `src/pages/Recommendations.tsx`
- Route: `/recommendations` in `src/App.tsx`
- Sidebar link (student role): `src/components/AppSidebar.tsx`



## Notes / Troubleshooting
- If recommendations return empty, seed ratings/courses (above) or ensure Supabase `courses` table contains matching ids used by the API.
- Frontend expects the API at `http://localhost:4000`. To change, pass a custom base to `useRecommendations(baseUrl)`.
- Ensure a Supabase Storage bucket named `user-uploads` exists and is publicly readable for file links.
