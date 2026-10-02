'use client';

import React from 'react';
import {
  DashboardIcon,
  SearchIcon,
  PeopleIcon,
  CompaniesIcon,
  DiscoveryIcon,
  DecisionMakersIcon,
  SavedLeadsIcon,
  SavedListsIcon,
  UsageIcon,
  LogoutIcon,
  CreditCardIcon,
  CloseIcon,
} from '@/components/ui/Icons';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  credits?: { remainingCredits: number; totalCredits: number };
  userEmail?: string;
  onLogout: () => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  savedLeadsCount?: number;
  savedListsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  credits,
  userEmail,
  onLogout,
  isOpenMobile,
  setIsOpenMobile,
  savedLeadsCount,
  savedListsCount,
}) => {
  const navSections: { title: string; items: NavItem[] }[] = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
      ],
    },
    {
      title: 'INTELLIGENCE & SEARCH',
      items: [
        { id: 'search', label: 'AI Search', icon: SearchIcon },
        { id: 'people', label: 'People Search', icon: PeopleIcon },
        { id: 'companies', label: 'Company Search', icon: CompaniesIcon },
      ],
    },
    {
      title: 'PROSPECTING',
      items: [
        { id: 'discovery', label: 'Employee Discovery', icon: DiscoveryIcon },
        { id: 'decision-makers', label: 'Decision Makers', icon: DecisionMakersIcon },
      ],
    },
    {
      title: 'LEAD MANAGEMENT',
      items: [
        {
          id: 'saved-leads',
          label: 'Saved Leads',
          icon: SavedLeadsIcon,
          badge: savedLeadsCount !== undefined && savedLeadsCount > 0 ? savedLeadsCount : undefined,
        },
        {
          id: 'saved-lists',
          label: 'Saved Lists',
          icon: SavedListsIcon,
          badge: savedListsCount !== undefined && savedListsCount > 0 ? savedListsCount : undefined,
        },
      ],
    },
    {
      title: 'ANALYTICS',
      items: [
        { id: 'usage', label: 'Usage & Statistics', icon: UsageIcon },
      ],
    },
  ];

  const handleSelectTab = (id: string) => {
    setActiveTab(id);
    setIsOpenMobile(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0b1120] border-r border-slate-800/80 text-slate-300 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80">
        <div
          onClick={() => handleSelectTab('dashboard')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-600/30 group-hover:scale-105 transition-transform">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-sm tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                Lead Scraper
              </span>
              <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                PRO
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium block">
              B2B Lead Intelligence
            </span>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={() => setIsOpenMobile(false)}
          className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Close sidebar"
        >
          <CloseIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {section.title}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon
                        className={`w-4 h-4 transition-colors ${
                          isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isActive
                            ? 'bg-indigo-500/30 text-indigo-200'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Credits Card Widget */}
      {credits && (
        <div className="p-3 mx-3 mb-3 rounded-xl bg-slate-900/90 border border-slate-800/90 shadow-sm">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center space-x-1.5 text-slate-400">
              <CreditCardIcon className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-slate-300 text-[11px]">Usage Credits</span>
            </div>
            <span className="font-bold text-amber-400 text-xs">
              {credits.remainingCredits.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-indigo-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(
                  100,
                  credits.totalCredits > 0
                    ? Math.round((credits.remainingCredits / credits.totalCredits) * 100)
                    : 100
                )}%`,
              }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-slate-500">
            <span>Remaining balance</span>
            <span>{credits.totalCredits > 0 ? `${credits.totalCredits} total` : ''}</span>
          </div>
        </div>
      )}

      {/* User Profile & Logout Bottom Bar */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
              {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-200 truncate">
                {userEmail ? userEmail.split('@')[0] : 'Account'}
              </div>
              <div className="text-[10px] text-slate-500 truncate" title={userEmail}>
                {userEmail || 'Active session'}
              </div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition-colors shrink-0"
            title="Log Out"
            aria-label="Log Out"
          >
            <LogoutIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpenMobile(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#0b1120] z-50">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
