import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { CheckCircle, XCircle, Clock, User, MessageSquare } from 'lucide-react';

const PendingApprovals = () => {
  const { company } = useContext(AuthContext);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [comments, setComments] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      const response = await api.get('/approvals/pending');
      setApprovals(response.data.data);
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (expenseId) => {
    if (!comments.trim()) {
      alert('Please add comments before approving');
      return;
    }

    setActionLoading(true);
    try {
      await api.post(`/approvals/${expenseId}/approve`, { comments });
      alert('✅ Expense approved successfully!');
      setSelectedApproval(null);
      setComments('');
      fetchPendingApprovals();
    } catch (error) {
      alert('❌ Error: ' + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (expenseId) => {
    if (!comments.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setActionLoading(true);
    try {
      await api.post(`/approvals/${expenseId}/reject`, { comments });
      alert('✅ Expense rejected');
      setSelectedApproval(null);
      setComments('');
      fetchPendingApprovals();
    } catch (error) {
      alert('❌ Error: ' + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(false);
    }
  };

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
        <h1 className="text-3xl font-bold text-gray-900">Pending Approvals</h1>
        <div className="text-sm text-gray-600">
          <span className="font-semibold">{approvals.length}</span> pending approval(s)
        </div>
      </div>

      {approvals.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {approvals.map((approval) => (
            <div
              key={approval.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden border-l-4 border-orange-500"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h2 className="text-xl font-bold text-gray-900">
                        {approval.expense.title}
                      </h2>
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm font-semibold rounded-full">
                        Level {approval.level}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4">{approval.expense.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Employee</p>
                        <div className="flex items-center mt-1">
                          <User className="w-4 h-4 mr-1 text-gray-400" />
                          <p className="font-semibold text-gray-900">
                            {approval.expense.employee?.firstName} {approval.expense.employee?.lastName}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-gray-500">Category</p>
                        <p className="font-semibold text-gray-900 capitalize mt-1">
                          {approval.expense.category}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-gray-500">Date</p>
                        <p className="font-semibold text-gray-900 mt-1">
                          {new Date(approval.expense.date).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-gray-500">Amount</p>
                        <p className="text-2xl font-bold text-blue-600 mt-1">
                          {company.currency} {parseFloat(approval.expense.amount).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedApproval === approval.id ? (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Comments *
                      </label>
                      <textarea
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Add your comments..."
                      />
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApprove(approval.expenseId)}
                        disabled={actionLoading || !comments.trim()}
                        className="flex-1 flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                      >
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Approve
                      </button>
                      
                      <button
                        onClick={() => handleReject(approval.expenseId)}
                        disabled={actionLoading || !comments.trim()}
                        className="flex-1 flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                      >
                        <XCircle className="w-5 h-5 mr-2" />
                        Reject
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedApproval(null);
                          setComments('');
                        }}
                        className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => setSelectedApproval(approval.id)}
                      className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Review & Approve/Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Pending Approvals</h3>
          <p className="text-gray-600">All caught up! There are no expenses waiting for your approval.</p>
        </div>
      )}
    </div>
  );
};

export default PendingApprovals;