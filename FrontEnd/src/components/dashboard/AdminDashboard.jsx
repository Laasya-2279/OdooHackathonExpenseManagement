import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Users, Receipt, DollarSign, TrendingUp, Plus, CheckCircle, XCircle, Clock } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalExpenses: 0,
    pendingExpenses: 0,
    totalAmount: 0,
    approvedExpenses: 0,
    rejectedExpenses: 0
  });
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [usersRes, expensesRes] = await Promise.all([
        api.get('/users'),
        api.get('/expenses')
      ]);

      const users = usersRes.data.data;
      const expenses = expensesRes.data.data;

      const pending = expenses.filter(e => e.status === 'processing').length;
      const approved = expenses.filter(e => e.status === 'approved').length;
      const rejected = expenses.filter(e => e.status === 'rejected').length;
      const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

      setStats({
        totalUsers: users.length,
        totalExpenses: expenses.length,
        pendingExpenses: pending,
        totalAmount: total,
        approvedExpenses: approved,
        rejectedExpenses: rejected
      });

      setRecentExpenses(expenses.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, bgColor }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 ${bgColor} rounded-lg`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/users/new')}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </button>
          <button
            onClick={() => navigate('/approval-flows/new')}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Approval Flow
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        <StatCard
          title="Total Expenses"
          value={stats.totalExpenses}
          icon={Receipt}
          color="text-purple-600"
          bgColor="bg-purple-100"
        />
        <StatCard
          title="Pending Approvals"
          value={stats.pendingExpenses}
          icon={Clock}
          color="text-orange-600"
          bgColor="bg-orange-100"
        />
        <StatCard
          title="Total Amount"
          value={`₹${stats.totalAmount.toFixed(2)}`}
          icon={DollarSign}
          color="text-green-600"
          bgColor="bg-green-100"
        />
      </div>

      {/* Expense Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Approved</h3>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-600">{stats.approvedExpenses}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Pending</h3>
            <Clock className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-orange-600">{stats.pendingExpenses}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Rejected</h3>
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-red-600">{stats.rejectedExpenses}</p>
        </div>
      </div>

      {/* Recent Expenses */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Recent Expenses</h2>
        </div>
        <div className="p-6">
          {recentExpenses.length > 0 ? (
            <div className="space-y-4">
              {recentExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg cursor-pointer transition"
                  onClick={() => navigate(`/expenses/${expense.id}`)}
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{expense.title}</h3>
                    <p className="text-sm text-gray-600">
                      {expense.employee?.firstName} {expense.employee?.lastName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {expense.currency} {parseFloat(expense.amount).toFixed(2)}
                    </p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        expense.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : expense.status === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {expense.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No expenses found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;