'use client';

import React from 'react';
import { SearchFilterRequest } from '@/types/lead';

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

  return (
    <aside className="w-full lg:w-72 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col space-y-5 shadow-lg">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Advanced Filters</h3>
        </div>
        <button
          onClick={onClear}
          className="text-xs text-slate-400 hover:text-rose-400 transition-colors"
        >
          Reset All
        </button>
      </div>

      {/* PERSON FILTERS */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Person</h4>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Job Title</label>
          <input
            type="text"
            value={filters.jobTitle || ''}
            onChange={(e) => handleChange('jobTitle', e.target.value)}
            placeholder="e.g. CTO, Director"
            className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Department</label>
          <select
            value={filters.department || ''}
            onChange={(e) => handleChange('department', e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-indigo-500"
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
          <label className="block text-xs font-medium text-slate-300 mb-1">Seniority</label>
          <select
            value={filters.seniority || ''}
            onChange={(e) => handleChange('seniority', e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Seniorities</option>
            <option value="EXECUTIVE">Executive / C-Level</option>
            <option value="DIRECTOR">Director / VP</option>
            <option value="MANAGER">Manager</option>
            <option value="SENIOR">Senior</option>
            <option value="JUNIOR">Junior</option>
          </select>
        </div>
      </div>

      {/* COMPANY FILTERS */}
      <div className="space-y-3 pt-3 border-t border-slate-800">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Company</h4>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Company Name</label>
          <input
            type="text"
            value={filters.companyName || ''}
            onChange={(e) => handleChange('companyName', e.target.value)}
            placeholder="e.g. Acme Corp"
            className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Industry</label>
          <input
            type="text"
            value={filters.industry || ''}
            onChange={(e) => handleChange('industry', e.target.value)}
            placeholder="e.g. SaaS, Fintech"
            className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Company Size</label>
          <select
            value={filters.companySize || ''}
            onChange={(e) => handleChange('companySize', e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">Any Size</option>
            <option value="1-10">1-10 employees</option>
            <option value="11-50">11-50 employees</option>
            <option value="51-200">51-200 employees</option>
            <option value="201-500">201-500 employees</option>
            <option value="500+">500+ employees</option>
          </select>
        </div>
      </div>

      {/* LOCATION FILTERS */}
      <div className="space-y-3 pt-3 border-t border-slate-800">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Location</h4>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">City</label>
          <input
            type="text"
            value={filters.city || ''}
            onChange={(e) => handleChange('city', e.target.value)}
            placeholder="e.g. Mumbai, London"
            className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Country</label>
          <input
            type="text"
            value={filters.country || ''}
            onChange={(e) => handleChange('country', e.target.value)}
            placeholder="e.g. India, United States"
            className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* CONTACT & LEAD FILTERS */}
      <div className="space-y-3 pt-3 border-t border-slate-800">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact & Lead</h4>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Email Status</label>
          <select
            value={filters.emailStatus || ''}
            onChange={(e) => handleChange('emailStatus', e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Email Statuses</option>
            <option value="VALID">Valid Email</option>
            <option value="UNKNOWN">Unknown / MX Only</option>
            <option value="INVALID">Invalid Email</option>
            <option value="NOT_CHECKED">Not Checked</option>
          </select>
        </div>
        <div className="flex items-center space-x-2 pt-1">
          <input
            type="checkbox"
            id="isDecisionMaker"
            checked={filters.isDecisionMaker || false}
            onChange={(e) => handleChange('isDecisionMaker', e.target.checked ? true : undefined)}
            className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="isDecisionMaker" className="text-xs text-slate-300 font-medium cursor-pointer">
            Decision Makers Only
          </label>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="pt-4 border-t border-slate-800 flex items-center space-x-2">
        <button
          onClick={onApply}
          className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded transition-colors"
        >
          Apply Filters
        </button>
        <button
          onClick={onClear}
          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded transition-colors"
        >
          Clear
        </button>
      </div>
    </aside>
  );
};
