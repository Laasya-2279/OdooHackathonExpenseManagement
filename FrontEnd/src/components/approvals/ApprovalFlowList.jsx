import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { GitBranch, Plus, Edit, Trash2, DollarSign, CheckCircle } from 'lucide-react';

const ApprovalFlowList = () => {
  const navigate = useNavigate();
  const { company } = useContext(AuthContext);
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFlows();
  }, []);

  const fetchFlows = async () => {
    try {
      const response = await api.get('/approvals/flows');
      setFlows(response.data.data);
    } catch (error) {
      console.error('Error fetching approval flows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (flowId) => {
    if (!window.confirm('Are you sure you want to deactivate this approval flow?')) {
      return;
    }

    try {
      await api.delete(`/approvals/flows/${flowId}`);
      alert('Approval flow deactivated successfully');
      fetchFlows();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.message || error.message));
    }
  };

  const getRuleLabel = (rule) => {
    const labels = {
      sequential: 'Sequential Multi-level',
      percentage: 'Percentage-based',
      specific_approver: 'Specific Approver',
      hybrid: 'Hybrid (Percentage + Specific)'
    };
    return labels[rule] || rule;
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
        <h1 className="text-3xl font-bold text-gray-900">Approval Flows</h1>
        <button
          onClick={() => navigate('/approval-flows/new')}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Flow
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Tip:</strong> Approval flows define how expenses are approved based on amount ranges. 
          Configure multi-level approvals, percentage rules, or specific approvers for different expense amounts.
        </p>
      </div>

      {flows.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {flows.map((flow) => (
            <div
              key={flow.id}
              className={`bg-white rounded-lg shadow-lg overflow-hidden border-l-4 ${
                flow.isActive ? 'border-green-500' : 'border-gray-300'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <GitBranch className="w-6 h-6 text-blue-600" />
                      <h2 className="text-xl font-bold text-gray-900">{flow.name}</h2>
                      {flow.isActive && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-gray-500">Amount Range</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {company.currency} {parseFloat(flow.minAmount).toFixed(2)} 
                          {flow.maxAmount ? ` - ${company.currency} ${parseFloat(flow.maxAmount).toFixed(2)}` : '+'}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Approval Levels</p>
                        <p className="text-sm font-semibold text-gray-900">{flow.approvalLevels} Level(s)</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Rule Type</p>
                        <p className="text-sm font-semibold text-gray-900">{getRuleLabel(flow.approvalRule)}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Manager Approval</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {flow.isManagerApprover ? (
                            <span className="flex items-center text-green-600">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Required
                            </span>
                          ) : (
                            <span className="text-gray-400">Not Required</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Additional Rule Details */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      {flow.approvalRule === 'percentage' || flow.approvalRule === 'hybrid' ? (
                        <div className="text-sm text-gray-600">
                          <strong>Percentage Required:</strong> {flow.percentageRequired}% of approvers
                        </div>
                      ) : null}
                      
                      {flow.approvalRule === 'specific_approver' || flow.approvalRule === 'hybrid' ? (
                        <div className="text-sm text-gray-600">
                          <strong>Specific Approver:</strong> Auto-approve when specific person approves
                        </div>
                      ) : null}
                      
                      {flow.approverSequence && flow.approverSequence.length > 0 ? (
                        <div className="text-sm text-gray-600 mt-2">
                          <strong>Approver Sequence:</strong> {flow.approverSequence.length} defined approvers
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => navigate(`/approval-flows/${flow.id}/edit`)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(flow.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      disabled={!flow.isActive}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <GitBranch className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Approval Flows</h3>
          <p className="text-gray-600 mb-4">Create your first approval flow to start managing expense approvals.</p>
          <button
            onClick={() => navigate('/approval-flows/new')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Flow
          </button>
        </div>
      )}
    </div>
  );
};

export default ApprovalFlowList;