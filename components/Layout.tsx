
import React from 'react';
import { Activity, User as UserIcon, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  // If no user (e.g., login page), we might render a simpler layout or just children
  // But for this structure, we will assume Layout wraps the internal app only
  if (!user) {
      return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo Area */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 transition-colors">
                <div className="bg-primary-50 p-2 rounded-lg">
                  <Activity size={24} />
                </div>
                <span className="text-xl font-bold tracking-tight text-gray-900">EstomaCare AI</span>
              </Link>
            </div>

            {/* User Profile Area */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-right">
                <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.specialty || 'Especialista'}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold border-2 border-white shadow-sm">
                <UserIcon size={20} />
              </div>
              <div className="border-l border-gray-200 pl-4 ml-2">
                <button 
                    onClick={onLogout}
                    className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                    title="Sair"
                >
                    <LogOut size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
