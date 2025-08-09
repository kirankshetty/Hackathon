import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import AdminDashboard from "@/pages/AdminDashboard";
import JuryDashboard from "@/pages/JuryDashboard";
import ApplicantDashboard from "@/pages/ApplicantDashboard";
import ApplicantLogin from "@/pages/ApplicantLogin";
import ApplicantSubmissions from "@/pages/ApplicantSubmissions";
import StageSubmission from "@/pages/StageSubmission";
import Registration from "@/pages/Registration";
import ConfirmParticipation from "@/pages/ConfirmParticipation";
import ApplicantsPage from "@/pages/ApplicantsPage";
import CompetitionRounds from "@/pages/CompetitionRounds";
import QuickActions from "@/pages/QuickActions";
import ExportData from "@/pages/ExportData";
import AdminSettings from "@/pages/AdminSettings";
import AdminLogin from "@/pages/AdminLogin";
import AddApplicant from "@/pages/AddApplicant";
import Notifications from "@/pages/Notifications";
import PaymentCheckout from "@/pages/PaymentCheckout";
import PaymentSuccess from "@/pages/PaymentSuccess";
import PaymentFailed from "@/pages/PaymentFailed";
import PaymentCancelled from "@/pages/PaymentCancelled";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/register" component={Registration} />
          <Route path="/confirm-participation" component={ConfirmParticipation} />
          <Route path="/admin/login" component={AdminLogin} />
          {/* Payment Routes (no auth required for testing) */}
          <Route path="/payment-checkout" component={PaymentCheckout} />
          <Route path="/payment-success" component={PaymentSuccess} />
          <Route path="/payment-failed" component={PaymentFailed} />
          <Route path="/payment-cancelled" component={PaymentCancelled} />
          {/* Applicant Portal Routes (no admin auth required) */}
          <Route path="/applicant/login" component={ApplicantLogin} />
          <Route path="/applicant/dashboard" component={ApplicantDashboard} />
          <Route path="/applicant/submissions" component={ApplicantSubmissions} />
          <Route path="/applicant/submit/:stageId" component={StageSubmission} />
        </>
      ) : (
        <>
          <Route path="/">
            {(user as any)?.role === 'admin' && <AdminDashboard />}
            {(user as any)?.role === 'jury' && <JuryDashboard />}
            {(user as any)?.role === 'applicant' && <ApplicantDashboard />}
            {!(user as any)?.role && <Landing />}
          </Route>
          {/* Admin Routes */}
          <Route path="/applicants">
            {(user as any)?.role === 'admin' || (user as any)?.role === 'jury' ? <ApplicantsPage /> : <NotFound />}
          </Route>
          <Route path="/jury">
            {(user as any)?.role === 'admin' ? <AdminDashboard /> : <NotFound />}
          </Route>
          <Route path="/submissions">
            {(user as any)?.role === 'admin' ? <AdminDashboard /> : (user as any)?.role === 'jury' ? <JuryDashboard /> : <NotFound />}
          </Route>
          <Route path="/orientation">
            {(user as any)?.role === 'admin' ? <AdminDashboard /> : <NotFound />}
          </Route>
          <Route path="/rounds">
            {(user as any)?.role === 'admin' ? <CompetitionRounds /> : <NotFound />}
          </Route>
          <Route path="/quick-actions">
            {(user as any)?.role === 'admin' ? <QuickActions /> : <NotFound />}
          </Route>
          <Route path="/add-applicant">
            {(user as any)?.role === 'admin' ? <AddApplicant /> : <NotFound />}
          </Route>
          <Route path="/notifications">
            {(user as any)?.role === 'admin' ? <Notifications /> : <NotFound />}
          </Route>
          <Route path="/export-data">
            {(user as any)?.role === 'admin' ? <ExportData /> : <NotFound />}
          </Route>
          <Route path="/settings">
            {(user as any)?.role === 'admin' ? <AdminSettings /> : <NotFound />}
          </Route>
          {/* Payment Routes (available for authenticated users too) */}
          <Route path="/payment-checkout" component={PaymentCheckout} />
          <Route path="/payment-success" component={PaymentSuccess} />
          <Route path="/payment-failed" component={PaymentFailed} />
          <Route path="/payment-cancelled" component={PaymentCancelled} />
          {/* Jury Routes - handled in admin routes above */}
          {/* Applicant Routes */}
          {(user as any)?.role === 'applicant' && (
            <>
              <Route path="/my-submissions" component={ApplicantDashboard} />
            </>
          )}
          <Route path="/register" component={Registration} />
          <Route path="/confirm-participation" component={ConfirmParticipation} />
          {/* Applicant Portal Routes (available even when admin is logged in) */}
          <Route path="/applicant/login" component={ApplicantLogin} />
          <Route path="/applicant/dashboard" component={ApplicantDashboard} />
          <Route path="/applicant/submissions" component={ApplicantSubmissions} />
          <Route path="/applicant/submit/:stageId" component={StageSubmission} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
