import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
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
            <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
            
            {/* Student Routes */}
            <Route path="/courses" element={<ProtectedRoute><Layout><Courses /></Layout></ProtectedRoute>} />
            <Route path="/assignments" element={<ProtectedRoute><Layout><Assignments /></Layout></ProtectedRoute>} />
            <Route path="/grades" element={<ProtectedRoute><Layout><Grades /></Layout></ProtectedRoute>} />
            <Route path="/materials" element={<ProtectedRoute><Layout><Assignments /></Layout></ProtectedRoute>} />
            <Route path="/forum" element={<ProtectedRoute><Layout><Forum /></Layout></ProtectedRoute>} />
            <Route path="/carryover" element={<ProtectedRoute><Layout><Assignments /></Layout></ProtectedRoute>} />
            
            {/* Lecturer Routes */}
            <Route path="/my-courses" element={<ProtectedRoute><Layout><MyCourses /></Layout></ProtectedRoute>} />
            <Route path="/create-course" element={<ProtectedRoute><Layout><CreateCourse /></Layout></ProtectedRoute>} />
            <Route path="/manage-assignments" element={<ProtectedRoute><Layout><Assignments /></Layout></ProtectedRoute>} />
            <Route path="/students" element={<ProtectedRoute><Layout><Users /></Layout></ProtectedRoute>} />
            <Route path="/upload-materials" element={<ProtectedRoute><Layout><Assignments /></Layout></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
            
            {/* Admin Routes */}
            <Route path="/users" element={<ProtectedRoute><Layout><Users /></Layout></ProtectedRoute>} />
            <Route path="/all-courses" element={<ProtectedRoute><Layout><Courses /></Layout></ProtectedRoute>} />
            <Route path="/enrollments" element={<ProtectedRoute><Layout><Users /></Layout></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
