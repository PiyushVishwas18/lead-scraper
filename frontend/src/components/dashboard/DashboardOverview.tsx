'use client';

import React from 'react';
import {
  UsageStats,
  EmployeeLead,
  SavedList,
} from '@/types/lead';
import {
  SearchIcon,
  DiscoveryIcon,
  DecisionMakersIcon,
  SavedListsIcon,
  SparklesIcon,
  ExportIcon,
  MailIcon,
  CheckIcon,
  ChevronRightIcon,
} from '@/components/ui/Icons';
import { Badge, EmailStatusBadge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';

interface DashboardOverviewProps {
  usageStats: UsageStats | null;
  recentLeads: EmployeeLead[];
  savedLists: SavedList[];
  onNavigateTab: (tab: string) => void;
  onSelectLead: (lead: EmployeeLead) => void;
  onExportCsv: (leads: EmployeeLead[]) => void;
  userEmail?: string;
  loadingLeads?: boolean;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  usageStats,
  recentLeads,
  savedLists,
  onNavigateTab,
  onSelectLead,
  onExportCsv,
  userEmail,
  loadingLeads,
}) => {
  const userName = userEmail ? userEmail.split('@')[0] : 'User';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner with Quick Shortcuts */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-[#0e1629] to-indigo-950/40 border border-slate-800/80 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[11px] font-semibold text-indigo-400 mb-3">
            <SparklesIcon className="w-3.5 h-3.5" />
            <span>AI-Powered Lead Intelligence Engine</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Welcome back, <span className="text-indigo-400">{userName}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
            Discover verified executive contacts, crawl company domains for team members, and scale your targeted B2B outreach pipeline.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-5">
            <button
              onClick={() => onNavigateTab('search')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-md shadow-indigo-600/20 transition-all"
            >
              <SparklesIcon className="w-4 h-4" />
              <span>Launch AI Search</span>
            </button>
            <button
              onClick={() => onNavigateTab('discovery')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-xs font-semibold rounded-lg transition-all"
            >
              <DiscoveryIcon className="w-4 h-4 text-emerald-400" />
              <span>Domain Discovery</span>
            </button>
            <button
              onClick={() => onNavigateTab('decision-makers')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-xs font-semibold rounded-lg transition-all"
            >
              <DecisionMakersIcon className="w-4 h-4 text-amber-400" />
              <span>Decision Makers</span>
            </button>
          </div>
        </div>

        {/* Decorative Grid Graphic Accent */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 pointer-events-none bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px]"></div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Remaining Credits */}
        <div className="bg-[#0f172a]/70 border border-slate-800/80 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Remaining Credits</span>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-400 tracking-tight">
            {usageStats ? usageStats.remainingCredits.toLocaleString() : <Skeleton className="h-8 w-20" />}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {usageStats?.totalCredits ? `of ${usageStats.totalCredits.toLocaleString()} allocated` : 'Available to use'}
          </div>
        </div>

        {/* Leads Saved */}
        <div className="bg-[#0f172a]/70 border border-slate-800/80 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Leads Saved</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white tracking-tight">
            {usageStats ? usageStats.totalSaved.toLocaleString() : <Skeleton className="h-8 w-16" />}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">In database repository</div>
        </div>

        {/* Discovered Employees */}
        <div className="bg-[#0f172a]/70 border border-slate-800/80 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Discovered Team</span>
            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
          </div>
          <div className="mt-2 text-2xl font-bold text-indigo-400 tracking-tight">
            {usageStats ? usageStats.totalDiscovered.toLocaleString() : <Skeleton className="h-8 w-16" />}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">From domain crawls</div>
        </div>

        {/* Verified Emails */}
        <div className="bg-[#0f172a]/70 border border-slate-800/80 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Verified Emails</span>
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-400 tracking-tight">
            {usageStats ? usageStats.totalEmailsVerified.toLocaleString() : <Skeleton className="h-8 w-16" />}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {usageStats ? `${usageStats.totalEmailsFound} total emails found` : 'Active verification'}
          </div>
        </div>
      </div>

      {/* Secondary Quick Action & Discovery Pipeline Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigateTab('discovery')}
          className="group cursor-pointer bg-slate-900/50 hover:bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 rounded-xl p-5 transition-all shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <DiscoveryIcon className="w-5 h-5" />
            </div>
            <ChevronRightIcon className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors" />
          </div>
          <h3 className="font-semibold text-white text-sm mt-3">Employee Discovery Pipeline</h3>
          <p className="text-xs text-slate-400 mt-1">
            Input target corporate domains to crawl employee and team directory pages automatically.
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('decision-makers')}
          className="group cursor-pointer bg-slate-900/50 hover:bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 rounded-xl p-5 transition-all shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <DecisionMakersIcon className="w-5 h-5" />
            </div>
            <ChevronRightIcon className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors" />
          </div>
          <h3 className="font-semibold text-white text-sm mt-3">Decision Makers Filter</h3>
          <p className="text-xs text-slate-400 mt-1">
            Isolate C-Level executives, VPs, and Department Heads with validated high-confidence titles.
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('saved-lists')}
          className="group cursor-pointer bg-slate-900/50 hover:bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 rounded-xl p-5 transition-all shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
              <SavedListsIcon className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
              {savedLists.length} lists
            </span>
          </div>
          <h3 className="font-semibold text-white text-sm mt-3">Target Outreach Lists</h3>
          <p className="text-xs text-slate-400 mt-1">
            Organize segmented prospects into dedicated campaign lists ready for export.
          </p>
        </div>
      </div>

      {/* Recent Leads Preview Table */}
      <div className="bg-[#0f172a]/70 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-800/80">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
              Recently Identified Leads
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              High-value prospects from your search and discovery activities
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {recentLeads.length > 0 && (
              <button
                onClick={() => onExportCsv(recentLeads)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-300 transition-colors"
              >
                <ExportIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            )}
            <button
              onClick={() => onNavigateTab('people')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-xs font-semibold text-indigo-300 transition-colors"
            >
              <span>View All</span>
              <ChevronRightIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {loadingLeads ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        ) : recentLeads.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No leads identified yet. Try running an AI search or domain discovery to populate your pipeline.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Work Email</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentLeads.slice(0, 5).map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => onSelectLead(lead)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-300 shrink-0">
                          {lead.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-white flex items-center gap-1.5">
                            <span>{lead.fullName}</span>
                            {lead.isDecisionMaker && (
                              <Badge variant="decisionMaker" size="sm">
                                DM
                              </Badge>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">{lead.jobTitle || 'Team Member'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-200">{lead.companyName}</div>
                      <div className="text-[11px] text-slate-500">
                        {[lead.city, lead.country].filter(Boolean).join(', ') || 'Global'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-slate-300 text-[11px]">
                        {lead.workEmail || <span className="text-slate-500 font-sans">No published email</span>}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <EmailStatusBadge status={lead.emailStatus} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectLead(lead);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700/80 transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
