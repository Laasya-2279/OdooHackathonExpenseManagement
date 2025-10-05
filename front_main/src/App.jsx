import React, { useState, useEffect } from 'react';
import { Camera, Upload, CheckCircle, XCircle, Clock, DollarSign, Users, FileText, Settings, LogOut, Plus, Eye, Trash2 } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

// Utility functions
const api = {
  async call(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }
    return response.json();
  }
};

export default function ExpenseManagementApp() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('login');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      setCurrentView('dashboard');
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCurrentView('login');
  };

  if (!user) {
    return currentView === 'login' ? 
      <LoginPage onLogin={handleLogin} onSwitch={() => setCurrentView('signup')} /> :
      <SignupPage onSignup={handleLogin} onSwitch={() => setCurrentView('login')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar user={user} onLogout={handleLogout} currentView={currentView} setCurrentView={setCurrentView} />
      <div className="container mx-auto px-4 py-8">
        {currentView === 'dashboard' && <Dashboard user={user} />}
        {currentView === 'submit-expense' && <SubmitExpense user={user} />}
        {currentView === 'my-expenses' && <MyExpenses user={user} />}
        {currentView === 'approvals' && <Approvals user={user} />}
        {currentView === 'manage-users' && <ManageUsers user={user} />}
        {currentView === 'approval-rules' && <ApprovalRules user={user} />}
      </div>
    </div>
  );
}

// Navbar Component
function Navbar({ user, onLogout, currentView, setCurrentView }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FileText, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { id: 'submit-expense', label: 'Submit Expense', icon: Plus, roles: ['EMPLOYEE', 'MANAGER'] },
    { id: 'my-expenses', label: 'My Expenses', icon: Eye, roles: ['EMPLOYEE', 'MANAGER'] },
    { id: 'approvals', label: 'Approvals', icon: CheckCircle, roles: ['MANAGER', 'ADMIN'] },
    { id: 'manage-users', label: 'Manage Users', icon: Users, roles: ['ADMIN'] },
    { id: 'approval-rules', label: 'Approval Rules', icon: Settings, roles: ['ADMIN'] },
  ];

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-8 h-8 text-indigo-600" />
            <span className="text-xl font-bold text-gray-800">ExpenseFlow</span>
          </div>
          <div className="flex items-center space-x-4">
            {navItems.filter(item => item.roles.includes(user.role)).map(item => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
                  currentView === item.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-700 hover:bg-indigo-50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="hidden md:inline">{item.label}</span>
              </button>
            ))}
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

// Login Page
function LoginPage({ onLogin, onSwitch }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.call('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('token', data.token);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <DollarSign className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Sign in to manage your expenses</p>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="text-center mt-6 text-gray-600">
          Don't have an account?{' '}
          <button onClick={onSwitch} className="text-indigo-600 font-semibold hover:underline">
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
}

// Signup Page
function SignupPage({ onSignup, onSwitch }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    companyName: '',
    country: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.call('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      localStorage.setItem('token', data.token);
      onSignup(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <DollarSign className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800">Create Account</h1>
          <p className="text-gray-600 mt-2">Start managing expenses today</p>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            required
          />
          <input
            type="text"
            placeholder="Company Name"
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            required
          />
          <input
            type="text"
            placeholder="Country (e.g., United States)"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        <p className="text-center mt-6 text-gray-600">
          Already have an account?{' '}
          <button onClick={onSwitch} className="text-indigo-600 font-semibold hover:underline">
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}

// Dashboard
function Dashboard({ user }) {
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const expenses = await api.call('/expenses/my');
      setStats({
        pending: expenses.filter(e => e.status === 'PENDING' || e.status === 'IN_PROGRESS').length,
        approved: expenses.filter(e => e.status === 'APPROVED').length,
        rejected: expenses.filter(e => e.status === 'REJECTED').length,
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Welcome, {user.name}!</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={Clock} label="Pending" value={stats.pending} color="yellow" />
        <StatCard icon={CheckCircle} label="Approved" value={stats.approved} color="green" />
        <StatCard icon={XCircle} label="Rejected" value={stats.rejected} color="red" />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    red: 'bg-red-50 text-red-600 border-red-200',
  };

  return (
    <div className={`${colors[color]} border-2 rounded-xl p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{label}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <Icon className="w-12 h-12 opacity-50" />
      </div>
    </div>
  );
}

// Submit Expense
function SubmitExpense({ user }) {
  const [formData, setFormData] = useState({
    amount: '',
    originalCurrency: 'USD',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.call('/expenses', {
        method: 'POST',
        body: JSON.stringify({ ...formData, amount: parseFloat(formData.amount) }),
      });
      setSuccess(true);
      setFormData({ amount: '', originalCurrency: 'USD', category: '', description: '', date: new Date().toISOString().split('T')[0] });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Submit New Expense</h2>
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
          Expense submitted successfully!
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
            <select
              value={formData.originalCurrency}
              onChange={(e) => setFormData({ ...formData, originalCurrency: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option>USD</option>
              <option>EUR</option>
              <option>GBP</option>
              <option>INR</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            required
          >
            <option value="">Select category</option>
            <option>Travel</option>
            <option>Food</option>
            <option>Office Supplies</option>
            <option>Software</option>
            <option>Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows="3"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            required
          ></textarea>
        </div>
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
        >
          Submit Expense
        </button>
      </form>
    </div>
  );
}

// My Expenses
function MyExpenses({ user }) {
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      const data = await api.call('/expenses/my');
      setExpenses(data);
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>{status}</span>;
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">My Expenses</h2>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {expenses.map((expense) => (
              <tr key={expense.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">{new Date(expense.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{expense.category}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{expense.amount} {expense.originalCurrency}</td>
                <td className="px-6 py-4">{getStatusBadge(expense.status)}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{expense.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {expenses.length === 0 && (
          <div className="text-center py-12 text-gray-500">No expenses found</div>
        )}
      </div>
    </div>
  );
}

// Approvals (Manager/Admin)
function Approvals({ user }) {
  const [approvals, setApprovals] = useState([]);

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    try {
      const data = await api.call('/expenses/pending');
      setApprovals(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDecision = async (approvalId, status) => {
    try {
      await api.call(`/approvals/${approvalId}/decide`, {
        method: 'POST',
        body: JSON.stringify({ status, comments: '' }),
      });
      loadApprovals();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Pending Approvals</h2>
      <div className="space-y-4">
        {approvals.map((approval) => (
          <div key={approval.id} className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{approval.expense.employee.name}</h3>
                <p className="text-sm text-gray-500">{approval.expense.employee.email}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-indigo-600">{approval.expense.convertedAmount.toFixed(2)}</p>
                <p className="text-sm text-gray-500">Company Currency</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Category</p>
                <p className="font-medium">{approval.expense.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">{new Date(approval.expense.date).toLocaleDateString()}</p>
              </div>
            </div>
            <p className="text-gray-700 mb-4">{approval.expense.description}</p>
            <div className="flex space-x-3">
              <button
                onClick={() => handleDecision(approval.id, 'APPROVED')}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition"
              >
                Approve
              </button>
              <button
                onClick={() => handleDecision(approval.id, 'REJECTED')}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
        {approvals.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center text-gray-500">
            No pending approvals
          </div>
        )}
      </div>
    </div>
  );
}

// Manage Users (Admin only)
function ManageUsers({ user }) {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'EMPLOYEE',
    managerId: '',
    isManagerApprover: false,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await api.call('/users');
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.call('/users', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setShowForm(false);
      setFormData({ email: '', password: '', name: '', role: 'EMPLOYEE', managerId: '', isManagerApprover: false });
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Manage Users</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add User</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg"
              required
            />
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
            <select
              value={formData.managerId}
              onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">No Manager</option>
              {users.filter(u => u.role === 'MANAGER' || u.role === 'ADMIN').map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isManagerApprover}
                onChange={(e) => setFormData({ ...formData, isManagerApprover: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Manager Approver</span>
            </label>
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            Add User
          </button>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Manager</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">{u.name}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{u.email}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{u.role}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {u.managerId ? users.find(m => m.id === u.managerId)?.name : 'None'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Approval Rules (Admin only)
function ApprovalRules({ user }) {
  const [rules, setRules] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'SEQUENTIAL',
    config: {},
  });

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const data = await api.call('/approval-rules');
      setRules(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Approval Rules</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Rule</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <p className="text-gray-600">Approval rules configuration coming soon. For now, approval workflows are based on manager relationships.</p>
      </div>
    </div>
  );
}