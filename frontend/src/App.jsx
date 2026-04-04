import { useEffect, useState } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-cilent'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { Navigate } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import Home from './pages/Home';
import Results from './pages/Results';
import Detail from './pages/Detail';
import NavigatePage from './pages/Navigate';
import Rate from './pages/Rate';
import SavePrompt from './pages/SavePrompt';
import ThankYou from './pages/ThankYou';
import Saved from './pages/Saved';
import { Monitor, Smartphone } from 'lucide-react';

const VIEW_MODE_STORAGE_KEY = 'parkpulse_view_mode';

function getInitialViewMode() {
  if (typeof window === 'undefined') return 'mobile';

  const saved = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
  if (saved === 'mobile' || saved === 'desktop') return saved;

  return window.matchMedia('(min-width: 1024px)').matches ? 'desktop' : 'mobile';
}

function ViewModeToggle({ mode, onToggle }) {
  const isDesktopMode = mode === 'desktop';

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isDesktopMode}
      className="hidden lg:flex fixed top-4 right-4 z-[2000] items-center gap-2 px-3 py-2 rounded-xl border border-slate-300/70 bg-white/90 text-slate-700 shadow-lg backdrop-blur hover:bg-white transition-colors dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-200 dark:hover:bg-slate-900"
      title={isDesktopMode ? 'Switch to mobile view' : 'Switch to desktop view'}
    >
      {isDesktopMode ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
      <span className="text-xs font-medium">
        {isDesktopMode ? 'Mobile View' : 'Desktop View'}
      </span>
    </button>
  );
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
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


function App() {
  const [viewMode, setViewMode] = useState(getInitialViewMode);

  useEffect(() => {
    document.body.classList.remove('view-mode-mobile', 'view-mode-desktop');
    document.body.classList.add(`view-mode-${viewMode}`);
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);

    return () => {
      document.body.classList.remove('view-mode-mobile', 'view-mode-desktop');
    };
  }, [viewMode]);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
            <ViewModeToggle
              mode={viewMode}
              onToggle={() => setViewMode((prev) => (prev === 'mobile' ? 'desktop' : 'mobile'))}
            />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
