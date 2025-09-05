import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import Assignments from "./pages/Assignments";
import MyCourses from "./pages/MyCourses";
import CreateCourse from "./pages/CreateCourse";
import Users from "./pages/Users";
import Forum from "./pages/Forum";
import Grades from "./pages/Grades";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
            
            {/* Student Routes */}
            <Route path="/courses" element={<Layout><Courses /></Layout>} />
            <Route path="/assignments" element={<Layout><Assignments /></Layout>} />
            <Route path="/grades" element={<Layout><Grades /></Layout>} />
            <Route path="/materials" element={<Layout><Assignments /></Layout>} />
            <Route path="/forum" element={<Layout><Forum /></Layout>} />
            <Route path="/carryover" element={<Layout><Assignments /></Layout>} />
            
            {/* Lecturer Routes */}
            <Route path="/my-courses" element={<Layout><MyCourses /></Layout>} />
            <Route path="/create-course" element={<Layout><CreateCourse /></Layout>} />
            <Route path="/manage-assignments" element={<Layout><Assignments /></Layout>} />
            <Route path="/students" element={<Layout><Users /></Layout>} />
            <Route path="/upload-materials" element={<Layout><Assignments /></Layout>} />
            <Route path="/analytics" element={<Layout><Dashboard /></Layout>} />
            
            {/* Admin Routes */}
            <Route path="/users" element={<Layout><Users /></Layout>} />
            <Route path="/all-courses" element={<Layout><Courses /></Layout>} />
            <Route path="/enrollments" element={<Layout><Users /></Layout>} />
            <Route path="/reports" element={<Layout><Dashboard /></Layout>} />
            <Route path="/settings" element={<Layout><Dashboard /></Layout>} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
