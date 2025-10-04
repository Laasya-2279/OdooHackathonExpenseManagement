import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/context/AuthContext';
import { useContext } from 'react';
import { AuthContext } from './components/context/AuthContext';

// Auth
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';

// Layout
import Layout from './components/layout/Layout';

// Dashboards
import AdminDashboard from './components/dashboard/AdminDashboard';
import ManagerDashboard from './components/dashboard/ManagerDashboard';
import EmployeeDashboard from './components/dashboard/EmployeeDashboard';

// Expenses
import ExpenseList from './components/expenses/ExpenseList';
import ExpenseForm from './components/expenses/ExpenseForm';
import ExpenseDetail from './components/expenses/ExpenseDetail';

// Users
import UserList from './components/users/UserList';
import UserForm from './components/users/UserForm';

// Approvals
import ApprovalFlowList from './components/approvals/ApprovalFlowList';
import ApprovalFlowForm from './components/approvals/ApprovalFlowForm';
import PendingApprovals from './components/approvals/PendingApprovals';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Dashboard Router
const DashboardRouter = () => {
  const { user } = useContext(AuthContext);

  if (user.role === 'admin') {
    return <AdminDashboard />;
  } else if (user.role === 'manager') {
    return <ManagerDashboard />;
  } else {
    return <EmployeeDashboard />;
  }
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardRouter />} />

            {/* Expenses */}
            <Route path="expenses" element={<ExpenseList />} />
            <Route path="expenses/new" element={<ExpenseForm />} />
            <Route path="expenses/:id" element={<ExpenseDetail />} />

            {/* Approvals */}
            <Route
              path="pending-approvals"
              element={
                <ProtectedRoute allowedRoles={['manager', 'admin']}>
                  <PendingApprovals />
                </ProtectedRoute>
              }
            />

            {/* Admin Only Routes */}
            <Route
              path="users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UserList />
                </ProtectedRoute>
              }
            />
            <Route
              path="users/new"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UserForm />
                </ProtectedRoute>
              }
            />

            <Route
              path="approval-flows"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ApprovalFlowList />
                </ProtectedRoute>
              }
            />
            <Route
              path="approval-flows/new"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ApprovalFlowForm />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;