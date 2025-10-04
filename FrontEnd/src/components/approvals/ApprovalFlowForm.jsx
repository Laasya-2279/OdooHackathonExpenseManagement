import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Settings, Loader2, Plus, X } from 'lucide-react';

const ApprovalFlowForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    minAmount: 0,
    maxAmount: '',
    approvalLevels: 1,
    isManagerApprover: true,
    approvalRule: 'sequential',
    percentageRequired: 60,
    specificApproverId: '',
    approverSequence: []
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.data.filter(u => u.role !== 'employee'));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const addApprover = () => {
    setFormData({
      ...formData,
      approverSequence: [
        ...formData.approverSequence,
        { userId: '', step: formData.approverSequence.length + 1, role: 'manager' }
      ]
    });
  };

  const removeApprover = (index) => {
    const newSequence = formData.approverSequence.filter((_, i) => i !== index);
    setFormData({ ...formData, approverSequence: newSequence });
  };

  const updateApprover = (index, field, value) => {
    const newSequence = [...formData.approverSequence];
    newSequence[index][field] = value;
    setFormData({ ...formData, approverSequence: newSequence });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        maxAmount: formData.maxAmount || null,
        specificApproverId: formData.specificApproverId || null,
        percentageRequired: formData.approvalRule === 'percentage' || formData.approvalRule === 'hybrid' 
          ? parseInt(formData.percentageRequired) 
          : null
      };

      await api.post('/approvals/flows', payload);
      alert('✅ Approval flow created successfully!');
      navigate('/approval-flows');
    } catch (error) {
      alert('❌ Error: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create Approval Flow</h1>
          <Settings className="w-8 h-8 text-blue-600" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Flow Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Small Expenses, Large Expenses"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.minAmount}
                  onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Amount (Optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.maxAmount}
                  onChange={(e) => setFormData({ ...formData, maxAmount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Leave empty for no limit"
                />
              </div>
            </div>
          </div>

          {/* Manager Approval */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Manager Approval</h2>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isManagerApprover}
                onChange={(e) => setFormData({ ...formData, isManagerApprover: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label className="ml-2 text-sm text-gray-700">
                Require manager approval first
              </label>
            </div>
            <p className="text-xs text-gray-500">
              If checked, expense will first go to employee's direct manager
            </p>
          </div>

          {/* Approval Rule */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Approval Rule</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rule Type *
              </label>
              <select
                required
                value={formData.approvalRule}
                onChange={(e) => setFormData({ ...formData, approvalRule: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="sequential">Sequential (Multi-level)</option>
                <option value="percentage">Percentage-based</option>
                <option value="specific_approver">Specific Approver (Auto-approve)</option>
                <option value="hybrid">Hybrid (Percentage OR Specific Approver)</option>
              </select>
            </div>

            {/* Sequential Approval */}
            {formData.approvalRule === 'sequential' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Approval Levels *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    required
                    value={formData.approvalLevels}
                    onChange={(e) => setFormData({ ...formData, approvalLevels: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Approver Sequence (Optional)
                  </label>
                  <div className="space-y-2">
                    {formData.approverSequence.map((approver, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <span className="text-sm font-medium text-gray-700 w-16">
                          Step {approver.step}:
                        </span>
                        <select
                          value={approver.userId}
                          onChange={(e) => updateApprover(index, 'userId', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="">Select Approver</option>
                          {users.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.firstName} {user.lastName} ({user.role})
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => removeApprover(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addApprover}
                      className="flex items-center text-blue-600 hover:text-blue-700 text-sm"
                    >
                      <Plus size={16} className="mr-1" />
                      Add Approver
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Percentage Rule */}
            {(formData.approvalRule === 'percentage' || formData.approvalRule === 'hybrid') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Percentage Required *
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={formData.percentageRequired}
                  onChange={(e) => setFormData({ ...formData, percentageRequired: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="60"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Expense approved if this percentage of approvers approve
                </p>
              </div>
            )}

            {/* Specific Approver */}
            {(formData.approvalRule === 'specific_approver' || formData.approvalRule === 'hybrid') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specific Approver (e.g., CFO, Director) *
                </label>
                <select
                  required
                  value={formData.specificApproverId}
                  onChange={(e) => setFormData({ ...formData, specificApproverId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Approver</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.role})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  If this person approves, expense is auto-approved
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition duration-200 flex items-center justify-center disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={20} />
                  Creating...
                </>
              ) : (
                'Create Approval Flow'
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/approval-flows')}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApprovalFlowForm;