import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ReactNode } from 'react';
import { LoginPage } from './pages/LoginPage';
import { CandidateLoginPage } from './pages/CandidateLoginPage';
import { CandidateSignupPage } from './pages/CandidateSignupPage';
import { CandidateDashboardPage } from './pages/CandidateDashboardPage';
import { CandidateJobsPage } from './pages/CandidateJobsPage';
import { CandidateJobDetailPage } from './pages/CandidateJobDetailPage';
import { CandidateProfilePage } from './pages/CandidateProfilePage';
import { DashboardPage } from './pages/DashboardPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { AttendancePage } from './pages/AttendancePage';
import { LeavePage } from './pages/LeavePage';
import { PayrollPage } from './pages/PayrollPage';
import { RecruitmentPage } from './pages/RecruitmentPage';
import { ApplicantsPage } from './pages/ApplicantsPage';
import { CopilotPage } from './pages/CopilotPage';
import { SecurityPage } from './pages/SecurityPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { useAuth } from './context/AuthContext';

function Protected({ children, allowedRoles }: { children: ReactNode; allowedRoles?: string[] }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="min-h-screen animate-pulse bg-slate-100" />;
  }
  if (!user) {
    const isCandidateRoute = window.location.pathname.startsWith('/candidate') || ['/jobs', '/profile'].includes(window.location.pathname);
    return <Navigate to={isCandidateRoute ? "/candidate/login" : "/login"} replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'Candidate' ? '/' : '/'} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const location = useLocation();
  const { user } = useAuth();
  const isCandidate = user?.role === 'Candidate';

  return (
    <AnimatePresence mode="wait">
      <motion.div key={location.pathname} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.28 }}>
        <Routes location={location}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/candidate/login" element={<CandidateLoginPage />} />
          <Route path="/candidate/signup" element={<CandidateSignupPage />} />

          {isCandidate ? (
            <>
              <Route path="/" element={<Protected allowedRoles={['Candidate']}><CandidateDashboardPage /></Protected>} />
              <Route path="/jobs" element={<Protected allowedRoles={['Candidate']}><CandidateJobsPage /></Protected>} />
              <Route path="/jobs/:id" element={<Protected allowedRoles={['Candidate']}><CandidateJobDetailPage /></Protected>} />
              <Route path="/profile" element={<Protected allowedRoles={['Candidate']}><CandidateProfilePage /></Protected>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : (
            <>
              <Route path="/" element={<Protected allowedRoles={['Admin', 'HR', 'Employee']}><DashboardPage /></Protected>} />
              <Route path="/employees" element={<Protected allowedRoles={['Admin', 'HR', 'Employee']}><EmployeesPage /></Protected>} />
              <Route path="/attendance" element={<Protected allowedRoles={['Admin', 'HR', 'Employee']}><AttendancePage /></Protected>} />
              <Route path="/leave" element={<Protected allowedRoles={['Admin', 'HR', 'Employee']}><LeavePage /></Protected>} />
              <Route path="/payroll" element={<Protected allowedRoles={['Admin', 'HR', 'Employee']}><PayrollPage /></Protected>} />
              <Route path="/recruitment" element={<Protected allowedRoles={['Admin', 'HR', 'Employee']}><RecruitmentPage /></Protected>} />
              <Route path="/applicants" element={<Protected allowedRoles={['Admin', 'HR', 'Employee']}><ApplicantsPage /></Protected>} />
              <Route path="/copilot" element={<Protected allowedRoles={['Admin', 'HR', 'Employee']}><CopilotPage /></Protected>} />
              <Route path="/security" element={<Protected allowedRoles={['Admin', 'HR', 'Employee']}><SecurityPage /></Protected>} />
              <Route path="*" element={user ? <NotFoundPage /> : <Navigate to="/login" replace />} />
            </>
          )}
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}
