import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getCountriesWithCurrencies, convertCurrency } from '../services/currencyService';
import api from '../services/api';
import { Receipt, Upload, Loader2, Camera } from 'lucide-react';

const ExpenseForm = () => {
  const navigate = useNavigate();
  const { company } = useContext(AuthContext);
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    originalCurrency: company.currency,
    category: 'other',
    date: new Date().toISOString().split('T')[0],
    receipt: '',
    merchantName: ''
  });
  const [convertedAmount, setConvertedAmount] = useState(null);

  useEffect(() => {
    const fetchCurrencies = async () => {
      const countries = await getCountriesWithCurrencies();
      const uniqueCurrencies = [...new Set(countries.map(c => c.currency))];
      setCurrencies(uniqueCurrencies.sort());
    };
    fetchCurrencies();
  }, []);

  useEffect(() => {
    if (formData.amount && formData.originalCurrency !== company.currency) {
      handleCurrencyConversion();
    } else {
      setConvertedAmount(null);
    }
  }, [formData.amount, formData.originalCurrency]);

  const handleCurrencyConversion = async () => {
    try {
      const result = await convertCurrency(
        parseFloat(formData.amount),
        formData.originalCurrency,
        company.currency
      );
      setConvertedAmount(result);
    } catch (error) {
      console.error('Currency conversion error:', error);
    }
  };

  const handleOCRUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setProcessing(true);
    
    // Simulate OCR processing (in real app, send to OCR API)
    setTimeout(() => {
      // Mock OCR data
      setFormData({
        ...formData,
        title: 'Restaurant Bill',
        amount: '2500',
        merchantName: 'Cafe Delights',
        category: 'food',
        date: new Date().toISOString().split('T')[0]
      });
      setProcessing(false);
      alert('✅ Receipt scanned successfully! Form auto-filled.');
    }, 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const expenseData = {
        ...formData,
        originalAmount: parseFloat(formData.amount),
        amount: convertedAmount ? convertedAmount.convertedAmount : parseFloat(formData.amount),
        companyCurrency: company.currency,
        exchangeRate: convertedAmount?.rate || 1,
        isOCRProcessed: false
      };

      await api.post('/expenses', expenseData);
      alert('✅ Expense submitted successfully!');
      navigate('/expenses');
    } catch (error) {
      alert('❌ Error submitting expense: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Submit New Expense</h1>
          <Receipt className="w-8 h-8 text-blue-600" />
        </div>

        {/* OCR Upload Section */}
        <div className="mb-6 p-4 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50">
          <label className="flex flex-col items-center cursor-pointer">
            <Camera className="w-12 h-12 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-blue-900">Scan Receipt with OCR</span>
            <span className="text-xs text-gray-600 mt-1">Upload receipt to auto-fill form</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleOCRUpload}
              className="hidden"
              disabled={processing}
            />
          </label>
          {processing && (
            <div className="flex items-center justify-center mt-4">
              <Loader2 className="animate-spin mr-2 text-blue-600" />
              <span className="text-sm text-blue-900">Processing receipt...</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expense Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Client Dinner, Travel Expenses"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Additional details about the expense"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency *
              </label>
              <select
                required
                value={formData.originalCurrency}
                onChange={(e) => setFormData({ ...formData, originalCurrency: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {currencies.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {convertedAmount && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <strong>Converted Amount:</strong> {convertedAmount.convertedAmount} {company.currency}
                <span className="text-xs ml-2">(Rate: {convertedAmount.rate.toFixed(4)})</span>
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="travel">Travel</option>
                <option value="food">Food & Dining</option>
                <option value="accommodation">Accommodation</option>
                <option value="transportation">Transportation</option>
                <option value="supplies">Office Supplies</option>
                <option value="entertainment">Entertainment</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Merchant Name (from OCR)
            </label>
            <input
              type="text"
              value={formData.merchantName}
              onChange={(e) => setFormData({ ...formData, merchantName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Restaurant/Store name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Receipt URL (Optional)
            </label>
            <input
              type="text"
              value={formData.receipt}
              onChange={(e) => setFormData({ ...formData, receipt: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/receipt.jpg"
            />
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
                  Submitting...
                </>
              ) : (
                'Submit Expense'
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/expenses')}
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

export default ExpenseForm;