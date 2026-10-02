'use client';

import React from 'react';
import { SearchFilterRequest } from '@/types/lead';
import { FilterIcon } from '@/components/ui/Icons';

interface FilterSidebarProps {
  filters: SearchFilterRequest;
  setFilters: React.Dispatch<React.SetStateAction<SearchFilterRequest>>;
  onApply: () => void;
  onClear: () => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  setFilters,
  onApply,
  onClear,
}) => {
  const handleChange = (field: keyof SearchFilterRequest, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value === '' ? undefined : value,
    }));
  };

  // Count active filters
  const activeCount = [
    filters.jobTitle,
    filters.department,
    filters.seniority,
    filters.companyName,
    filters.industry,
    filters.companySize,
    filters.city,
    filters.country,
    filters.emailStatus,
    filters.isDecisionMaker,
  ].filter(Boolean).length;

  return (
    <aside className="w-full lg:w-72 bg-[#0f172a]/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col space-y-5 shadow-xl h-fit backdrop-blur-sm">
      {/* Header with active counter */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          <FilterIcon className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Filters
          </h3>
          {activeCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </div>
        <button
          onClick={onClear}
          className="text-[11px] font-medium text-slate-400 hover:text-rose-400 transition-colors"
        >
          Reset All
        </button>
      </div>

      {/* PERSON SECTION */}
      <div className="space-y-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Person Criteria
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-300 mb-1">
            Job Title
          </label>
          <input
            type="text"
            value={filters.jobTitle || ''}
            onChange={(e) => handleChange('jobTitle', e.target.value)}
            placeholder="e.g. CTO, VP of Product"
            className="w-full px-3 py-1.5 bg-[#0b1120] border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-300 mb-1">
            Department
          </label>
          <select
            value={filters.department || ''}
            onChange={(e) => handleChange('department', e.target.value)}
            className="w-full px-3 py-1.5 bg-[#0b1120] border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Marketing">Marketing</option>
            <option value="Sales">Sales</option>
            <option value="Executive">Executive</option>
            <option value="Finance">Finance</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Product">Product</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-300 mb-1">
            Seniority Level
          </label>
          <select
            value={filters.seniority || ''}
            onChange={(e) => handleChange('seniority', e.target.value)}
            className="w-full px-3 py-1.5 bg-[#0b1120] border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="">All Levels</option>
            <option value="EXECUTIVE">Executive / C-Level</option>
            <option value="DIRECTOR">Director / VP</option>
            <option value="MANAGER">Manager</option>
            <option value="SENIOR">Senior Specialist</option>
            <option value="JUNIOR">Entry / Junior</option>
          </select>
        </div>
      </div>

      {/* COMPANY SECTION */}
      <div className="space-y-3 pt-3.5 border-t border-slate-800/80">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Target Organization
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-300 mb-1">
            Company Name
          </label>
          <input
            type="text"
            value={filters.companyName || ''}
            onChange={(e) => handleChange('companyName', e.target.value)}
            placeholder="e.g. Stripe, Acme Corp"
            className="w-full px-3 py-1.5 bg-[#0b1120] border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-300 mb-1">
            Industry / Sector
          </label>
          <input
            type="text"
            value={filters.industry || ''}
            onChange={(e) => handleChange('industry', e.target.value)}
            placeholder="e.g. SaaS, Fintech, AI"
            className="w-full px-3 py-1.5 bg-[#0b1120] border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-300 mb-1">
            Headcount Size
          </label>
          <select
            value={filters.companySize || ''}
            onChange={(e) => handleChange('companySize', e.target.value)}
            className="w-full px-3 py-1.5 bg-[#0b1120] border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="">Any Size</option>
            <option value="1-10">1 - 10 employees</option>
            <option value="11-50">11 - 50 employees</option>
            <option value="51-200">51 - 200 employees</option>
            <option value="201-500">201 - 500 employees</option>
            <option value="500+">500+ enterprise</option>
          </select>
        </div>
      </div>

      {/* LOCATION SECTION */}
      <div className="space-y-3 pt-3.5 border-t border-slate-800/80">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Geographic Location
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              City
            </label>
            <input
              type="text"
              value={filters.city || ''}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder="e.g. London"
              className="w-full px-2.5 py-1.5 bg-[#0b1120] border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Country
            </label>
            <input
              type="text"
              value={filters.country || ''}
              onChange={(e) => handleChange('country', e.target.value)}
              placeholder="e.g. UK, India"
              className="w-full px-2.5 py-1.5 bg-[#0b1120] border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* VERIFICATION & ROLE FILTERS */}
      <div className="space-y-3 pt-3.5 border-t border-slate-800/80">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Verification & Role
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-300 mb-1">
            Email Verification
          </label>
          <select
            value={filters.emailStatus || ''}
            onChange={(e) => handleChange('emailStatus', e.target.value)}
            className="w-full px-3 py-1.5 bg-[#0b1120] border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="">All Statuses</option>
            <option value="VALID">Verified Deliverable</option>
            <option value="UNKNOWN">Accept-all / MX Only</option>
            <option value="INVALID">Invalid / Bounce</option>
            <option value="NOT_CHECKED">Unverified</option>
          </select>
        </div>

        <label className="flex items-center space-x-2.5 pt-1 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filters.isDecisionMaker || false}
            onChange={(e) => handleChange('isDecisionMaker', e.target.checked ? true : undefined)}
            className="w-4 h-4 rounded border-slate-700 bg-[#0b1120] text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
          <span className="text-xs text-slate-200 font-medium">
            Decision Makers Only
          </span>
        </label>
      </div>

      {/* ACTION BUTTONS */}
      <div className="pt-4 border-t border-slate-800/80 flex items-center space-x-2">
        <button
          onClick={onApply}
          className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors"
        >
          Apply Filters
        </button>
        <button
          onClick={onClear}
          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-lg border border-slate-700/80 transition-colors"
        >
          Clear
        </button>
      </div>
    </aside>
  );
};
