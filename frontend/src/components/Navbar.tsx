import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { 
  Sun, Moon, LayoutDashboard, MapPin, Layers, ListOrdered, 
  AlertTriangle, UploadCloud, FileText, Shield
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { role, switchRole } = useAuth();

  const navItems = [
    { path: '/', label: 'Overview', icon: LayoutDashboard },
    { path: '/map', label: 'Map View', icon: MapPin },
    { path: '/queue', label: 'Priority Queue', icon: ListOrdered },
    { path: '/alerts', label: 'Predictions & Alerts', icon: AlertTriangle },
    { path: '/ingestion', label: 'Data Ingestion', icon: UploadCloud },
    { path: '/reports', label: 'Reports', icon: FileText }
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-gray-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-600 text-white rounded-lg shadow-sm">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                Watershed<span className="text-emerald-600 dark:text-emerald-400">Vision</span> AI
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded">
                v1.0
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-semibold'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Right Utilities: Role Switcher + Dark Mode */}
          <div className="flex items-center space-x-3">
            {/* Persona Switcher for live testing */}
            <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-1 rounded-lg border border-gray-200 dark:border-slate-700">
              <Shield className="w-4 h-4 ml-1.5 text-gray-500 dark:text-gray-400" />
              <button
                onClick={() => switchRole(role === 'admin' ? 'officer' : 'admin')}
                className="px-2 py-1 text-xs font-semibold rounded transition-colors text-gray-700 dark:text-gray-200 hover:text-emerald-600"
                title="Click to toggle user role persona"
              >
                Role: <span className="uppercase text-emerald-600 dark:text-emerald-400 font-bold">{role}</span>
              </button>
            </div>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
