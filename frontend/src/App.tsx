import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ReactNode } from 'react';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { AttendancePage } from './pages/AttendancePage';
import { LeavePage } from './pages/LeavePage';
import { PayrollPage } from './pages/PayrollPage';
import { RecruitmentPage } from './pages/RecruitmentPage';
import { CopilotPage } from './pages/CopilotPage';
import { SecurityPage } from './pages/SecurityPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { useAuth } from './context/AuthContext';

function Protected({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="min-h-screen animate-pulse bg-slate-100" />;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <AnimatePresence mode="wait">
      <motion.div key={location.pathname} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.28 }}>
        <Routes location={location}>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <Protected>
                <DashboardPage />
              </Protected>
            }
          />
          <Route path="/employees" element={<Protected><EmployeesPage /></Protected>} />
          <Route path="/attendance" element={<Protected><AttendancePage /></Protected>} />
          <Route path="/leave" element={<Protected><LeavePage /></Protected>} />
          <Route path="/payroll" element={<Protected><PayrollPage /></Protected>} />
          <Route path="/recruitment" element={<Protected><RecruitmentPage /></Protected>} />
          <Route path="/copilot" element={<Protected><CopilotPage /></Protected>} />
          <Route path="/security" element={<Protected><SecurityPage /></Protected>} />
          <Route path="*" element={user ? <NotFoundPage /> : <Navigate to="/login" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}
