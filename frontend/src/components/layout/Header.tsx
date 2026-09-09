'use client';

import React from 'react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  credits?: { remainingCredits: number; totalCredits: number };
  userEmail?: string;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  credits,
  userEmail,
  onLogout,
}) => {
  const navItems = [
    { id: 'search', label: 'Search' },
    { id: 'people', label: 'People' },
    { id: 'companies', label: 'Companies' },
    { id: 'discovery', label: 'Employee Discovery' },
    { id: 'decision-makers', label: 'Decision Makers' },
    { id: 'saved-leads', label: 'Saved Leads' },
    { id: 'saved-lists', label: 'Saved Lists' },
    { id: 'usage', label: 'Usage & Statistics' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('search')}>
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">
              LF
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                Lead Finder
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                PRO
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Menu & User Profile */}
          <div className="flex items-center space-x-4">
            {/* Credit Badge */}
            {credits && (
              <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">
                <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold text-white">{credits.remainingCredits}</span>
                <span className="text-slate-400">credits</span>
              </div>
            )}

            {/* Profile Avatar & Logout */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-bold text-slate-200">
                  {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="hidden lg:inline text-xs font-medium text-slate-300 max-w-[120px] truncate">
                  {userEmail || 'User'}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="text-slate-400 hover:text-rose-400 p-1.5 rounded-md hover:bg-slate-800 transition-colors"
                title="Log Out"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        <div className="md:hidden flex space-x-1 overflow-x-auto py-2 border-t border-slate-800 no-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-2.5 py-1.5 rounded text-xs font-medium whitespace-nowrap ${
                activeTab === item.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
