import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import StyleJournalPage from './pages/StyleJournal';
import BookProductPage from './pages/BookProductPage';
import BooksPage from './pages/ProgramsBooks';
import MyIdentitiesPage from './pages/MyIdentities';
import BookLandingPage from './pages/BookLanding';
import QuizPage from './pages/QuizPage';
import QuizResults from './pages/QuizResults';
import ManagerStyleInsightsPage from './pages/ManagerStyleInsights';
import ManagerQuizEditorPage from './pages/ManagerQuizEditor';
import AudiobookPage from './pages/AudiobookPage';
import ManagerAudiobooks from './pages/ManagerAudiobooks';
import AdminUsageTracking from './pages/AdminUsageTracking';
import ManagerWebAnalytics from './pages/ManagerWebAnalytics';
import ManagerCreditUpgrade from './pages/ManagerCreditUpgrade';
import SignIn from './pages/SignIn';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle user_not_registered error (block entire app)
  if (authError && authError.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  // For auth_required: this is a public website — let all routes render.
  // Protected pages handle their own auth gating via Layout/AuthLayout.
  // Only the layout's auth check will redirect to login for protected pages.

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/StyleJournal" element={<LayoutWrapper currentPageName="StyleJournal"><StyleJournalPage /></LayoutWrapper>} />
      <Route path="/book/:slug" element={<LayoutWrapper currentPageName="BookProductPage"><BookProductPage /></LayoutWrapper>} />
      <Route path="/Books" element={<LayoutWrapper currentPageName="ProgramsBooks"><BooksPage /></LayoutWrapper>} />
      <Route path="/MyIdentities" element={<LayoutWrapper currentPageName="MyIdentities"><MyIdentitiesPage /></LayoutWrapper>} />
      <Route path="/ManagerStyleInsights" element={<LayoutWrapper currentPageName="ManagerStyleInsights"><ManagerStyleInsightsPage /></LayoutWrapper>} />
      <Route path="/ManagerQuizEditor" element={<LayoutWrapper currentPageName="ManagerQuizEditor"><ManagerQuizEditorPage /></LayoutWrapper>} />
      <Route path="/books/:slug" element={<LayoutWrapper currentPageName="BookLanding"><BookLandingPage /></LayoutWrapper>} />
      <Route path="/quiz/:slug" element={<LayoutWrapper currentPageName="QuizPage"><QuizPage /></LayoutWrapper>} />
      <Route path="/quiz/:slug/results" element={<LayoutWrapper currentPageName="QuizResults"><QuizResults /></LayoutWrapper>} />
      <Route path="/audiobook/:slug" element={<LayoutWrapper currentPageName="AudiobookPage"><AudiobookPage /></LayoutWrapper>} />
      <Route path="/ManagerAudiobooks" element={<LayoutWrapper currentPageName="ManagerAudiobooks"><ManagerAudiobooks /></LayoutWrapper>} />
      <Route path="/AdminUsageTracking" element={<LayoutWrapper currentPageName="AdminUsageTracking"><AdminUsageTracking /></LayoutWrapper>} />
      <Route path="/ManagerWebAnalytics" element={<LayoutWrapper currentPageName="ManagerWebAnalytics"><ManagerWebAnalytics /></LayoutWrapper>} />
      <Route path="/ManagerCreditUpgrade" element={<LayoutWrapper currentPageName="ManagerCreditUpgrade"><ManagerCreditUpgrade /></LayoutWrapper>} />
      <Route path="/login" element={<SignIn />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <VisualEditAgent />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App