import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-cilent";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";

import { AuthProvider, useAuth } from "@/lib/AuthContext";
import PageNotFound from "./lib/PageNotFound";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";

// Pages
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Results from "./pages/Results";
import Detail from "./pages/Detail";
import NavigatePage from "./pages/Navigate";
import Rate from "./pages/Rate";
import SavePrompt from "./pages/SavePrompt";
import ThankYou from "./pages/ThankYou";
import Saved from "./pages/Saved";

// ---------------------
// Protected App
// ---------------------
const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();

  // Loading spinner
  if (isLoadingAuth || isLoadingPublicSettings) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError?.type === "auth_required") {
    return <Navigate to="/auth" replace />;
  }

  if (authError?.type === "user_not_registered") {
    return <UserNotRegisteredError />;
  }

  // Protected routes
  return (
    <Routes>
      {/* Default "/" goes to Home */}
      <Route path="/" element={<Navigate to="/Home" replace />} />

      <Route path="/Home" element={<Home />} />
      <Route path="/Results" element={<Results />} />
      <Route path="/Detail" element={<Detail />} />
      <Route path="/Navigate" element={<NavigatePage />} />
      <Route path="/Rate" element={<Rate />} />
      <Route path="/SavePrompt" element={<SavePrompt />} />
      <Route path="/ThankYou" element={<ThankYou />} />
      <Route path="/Saved" element={<Saved />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

// ---------------------
// Main App
// ---------------------
function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/auth" element={<Auth />} />

              {/* Protected routes */}
              <Route path="/*" element={<AuthenticatedApp />} />

              {/* Catch-all → redirect first-time visitors to /auth */}
              <Route path="*" element={<Navigate to="/auth" replace />} />
            </Routes>
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;