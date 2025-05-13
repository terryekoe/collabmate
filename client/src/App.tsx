import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./hooks/use-auth";

// Pages
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import WorkspacePage from "@/pages/workspace-page";
import TasksPage from "@/pages/tasks-page";
import FeedbackPage from "@/pages/feedback-page";
import TeamPage from "@/pages/team-page";
import ReportsPage from "@/pages/reports-page";
import NotFound from "@/pages/not-found";

// Components
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/workspace/:id" component={WorkspacePage} />
      <ProtectedRoute path="/tasks" component={TasksPage} />
      <ProtectedRoute path="/feedback" component={FeedbackPage} />
      <ProtectedRoute path="/team" component={TeamPage} />
      <ProtectedRoute path="/reports" component={ReportsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </AuthProvider>
  );
}

export default App;
