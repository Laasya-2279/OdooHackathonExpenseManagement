import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { Receipt, Clock, CheckCircle, XCircle, Users, DollarSign } from 'lucide-react';

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const { company } = useContext(AuthContext);
  const [stats, setStats] = useState({
    pendingApprovals: 0,
    teamExpenses: 0,
    approvedCount: 0,
    rejectedCount: 0
  });
  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [pendingRes, expensesRes] = await Promise.all([
        api.get('/approvals/pending'),
        api.get('/expenses')
      ]);

      const pending = pendingRes.data.data;
      const expenses = expensesRes.data.data;

      const approved = expenses.filter(e => e.status === 'approved').length;
      const rejected = expenses.filter(e => e.status === 'rejected').length;

      setStats({
        pendingApprovals: pending.length,
        teamExpenses: expenses.length,
        approvedCount: approved,
        rejectedCount: rejected
      });

      setPendingExpenses(pending.slice(0, 5));
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
        <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
        <button
          onClick={() => navigate('/expenses/new')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Submit Expense
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          icon={Clock}
          color="text-orange-600"
          bgColor="bg-orange-100"
        />
        <StatCard
          title="Team Expenses"
          value={stats.teamExpenses}
          icon={Receipt}
          color="text-purple-600"
          bgColor="bg-purple-100"
        />
        <StatCard
          title="Approved"
          value={stats.approvedCount}
          icon={CheckCircle}
          color="text-green-600"
          bgColor="bg-green-100"
        />
        <StatCard
          title="Rejected"
          value={stats.rejectedCount}
          icon={XCircle}
          color="text-red-600"
          bgColor="bg-red-100"
        />
      </div>

      {/* Pending Approvals */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Pending Approvals</h2>
          <button
            onClick={() => navigate('/pending-approvals')}
            className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
          >
            View All →
          </button>
        </div>
        <div className="p-6">
          {pendingExpenses.length > 0 ? (
            <div className="space-y-4">
              {pendingExpenses.map((approval) => (
                <div
                  key={approval.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg cursor-pointer transition"
                  onClick={() => navigate('/pending-approvals')}
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{approval.expense.title}</h3>
                    <p className="text-sm text-gray-600">
                      {approval.expense.employee?.firstName} {approval.expense.employee?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{approval.expense.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {company.currency} {parseFloat(approval.expense.amount).toFixed(2)}
                    </p>
                    <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                      Level {approval.level}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No pending approvals</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;