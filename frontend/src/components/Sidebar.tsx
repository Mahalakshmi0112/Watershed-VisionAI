import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Sun, Moon, LayoutDashboard, MapPin,
  AlertTriangle, Layers,
  ChevronLeft, ChevronRight, Shield, User, FlaskConical, Loader2, Waves,
  Languages
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { role, switchRole, isLoggingIn } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/', label: t('nav.overview'), icon: LayoutDashboard, exact: true },
    { path: '/map', label: t('nav.map_view'), icon: MapPin },
    { path: '/alerts', label: t('nav.alerts'), icon: AlertTriangle },
    { path: '/watershed-validation', label: t('nav.watershed_validation'), icon: FlaskConical },
    { path: '/secondary-evidence', label: t('nav.secondary_evidence'), icon: Waves },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={`
        flex flex-col h-screen sticky top-0
        bg-slate-900 dark:bg-slate-950 text-white
        border-r border-slate-800
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-16' : 'w-64'}
        flex-shrink-0
      `}
    >
      {/* Logo + Collapse Toggle */}
      <div className={`flex items-center h-16 px-3 border-b border-slate-800 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="p-1.5 bg-emerald-600 text-white rounded-lg flex-shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div className="leading-tight">
              <span className="text-sm font-bold tracking-tight text-white whitespace-nowrap">
                Watershed<span className="text-emerald-400">Vision</span>
              </span>
              <span className="block text-[10px] text-slate-400 font-medium tracking-wider uppercase">
                {t('app.subtitle')}
              </span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
            <Layers className="w-5 h-5" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ${collapsed ? 'absolute -right-3 bg-slate-800 border border-slate-700 shadow-md' : ''}`}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const active = isActive(item.path, item.exact);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={`
                flex items-center rounded-lg transition-colors group
                ${collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5 space-x-3'}
                ${active
                  ? 'bg-emerald-600/20 text-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }
              `}
            >
              <item.icon className={`flex-shrink-0 ${collapsed ? 'w-5 h-5' : 'w-4 h-4'} ${active ? 'text-emerald-400' : ''}`} />
              {!collapsed && (
                <span className="text-sm whitespace-nowrap">{item.label}</span>
              )}
              {active && !collapsed && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Section: Language + Role + Theme */}
      <div className="border-t border-slate-800 p-3 space-y-2">

        {/* Language Toggle Button */}
        <button
          onClick={toggleLanguage}
          className={`w-full flex items-center rounded-lg py-2 px-2.5 bg-slate-800 hover:bg-emerald-950/60 hover:border-emerald-700/60 border border-slate-700 transition-all text-emerald-400 font-medium ${collapsed ? 'justify-center' : 'justify-between'}`}
          title={language === 'en' ? 'தமிழில் மாற்றவும் (Switch to Tamil)' : 'Switch to English'}
        >
          <div className="flex items-center space-x-2">
            <Languages className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            {!collapsed && (
              <span className="text-xs font-semibold text-white">
                {language === 'en' ? 'Language' : 'மொழி'}
              </span>
            )}
          </div>
          {!collapsed && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-600 text-white shadow-sm tracking-wide">
              {language === 'en' ? 'தமிழ்' : 'English'}
            </span>
          )}
        </button>

        {/* Demo Mode: GEE Info */}
        {!collapsed && (
          <div className="flex items-center space-x-2 px-2 py-1.5 rounded-lg bg-amber-950/40 border border-amber-800/40">
            <FlaskConical className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span className="text-[10px] text-amber-300 font-medium leading-tight">
              {t('demo.mode_notice')}
            </span>
          </div>
        )}

        {/* Role Indicator + Switch */}
        <div
          className={`flex items-center rounded-lg bg-slate-800 border border-slate-700 p-2 ${collapsed ? 'justify-center' : 'space-x-2'}`}
          title={collapsed ? `${t('role.viewing_as')}: ${role}` : undefined}
        >
          {isLoggingIn
            ? <Loader2 className="w-4 h-4 text-slate-400 animate-spin flex-shrink-0" />
            : role === 'admin'
              ? <Shield className="w-4 h-4 text-violet-400 flex-shrink-0" />
              : <User className="w-4 h-4 text-sky-400 flex-shrink-0" />
          }
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{t('role.viewing_as')}</p>
              <p className={`text-xs font-bold capitalize ${role === 'admin' ? 'text-violet-300' : 'text-sky-300'}`}>
                {isLoggingIn ? '...' : role === 'admin' ? t('role.admin') : t('role.field_officer')}
              </p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={() => switchRole(role === 'admin' ? 'officer' : 'admin')}
              disabled={isLoggingIn}
              className="text-[10px] text-slate-400 hover:text-white border border-slate-600 rounded px-1.5 py-0.5 transition-colors whitespace-nowrap disabled:opacity-40"
              title="Switch demo role"
            >
              {t('role.switch')}
            </button>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`w-full flex items-center rounded-lg py-2 px-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ${collapsed ? 'justify-center' : 'space-x-2'}`}
          aria-label="Toggle theme"
          title={isDarkMode ? t('theme.light_mode') : t('theme.dark_mode')}
        >
          {isDarkMode
            ? <Sun className="w-4 h-4 text-amber-400 flex-shrink-0" />
            : <Moon className="w-4 h-4 text-slate-400 flex-shrink-0" />
          }
          {!collapsed && (
            <span className="text-xs">{isDarkMode ? t('theme.light_mode') : t('theme.dark_mode')}</span>
          )}
        </button>
      </div>
    </aside>
  );
};

