import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

// Layouts
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import OnboardingPage from "./pages/OnboardingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ModeSelectPage from "./pages/ModeSelectPage";
import HomePage from "./pages/HomePage";
import AgendaPage from "./pages/AgendaPage";
import FinancasPage from "./pages/FinancasPage";
import OffloadPage from "./pages/OffloadPage";
import PerfilPage from "./pages/PerfilPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<OnboardingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/mode-select" element={<ModeSelectPage />} />
              <Route element={<AppLayout />}>
                <Route path="/home" element={<HomePage />} />
                <Route path="/agenda" element={<AgendaPage />} />
                <Route path="/financas" element={<FinancasPage />} />
                <Route path="/offload" element={<OffloadPage />} />
                <Route path="/perfil" element={<PerfilPage />} />
              </Route>
            </Route>
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
