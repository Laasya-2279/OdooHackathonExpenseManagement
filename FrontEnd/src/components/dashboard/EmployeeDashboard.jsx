import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { Receipt, Plus, Clock, CheckCircle, XCircle, DollarSign } from 'lucide-react';

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const { company } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalExpenses: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalAmount: 0
  });
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/expenses');
      const expenses = response.data.data;

      const pending = expenses.filter(e => e.status === 'processing' || e.status === 'pending').length;
      const approved = expenses.filter(e => e.status === 'approved').length;
      const rejected = expenses.filter(e => e.status === 'rejected').length;
      const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

      setStats({
        totalExpenses: expenses.length,
        pending,
        approved,
        rejected,
        totalAmount: total
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
        <h1 className="text-3xl font-bold text-gray-900">My Expenses</h1>
        <button
          onClick={() => navigate('/expenses/new')}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4 mr-2" />
          Submit New Expense
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Total Expenses"
          value={stats.totalExpenses}
          icon={Receipt}
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          icon={Clock}
          color="text-orange-600"
          bgColor="bg-orange-100"
        />
        <StatCard
          title="Approved"
          value={stats.approved}
          icon={CheckCircle}
          color="text-green-600"
          bgColor="bg-green-100"
        />
        <StatCard
          title="Rejected"
          value={stats.rejected}
          icon={XCircle}
          color="text-red-600"
          bgColor="bg-red-100"
        />
        <StatCard
          title="Total Amount"
          value={`${company.currency} ${stats.totalAmount.toFixed(2)}`}
          icon={DollarSign}
          color="text-purple-600"
          bgColor="bg-purple-100"
        />
      </div>

      {/* Recent Expenses */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Recent Expenses</h2>
          <button
            onClick={() => navigate('/expenses')}
            className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
          >
            View All →
          </button>
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
                    <p className="text-sm text-gray-600">{expense.category}</p>
                    <p className="text-xs text-gray-500 mt-1">{expense.date}</p>
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
            <div className="text-center py-12">
              <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No expenses yet</p>
              <button
                onClick={() => navigate('/expenses/new')}
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Submit your first expense
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;