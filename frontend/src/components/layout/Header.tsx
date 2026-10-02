'use client';

import React from 'react';
import { CreditCardIcon, MenuIcon, SparklesIcon, LogoutIcon } from '@/components/ui/Icons';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  credits?: { remainingCredits: number; totalCredits: number };
  userEmail?: string;
  onLogout: () => void;
  onOpenMobileMenu: () => void;
  onQuickAiSearchClick?: () => void;
}

const TAB_TITLES: Record<string, { title: string; category: string; description: string }> = {
  dashboard: {
    title: 'Platform Overview',
    category: 'Dashboard',
    description: 'Real-time prospecting metrics and pipeline health',
  },
  search: {
    title: 'AI Natural Language Search',
    category: 'Intelligence',
    description: 'Find verified decision makers with conversational prompts',
  },
  people: {
    title: 'People Search',
    category: 'Intelligence',
    description: 'Filter and discover verified leads across industries and seniorities',
  },
  companies: {
    title: 'Company Directory',
    category: 'Intelligence',
    description: 'Search target accounts by industry, size, and location',
  },
  discovery: {
    title: 'Employee Discovery',
    category: 'Prospecting',
    description: 'Crawl company websites and extract team members automatically',
  },
  'decision-makers': {
    title: 'Decision Makers',
    category: 'Prospecting',
    description: 'High-confidence executives, founders, and department leaders',
  },
  'saved-leads': {
    title: 'Saved Leads Repository',
    category: 'Lead Management',
    description: 'Manage, enrich, and export saved prospective contacts',
  },
  'saved-lists': {
    title: 'Saved Lists & Segments',
    category: 'Lead Management',
    description: 'Custom campaigns and outreach target lists',
  },
  usage: {
    title: 'Usage & Statistics',
    category: 'Analytics',
    description: 'Real-time credit allocation and historical activity logs',
  },
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  credits,
  userEmail,
  onLogout,
  onOpenMobileMenu,
  onQuickAiSearchClick,
}) => {
  const currentMeta = TAB_TITLES[activeTab] || {
    title: 'Lead Intelligence',
    category: 'Platform',
    description: 'B2B Lead Generation',
  };

  return (
    <header className="sticky top-0 z-20 h-16 bg-[#0b1120]/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
      {/* Left: Mobile trigger & Breadcrumbs */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Mobile menu button */}
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          aria-label="Open mobile navigation"
        >
          <MenuIcon className="w-5 h-5" />
        </button>

        {/* Section title & Breadcrumb */}
        <div>
          <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-medium">
            <span>Lead Scraper</span>
            <span>/</span>
            <span className="text-slate-500">{currentMeta.category}</span>
            <span>/</span>
            <span className="text-indigo-400 font-semibold">{currentMeta.title}</span>
          </div>
          <h1 className="text-sm sm:text-base font-bold text-white tracking-tight leading-tight">
            {currentMeta.title}
          </h1>
        </div>
      </div>

      {/* Right: Quick actions, live credits, user chip */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Quick AI Search Shortcut */}
        {onQuickAiSearchClick && activeTab !== 'search' && (
          <button
            onClick={onQuickAiSearchClick}
            className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-xs text-slate-300 hover:text-white transition-all shadow-sm"
          >
            <SparklesIcon className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Search</span>
            <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-900 border border-slate-700 text-slate-400 rounded font-mono">
              /
            </kbd>
          </button>
        )}

        {/* Live Credit Badge */}
        {credits && (
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-300 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400"></span>
            <span className="font-bold text-amber-400">{credits.remainingCredits.toLocaleString()}</span>
            <span className="hidden sm:inline text-slate-400 text-[11px]">credits</span>
          </div>
        )}

        {/* Profile Pill */}
        <div className="flex items-center space-x-2.5 pl-2 sm:border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-sm ring-2 ring-slate-800">
            {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-semibold text-slate-200 leading-none">
              {userEmail ? userEmail.split('@')[0] : 'User'}
            </div>
            <div className="text-[10px] text-slate-500 leading-none mt-0.5">Authorized</div>
          </div>
        </div>
      </div>
    </header>
  );
};
