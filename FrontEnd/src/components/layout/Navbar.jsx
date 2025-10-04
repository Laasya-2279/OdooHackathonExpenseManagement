import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Menu, LogOut, User, Building } from 'lucide-react';

const Navbar = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { user, company, logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onMenuClick}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Expense Manager</h1>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-sm">
              <Building className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700 font-medium">{company?.name}</span>
              <span className="text-gray-400">•</span>
              <span className="text-blue-600 font-semibold">{company?.currency}</span>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;